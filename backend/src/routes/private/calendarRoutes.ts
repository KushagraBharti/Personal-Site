import { Router } from "express";
import { requireUser } from "../../middleware/requireUser";
import {
  createGoogleOAuthState,
  createGoogleOAuthUrl,
  exchangeGoogleOAuthCode,
  parseGoogleOAuthState,
} from "../../services/private/googleCalendarOAuthService";
import {
  disconnectGoogleCalendarForUser,
  getCalendarStatusForUser,
  processCalendarSyncJobs,
  queueFullBackfill,
  renewCalendarWatchForUser,
  upsertGoogleConnectionFromOAuth,
  upsertListSyncSetting,
} from "../../services/private/taskCalendarSyncService";
import { getSupabaseAdmin } from "../../services/private/calendarSyncQueueService";
import { handleGoogleWebhook } from "../../services/private/calendarWebhookService";

const router = Router();

const getFrontendTrackerUrl = () =>
  process.env.TRACKER_FRONTEND_URL || "http://localhost:5173/tracker?module=tasks";
const isCalendarSyncEnabled = () => process.env.CALENDAR_SYNC_ENABLED !== "0";

router.post("/google/webhook", async (req, res) => {
  if (!isCalendarSyncEnabled()) return res.status(200).json({ ok: true, disabled: true });
  try {
    const supabaseAdmin = getSupabaseAdmin();
    await handleGoogleWebhook(supabaseAdmin, req.headers as Record<string, string | string[] | undefined>);
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Google webhook handling failed", error);
    return res.status(200).json({ ok: true });
  }
});

router.post("/google/connect-url", requireUser, async (req, res) => {
  if (!isCalendarSyncEnabled()) return res.status(503).json({ error: "Calendar sync disabled" });
  try {
    const state = createGoogleOAuthState(req.user!.id);
    const url = createGoogleOAuthUrl(state);
    return res.json({ url });
  } catch (error) {
    console.error("Failed to generate Google connect URL", error);
    return res.status(500).json({ error: "Failed to generate Google connect URL" });
  }
});

router.get("/google/callback", async (req, res) => {
  const code = typeof req.query.code === "string" ? req.query.code : "";
  const state = typeof req.query.state === "string" ? req.query.state : "";
  const err = typeof req.query.error === "string" ? req.query.error : "";
  const redirectBase = getFrontendTrackerUrl();
  if (!isCalendarSyncEnabled()) {
    return res.redirect(`${redirectBase}&calendar=error&reason=calendar_sync_disabled`);
  }

  if (err) {
    return res.redirect(`${redirectBase}&calendar=error&reason=${encodeURIComponent(err)}`);
  }
  if (!code || !state) {
    return res.redirect(`${redirectBase}&calendar=error&reason=missing_code_or_state`);
  }

  try {
    const userId = parseGoogleOAuthState(state);
    const tokens = await exchangeGoogleOAuthCode(code);
    const supabaseAdmin = getSupabaseAdmin();

    await upsertGoogleConnectionFromOAuth({
      supabaseAdmin,
      userId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresInSeconds: tokens.expires_in || 3600,
    });

    return res.redirect(`${redirectBase}&calendar=connected`);
  } catch (error) {
    console.error("Google OAuth callback failed", error);
    return res.redirect(`${redirectBase}&calendar=error&reason=oauth_callback_failed`);
  }
});

router.get("/status", requireUser, async (req, res) => {
  if (!isCalendarSyncEnabled()) return res.json({ connected: false, connection: null, watch_expires_at: null, list_sync_settings: [] });
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const status = await getCalendarStatusForUser(supabaseAdmin, req.user!.id);
    return res.json(status);
  } catch (error) {
    console.error("Failed to fetch calendar status", error);
    return res.status(500).json({ error: "Failed to fetch calendar status" });
  }
});

router.post("/select-calendar", requireUser, async (req, res) => {
  if (!isCalendarSyncEnabled()) return res.status(503).json({ error: "Calendar sync disabled" });
  const calendarId = typeof req.body?.calendar_id === "string" ? req.body.calendar_id.trim() : "";
  const calendarSummary =
    typeof req.body?.calendar_summary === "string" ? req.body.calendar_summary.trim() : null;
  if (!calendarId) {
    return res.status(400).json({ error: "calendar_id is required" });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const userId = req.user!.id;

    const { error } = await supabaseAdmin
      .from("tracker_google_calendar_connections_public")
      .update({
        selected_calendar_id: calendarId,
        selected_calendar_summary: calendarSummary || calendarId,
        status: "connected",
        last_error: null,
      })
      .eq("user_id", userId);
    if (error) throw new Error(error.message);

    await supabaseAdmin
      .from("tracker_google_calendar_connections_secrets")
      .update({ sync_token: null })
      .eq("user_id", userId);

    await renewCalendarWatchForUser(supabaseAdmin, userId);
    await queueFullBackfill(supabaseAdmin, userId);
    return res.json({ ok: true });
  } catch (error) {
    console.error("Failed to select calendar", error);
    return res.status(500).json({ error: "Failed to select calendar" });
  }
});

router.post("/disconnect", requireUser, async (req, res) => {
  if (!isCalendarSyncEnabled()) return res.status(503).json({ error: "Calendar sync disabled" });
  try {
    const supabaseAdmin = getSupabaseAdmin();
    await disconnectGoogleCalendarForUser(supabaseAdmin, req.user!.id);
    return res.json({ ok: true });
  } catch (error) {
    console.error("Failed to disconnect Google Calendar", error);
    return res.status(500).json({ error: "Failed to disconnect Google Calendar" });
  }
});

router.post("/list-sync", requireUser, async (req, res) => {
  if (!isCalendarSyncEnabled()) return res.status(503).json({ error: "Calendar sync disabled" });
  const listId = typeof req.body?.list_id === "string" ? req.body.list_id.trim() : "";
  const syncEnabled = !!req.body?.sync_enabled;
  if (!listId) {
    return res.status(400).json({ error: "list_id is required" });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const userId = req.user!.id;
    await upsertListSyncSetting(supabaseAdmin, userId, listId, syncEnabled);
    if (syncEnabled) {
      await queueFullBackfill(supabaseAdmin, userId, listId);
    }
    return res.json({ ok: true });
  } catch (error) {
    console.error("Failed to update list sync setting", error);
    return res.status(500).json({ error: "Failed to update list sync setting" });
  }
});

router.post("/sync-now", requireUser, async (req, res) => {
  if (!isCalendarSyncEnabled()) return res.status(503).json({ error: "Calendar sync disabled" });
  try {
    const results = await processCalendarSyncJobs({ userId: req.user!.id, batchSize: 40 });
    const processed = results.length;
    const failed = results.filter((item) => !item.ok).length;
    return res.json({ ok: true, processed, failed });
  } catch (error) {
    console.error("Failed to sync calendar now", error);
    return res.status(500).json({ error: "Failed to sync calendar" });
  }
});

export default router;
