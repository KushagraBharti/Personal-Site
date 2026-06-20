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
const calendarSyncQueueService_1 = require("../../calendar/services/calendarSyncQueueService");
const taskListService_1 = require("../services/taskListService");
const router = (0, express_1.Router)();
router.post("/bootstrap", requireUser_1.requireUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const supabaseAdmin = (0, calendarSyncQueueService_1.getSupabaseAdmin)();
        const bootstrap = yield (0, taskListService_1.getTrackerBootstrapForUser)(supabaseAdmin, req.user.id, {
            browserTimeZone: (_a = req.body) === null || _a === void 0 ? void 0 : _a.browser_timezone,
        });
        return res.json(Object.assign({ ok: true }, bootstrap));
    }
    catch (error) {
        console.error("Failed to load tracker bootstrap", error);
        const message = error instanceof Error ? error.message : "Failed to load tracker bootstrap";
        return res.status(500).json({ error: message });
    }
}));
exports.default = router;
