"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const requireUser_1 = require("../../../middleware/requireUser");
const googleCalendarOAuthService_1 = require("../services/googleCalendarOAuthService");
const taskCalendarSyncService_1 = require("../services/taskCalendarSyncService");
const calendarSyncQueueService_1 = require("../services/calendarSyncQueueService");
const calendarWebhookService_1 = require("../services/calendarWebhookService");
const router = (0, express_1.Router)();
const getFrontendTrackerUrl = () => process.env.TRACKER_FRONTEND_URL || "http://localhost:5173/tracker?module=tasks";
const isCalendarSyncEnabled = () => process.env.CALENDAR_SYNC_ENABLED !== "0";
router.post("/google/webhook", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!isCalendarSyncEnabled())
        return res.status(200).json({ ok: true, disabled: true });
    try {
        const supabaseAdmin = (0, calendarSyncQueueService_1.getSupabaseAdmin)();
        const webhookMeta = yield (0, calendarWebhookService_1.handleGoogleWebhook)(supabaseAdmin, req.headers);
        yield (0, taskCalendarSyncService_1.processCalendarSyncJobs)({ userId: webhookMeta.userId, batchSize: 1, lanes: ["system"] });
        return res.status(200).json({ ok: true });
    }
    catch (error) {
        console.error("Google webhook handling failed", error);
        return res.status(200).json({ ok: true });
    }
}));
router.post("/google/connect-url", requireUser_1.requireUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!isCalendarSyncEnabled())
        return res.status(503).json({ error: "Calendar sync disabled" });
    try {
        const state = (0, googleCalendarOAuthService_1.createGoogleOAuthState)(req.user.id);
        const url = (0, googleCalendarOAuthService_1.createGoogleOAuthUrl)(state);
        return res.json({ url });
    }
    catch (error) {
        console.error("Failed to generate Google connect URL", error);
        return res.status(500).json({ error: "Failed to generate Google connect URL" });
    }
}));
router.get("/google/callback", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const userId = (0, googleCalendarOAuthService_1.parseGoogleOAuthState)(state);
        const tokens = yield (0, googleCalendarOAuthService_1.exchangeGoogleOAuthCode)(code);
        const supabaseAdmin = (0, calendarSyncQueueService_1.getSupabaseAdmin)();
        yield (0, taskCalendarSyncService_1.upsertGoogleConnectionFromOAuth)({
            supabaseAdmin,
            userId,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresInSeconds: tokens.expires_in || 3600,
        });
        return res.redirect(`${redirectBase}&calendar=connected`);
    }
    catch (error) {
        console.error("Google OAuth callback failed", error);
        const reason = error instanceof Error && error.message
            ? error.message.slice(0, 180)
            : "oauth_callback_failed";
        return res.redirect(`${redirectBase}&calendar=error&reason=${encodeURIComponent(reason)}`);
    }
}));
router.get("/status", requireUser_1.requireUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!isCalendarSyncEnabled())
        return res.json({ connected: false, connection: null, watch_expires_at: null, list_sync_settings: [] });
    try {
        const supabaseAdmin = (0, calendarSyncQueueService_1.getSupabaseAdmin)();
        const status = yield (0, taskCalendarSyncService_1.getCalendarStatusForUser)(supabaseAdmin, req.user.id);
        return res.json(status);
    }
    catch (error) {
        console.error("Failed to fetch calendar status", error);
        return res.status(500).json({ error: "Failed to fetch calendar status" });
    }
}));
router.post("/select-calendar", requireUser_1.requireUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (!isCalendarSyncEnabled())
        return res.status(503).json({ error: "Calendar sync disabled" });
    const calendarId = typeof ((_a = req.body) === null || _a === void 0 ? void 0 : _a.calendar_id) === "string" ? req.body.calendar_id.trim() : "";
    const calendarSummary = typeof ((_b = req.body) === null || _b === void 0 ? void 0 : _b.calendar_summary) === "string" ? req.body.calendar_summary.trim() : null;
    if (!calendarId) {
        return res.status(400).json({ error: "calendar_id is required" });
    }
    try {
        const supabaseAdmin = (0, calendarSyncQueueService_1.getSupabaseAdmin)();
        const userId = req.user.id;
        const { error } = yield supabaseAdmin
            .from("tracker_google_calendar_connections_public")
            .update({
            selected_calendar_id: calendarId,
            selected_calendar_summary: calendarSummary || calendarId,
            status: "connected",
            last_error: null,
        })
            .eq("user_id", userId);
        if (error)
            throw new Error(error.message);
        yield supabaseAdmin
            .from("tracker_google_calendar_connections_secrets")
            .update({ sync_token: null })
            .eq("user_id", userId);
        yield (0, taskCalendarSyncService_1.renewCalendarWatchForUser)(supabaseAdmin, userId);
        yield (0, taskCalendarSyncService_1.queueFullBackfill)(supabaseAdmin, userId);
        return res.json({ ok: true });
    }
    catch (error) {
        console.error("Failed to select calendar", error);
        return res.status(500).json({ error: "Failed to select calendar" });
    }
}));
router.post("/disconnect", requireUser_1.requireUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!isCalendarSyncEnabled())
        return res.status(503).json({ error: "Calendar sync disabled" });
    try {
        const supabaseAdmin = (0, calendarSyncQueueService_1.getSupabaseAdmin)();
        yield (0, taskCalendarSyncService_1.disconnectGoogleCalendarForUser)(supabaseAdmin, req.user.id);
        return res.json({ ok: true });
    }
    catch (error) {
        console.error("Failed to disconnect Google Calendar", error);
        return res.status(500).json({ error: "Failed to disconnect Google Calendar" });
    }
}));
router.post("/list-sync", requireUser_1.requireUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (!isCalendarSyncEnabled())
        return res.status(503).json({ error: "Calendar sync disabled" });
    const listId = typeof ((_a = req.body) === null || _a === void 0 ? void 0 : _a.list_id) === "string" ? req.body.list_id.trim() : "";
    const syncEnabled = !!((_b = req.body) === null || _b === void 0 ? void 0 : _b.sync_enabled);
    if (!listId) {
        return res.status(400).json({ error: "list_id is required" });
    }
    try {
        const supabaseAdmin = (0, calendarSyncQueueService_1.getSupabaseAdmin)();
        const userId = req.user.id;
        yield (0, taskCalendarSyncService_1.upsertListSyncSetting)(supabaseAdmin, userId, listId, syncEnabled);
        if (syncEnabled) {
            yield (0, taskCalendarSyncService_1.queueFullBackfill)(supabaseAdmin, userId, listId);
        }
        return res.json({ ok: true });
    }
    catch (error) {
        console.error("Failed to update list sync setting", error);
        return res.status(500).json({ error: "Failed to update list sync setting" });
    }
}));
router.post("/sync-now", requireUser_1.requireUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!isCalendarSyncEnabled())
        return res.status(503).json({ error: "Calendar sync disabled" });
    try {
        const supabaseAdmin = (0, calendarSyncQueueService_1.getSupabaseAdmin)();
        let runId = null;
        try {
            runId = yield (0, taskCalendarSyncService_1.queueManualSyncForUser)(supabaseAdmin, req.user.id);
            yield (0, taskCalendarSyncService_1.processCalendarSyncJobs)({ userId: req.user.id, batchSize: 1, lanes: ["reconcile"] }).catch(() => { });
        }
        catch (error) {
            const fallback = yield (0, taskCalendarSyncService_1.runLegacyManualSyncForUser)(supabaseAdmin, req.user.id);
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
    }
    catch (error) {
        console.error("Failed to sync calendar now", error);
        const message = error instanceof Error ? error.message : "Failed to sync calendar";
        return res.status(500).json({ error: message });
    }
}));
router.post("/live-pump", requireUser_1.requireUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!isCalendarSyncEnabled())
        return res.status(503).json({ error: "Calendar sync disabled" });
    try {
        const supabaseAdmin = (0, calendarSyncQueueService_1.getSupabaseAdmin)();
        const result = yield (0, taskCalendarSyncService_1.queueLivePumpForUser)(supabaseAdmin, req.user.id);
        return res.json(Object.assign({ ok: true }, result));
    }
    catch (error) {
        console.error("Failed to process live sync", error);
        return res.status(500).json({ error: "Failed to process live sync" });
    }
}));
router.post("/rebuild", requireUser_1.requireUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!isCalendarSyncEnabled())
        return res.status(503).json({ error: "Calendar sync disabled" });
    try {
        const supabaseAdmin = (0, calendarSyncQueueService_1.getSupabaseAdmin)();
        try {
            const runId = yield (0, taskCalendarSyncService_1.queueRebuildRunForUser)(supabaseAdmin, req.user.id);
            yield (0, taskCalendarSyncService_1.processCalendarSyncJobs)({ userId: req.user.id, batchSize: 1, lanes: ["rebuild"] }).catch(() => { });
            return res.json({ ok: true, run_id: runId, queued: true });
        }
        catch (error) {
            if (!(0, taskCalendarSyncService_1.isCalendarRebuildSchemaUnavailable)(error))
                throw error;
            const fallback = yield (0, taskCalendarSyncService_1.rebuildCalendarLegacyInlineForUser)(supabaseAdmin, req.user.id);
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
    }
    catch (error) {
        console.error("Failed to start calendar rebuild", error);
        const message = error instanceof Error ? error.message : "Failed to start calendar rebuild";
        return res.status(500).json({ error: message });
    }
}));
router.get("/sync-progress", requireUser_1.requireUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!isCalendarSyncEnabled())
        return res.status(503).json({ error: "Calendar sync disabled" });
    const runId = typeof req.query.run_id === "string" ? req.query.run_id.trim() : "";
    if (!runId)
        return res.status(400).json({ error: "run_id is required" });
    try {
        const supabaseAdmin = (0, calendarSyncQueueService_1.getSupabaseAdmin)();
        const snapshot = yield (0, taskCalendarSyncService_1.getSyncProgressForRun)(supabaseAdmin, req.user.id, runId);
        if (!snapshot.mode) {
            return res.json(Object.assign({ ok: true }, snapshot));
        }
        const lanes = (0, taskCalendarSyncService_1.inferLanesForRunMode)(snapshot.mode);
        yield (0, taskCalendarSyncService_1.processCalendarSyncJobs)({ userId: req.user.id, batchSize: 1, lanes }).catch(() => { });
        const progress = yield (0, taskCalendarSyncService_1.getSyncProgressForRun)(supabaseAdmin, req.user.id, runId);
        return res.json(Object.assign({ ok: true }, progress));
    }
    catch (error) {
        console.error("Failed to fetch sync progress", error);
        const message = error instanceof Error ? error.message : "Failed to fetch sync progress";
        return res.status(500).json({ error: message });
    }
}));
router.get("/runs/:runId", requireUser_1.requireUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!isCalendarSyncEnabled())
        return res.status(503).json({ error: "Calendar sync disabled" });
    const runId = typeof req.params.runId === "string" ? req.params.runId.trim() : "";
    if (!runId)
        return res.status(400).json({ error: "run_id is required" });
    try {
        const supabaseAdmin = (0, calendarSyncQueueService_1.getSupabaseAdmin)();
        const debug = yield (0, taskCalendarSyncService_1.getSyncRunDebug)(supabaseAdmin, req.user.id, runId);
        if (!debug)
            return res.status(404).json({ error: "Sync run not found" });
        return res.json(Object.assign({ ok: true }, debug));
    }
    catch (error) {
        console.error("Failed to fetch sync run debug", error);
        return res.status(500).json({ error: "Failed to fetch sync run debug" });
    }
}));
exports.default = router;
