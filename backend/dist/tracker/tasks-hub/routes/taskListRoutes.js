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
router.post("/", requireUser_1.requireUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const supabaseAdmin = (0, calendarSyncQueueService_1.getSupabaseAdmin)();
        const result = yield (0, taskListService_1.createTaskListForUser)(supabaseAdmin, req.user.id, (_a = req.body) !== null && _a !== void 0 ? _a : {});
        if (!result.ok) {
            return res.status(result.code).json({ error: result.error });
        }
        return res.status(201).json({ ok: true, list: result.list });
    }
    catch (error) {
        console.error("Failed to create task list", error);
        const message = error instanceof Error ? error.message : "Failed to create task list";
        return res.status(500).json({ error: message });
    }
}));
router.patch("/reorder", requireUser_1.requireUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const supabaseAdmin = (0, calendarSyncQueueService_1.getSupabaseAdmin)();
        const result = yield (0, taskListService_1.reorderTaskListsForUser)(supabaseAdmin, req.user.id, (_a = req.body) === null || _a === void 0 ? void 0 : _a.ordered_list_ids);
        if (!result.ok) {
            return res.status(result.code).json({ error: result.error });
        }
        return res.json({ ok: true, lists: result.lists });
    }
    catch (error) {
        console.error("Failed to reorder task lists", error);
        const message = error instanceof Error ? error.message : "Failed to reorder task lists";
        return res.status(500).json({ error: message });
    }
}));
router.patch("/:listId", requireUser_1.requireUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const listId = typeof req.params.listId === "string" ? req.params.listId.trim() : "";
    if (!listId)
        return res.status(400).json({ error: "list_id is required" });
    try {
        const supabaseAdmin = (0, calendarSyncQueueService_1.getSupabaseAdmin)();
        const result = yield (0, taskListService_1.updateTaskListForUser)(supabaseAdmin, req.user.id, listId, (_a = req.body) !== null && _a !== void 0 ? _a : {});
        if (!result.ok) {
            return res.status(result.code).json({ error: result.error });
        }
        return res.json({ ok: true, list: result.list });
    }
    catch (error) {
        console.error("Failed to update task list", error);
        const message = error instanceof Error ? error.message : "Failed to update task list";
        return res.status(500).json({ error: message });
    }
}));
router.delete("/:listId", requireUser_1.requireUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const listId = typeof req.params.listId === "string" ? req.params.listId.trim() : "";
    if (!listId)
        return res.status(400).json({ error: "list_id is required" });
    try {
        const supabaseAdmin = (0, calendarSyncQueueService_1.getSupabaseAdmin)();
        const result = yield (0, taskListService_1.deleteTaskListForUser)(supabaseAdmin, req.user.id, listId);
        if (!result.ok) {
            return res.status(result.code).json({ error: result.error });
        }
        return res.json({ ok: true });
    }
    catch (error) {
        console.error("Failed to delete task list", error);
        const message = error instanceof Error ? error.message : "Failed to delete task list";
        return res.status(500).json({ error: message });
    }
}));
exports.default = router;
