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
const cronAuth_1 = require("../../../middleware/cronAuth");
const taskCalendarSyncService_1 = require("../../calendar/services/taskCalendarSyncService");
const calendarSyncQueueService_1 = require("../../calendar/services/calendarSyncQueueService");
const taskListService_1 = require("../../tasks-hub/services/taskListService");
const router = (0, express_1.Router)();
const isCalendarSyncEnabled = () => process.env.CALENDAR_SYNC_ENABLED !== "0";
router.use(cronAuth_1.cronAuth);
router.get("/health", (req, res) => {
    res.json({ status: "ok" });
});
const runCalendarSync = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!isCalendarSyncEnabled())
        return res.json({ ok: true, disabled: true });
    try {
        // Keep cron execution bounded for serverless limits.
        const drain = yield (0, taskCalendarSyncService_1.drainCalendarSyncJobs)({
            batchSize: 10,
            maxJobs: 80,
            maxMs: 20000,
        });
        return res.json({
            ok: true,
            processed: drain.processed,
            failed: drain.failed,
            exhausted: drain.exhausted,
            results: drain.results,
        });
    }
    catch (error) {
        console.error("Failed to run calendar sync", error);
        return res.status(500).json({ error: "Failed to run calendar sync" });
    }
});
const runCalendarWatchRenew = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!isCalendarSyncEnabled())
        return res.json({ ok: true, disabled: true });
    try {
        const results = yield (0, taskCalendarSyncService_1.renewExpiringCalendarWatches)();
        return res.json({
            ok: true,
            renewed: results.filter((item) => item.ok).length,
            failed: results.filter((item) => !item.ok).length,
            results,
        });
    }
    catch (error) {
        console.error("Failed to renew calendar watches", error);
        return res.status(500).json({ error: "Failed to renew calendar watches" });
    }
});
const runRecurringTaskReconcile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, taskListService_1.reconcileCompletedRecurringTasks)((0, calendarSyncQueueService_1.getSupabaseAdmin)(), { limit: 25 });
        return res.json(result);
    }
    catch (error) {
        console.error("Failed to reconcile recurring tasks", error);
        return res.status(500).json({ error: "Failed to reconcile recurring tasks" });
    }
});
router.post("/calendar-sync", runCalendarSync);
router.get("/calendar-sync", runCalendarSync);
router.post("/calendar-watch-renew", runCalendarWatchRenew);
router.get("/calendar-watch-renew", runCalendarWatchRenew);
router.post("/recurring-tasks", runRecurringTaskReconcile);
router.get("/recurring-tasks", runRecurringTaskReconcile);
exports.default = router;
