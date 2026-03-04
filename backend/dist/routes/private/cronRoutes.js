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
const cronAuth_1 = require("../../middleware/cronAuth");
const financeSyncService_1 = require("../../services/private/financeSyncService");
const taskCalendarSyncService_1 = require("../../services/private/taskCalendarSyncService");
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
        const results = yield (0, taskCalendarSyncService_1.processCalendarSyncJobs)({ batchSize: 1 });
        return res.json({
            ok: true,
            processed: results.length,
            failed: results.filter((item) => !item.ok).length,
            results,
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
router.post("/finance-sync", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const results = yield (0, financeSyncService_1.syncAllFinance)();
        return res.json({ ok: true, results });
    }
    catch (error) {
        console.error("Failed to run finance sync", error);
        return res.status(500).json({ error: "Failed to run finance sync" });
    }
}));
router.post("/calendar-sync", runCalendarSync);
router.get("/calendar-sync", runCalendarSync);
router.post("/calendar-watch-renew", runCalendarWatchRenew);
router.get("/calendar-watch-renew", runCalendarWatchRenew);
exports.default = router;
