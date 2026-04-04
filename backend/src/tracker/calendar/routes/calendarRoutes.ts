import { Router } from "express";
import { requireUser } from "../../../middleware/requireUser";
import {
  createGoogleOAuthState,
  createGoogleOAuthUrl,
  exchangeGoogleOAuthCode,
  parseGoogleOAuthState,
} from "../services/googleCalendarOAuthService";
import {
  disconnectGoogleCalendarForUser,
  getCalendarStatusForUser,
  getSyncRunDebug,
  getSyncProgressForRun,
  inferLanesForRunMode,
  isCalendarRebuildSchemaUnavailable,
  processCalendarSyncJobs,
  queueLivePumpForUser,
  queueManualSyncForUser,
  queueRebuildRunForUser,
  queueFullBackfill,
  rebuildCalendarLegacyInlineForUser,
  renewCalendarWatchForUser,
  runLegacyManualSyncForUser,
  upsertGoogleConnectionFromOAuth,
  upsertListSyncSetting,
} from "../services/taskCalendarSyncService";
import { getSupabaseAdmin } from "../services/calendarSyncQueueService";
import { handleGoogleWebhook } from "../services/calendarWebhookService";

const router = Router();

const getFrontendTrackerUrl = () =>
  process.env.TRACKER_FRONTEND_URL || "http://localhost:5173/tracker?module=tasks";
const isCalendarSyncEnabled = () => process.env.CALENDAR_SYNC_ENABLED !== "0";

router.post("/google/webhook", async (req, res) => {
  if (!isCalendarSyncEnabled()) return res.status(200).json({ ok: true, disabled: true });
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const webhookMeta = await handleGoogleWebhook(
      supabaseAdmin,
      req.headers as Record<string, string | string[] | undefined>
    );
    await processCalendarSyncJobs({ userId: webhookMeta.userId, batchSize: 1, lanes: ["system"] });
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
    const reason =
      error instanceof Error && error.message
        ? error.message.slice(0, 180)
        : "oauth_callback_failed";
    return res.redirect(`${redirectBase}&calendar=error&reason=${encodeURIComponent(reason)}`);
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
    const supabaseAdmin = getSupabaseAdmin();
    let runId: string | null = null;
    try {
      runId = await queueManualSyncForUser(supabaseAdmin, req.user!.id);
      await processCalendarSyncJobs({ userId: req.user!.id, batchSize: 1, lanes: ["reconcile"] }).catch(() => {});
    } catch (error) {
      const fallback = await runLegacyManualSyncForUser(supabaseAdmin, req.user!.id);
      return res.json({
        ok: true,
        run_id: "",
        queued: false,
        processed: fallback.processed,
        failed: fallback.failed,
        failures: fallback.failures,
      });
    }
    return res.json({
      ok: true,
      run_id: runId,
      queued: true,
    });
  } catch (error) {
    console.error("Failed to sync calendar now", error);
    const message = error instanceof Error ? error.message : "Failed to sync calendar";
    return res.status(500).json({ error: message });
  }
});

router.post("/live-pump", requireUser, async (req, res) => {
  if (!isCalendarSyncEnabled()) return res.status(503).json({ error: "Calendar sync disabled" });
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const result = await queueLivePumpForUser(supabaseAdmin, req.user!.id);
    return res.json({ ok: true, ...result });
  } catch (error) {
    console.error("Failed to process live sync", error);
    return res.status(500).json({ error: "Failed to process live sync" });
  }
});

router.post("/rebuild", requireUser, async (req, res) => {
  if (!isCalendarSyncEnabled()) return res.status(503).json({ error: "Calendar sync disabled" });
  try {
    const supabaseAdmin = getSupabaseAdmin();
    try {
      const runId = await queueRebuildRunForUser(supabaseAdmin, req.user!.id);
      await processCalendarSyncJobs({ userId: req.user!.id, batchSize: 1, lanes: ["rebuild"] }).catch(() => {});
      return res.json({ ok: true, run_id: runId, queued: true });
    } catch (error) {
      if (!isCalendarRebuildSchemaUnavailable(error)) throw error;
      const fallback = await rebuildCalendarLegacyInlineForUser(supabaseAdmin, req.user!.id);
      return res.json({
        ok: true,
        run_id: "",
        queued: false,
        processed: fallback.processed,
        failed: fallback.failed,
        failures: fallback.failures,
        deleted: fallback.deleted,
      });
    }
  } catch (error) {
    console.error("Failed to start calendar rebuild", error);
    const message = error instanceof Error ? error.message : "Failed to start calendar rebuild";
    return res.status(500).json({ error: message });
  }
});

router.get("/sync-progress", requireUser, async (req, res) => {
  if (!isCalendarSyncEnabled()) return res.status(503).json({ error: "Calendar sync disabled" });
  const runId = typeof req.query.run_id === "string" ? req.query.run_id.trim() : "";
  if (!runId) return res.status(400).json({ error: "run_id is required" });

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const snapshot = await getSyncProgressForRun(supabaseAdmin, req.user!.id, runId);
    if (!snapshot.mode) {
      return res.json({ ok: true, ...snapshot });
    }
    const lanes = inferLanesForRunMode(snapshot.mode);
    await processCalendarSyncJobs({ userId: req.user!.id, batchSize: 1, lanes }).catch(() => {});
    const progress = await getSyncProgressForRun(supabaseAdmin, req.user!.id, runId);
    return res.json({ ok: true, ...progress });
  } catch (error) {
    console.error("Failed to fetch sync progress", error);
    const message = error instanceof Error ? error.message : "Failed to fetch sync progress";
    return res.status(500).json({ error: message });
  }
});

router.get("/runs/:runId", requireUser, async (req, res) => {
  if (!isCalendarSyncEnabled()) return res.status(503).json({ error: "Calendar sync disabled" });
  const runId = typeof req.params.runId === "string" ? req.params.runId.trim() : "";
  if (!runId) return res.status(400).json({ error: "run_id is required" });

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const debug = await getSyncRunDebug(supabaseAdmin, req.user!.id, runId);
    if (!debug) return res.status(404).json({ error: "Sync run not found" });
    return res.json({ ok: true, ...debug });
  } catch (error) {
    console.error("Failed to fetch sync run debug", error);
    return res.status(500).json({ error: "Failed to fetch sync run debug" });
  }
});

export default router;
