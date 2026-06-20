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
        const result = yield (0, taskListService_1.createTaskForUser)(supabaseAdmin, req.user.id, (_a = req.body) !== null && _a !== void 0 ? _a : {});
        if (!result.ok) {
            return res.status(result.code).json({ error: result.error });
        }
        return res.status(201).json({ ok: true, task: result.task });
    }
    catch (error) {
        console.error("Failed to create task", error);
        const message = error instanceof Error ? error.message : "Failed to create task";
        return res.status(500).json({ error: message });
    }
}));
router.patch("/reorder", requireUser_1.requireUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const supabaseAdmin = (0, calendarSyncQueueService_1.getSupabaseAdmin)();
        const result = yield (0, taskListService_1.reorderTasksForUser)(supabaseAdmin, req.user.id, (_a = req.body) !== null && _a !== void 0 ? _a : {});
        if (!result.ok) {
            return res.status(result.code).json({ error: result.error });
        }
        return res.json({ ok: true, tasks: result.tasks });
    }
    catch (error) {
        console.error("Failed to reorder tasks", error);
        const message = error instanceof Error ? error.message : "Failed to reorder tasks";
        return res.status(500).json({ error: message });
    }
}));
router.patch("/:taskId/completion", requireUser_1.requireUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const taskId = typeof req.params.taskId === "string" ? req.params.taskId.trim() : "";
    if (!taskId)
        return res.status(400).json({ error: "task_id is required" });
    if (typeof ((_a = req.body) === null || _a === void 0 ? void 0 : _a.is_completed) !== "boolean") {
        return res.status(400).json({ error: "is_completed boolean is required" });
    }
    try {
        const supabaseAdmin = (0, calendarSyncQueueService_1.getSupabaseAdmin)();
        const result = yield (0, taskListService_1.setTaskCompletionForUser)(supabaseAdmin, req.user.id, taskId, req.body.is_completed);
        if (!result.ok) {
            return res.status(result.code).json({ error: result.error });
        }
        return res.json({
            ok: true,
            task: result.task,
            created_next_task: result.createdNextTask,
        });
    }
    catch (error) {
        console.error("Failed to update task completion", error);
        const message = error instanceof Error ? error.message : "Failed to update task completion";
        return res.status(500).json({ error: message });
    }
}));
router.patch("/:taskId", requireUser_1.requireUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const taskId = typeof req.params.taskId === "string" ? req.params.taskId.trim() : "";
    if (!taskId)
        return res.status(400).json({ error: "task_id is required" });
    try {
        const supabaseAdmin = (0, calendarSyncQueueService_1.getSupabaseAdmin)();
        const result = yield (0, taskListService_1.updateTaskForUser)(supabaseAdmin, req.user.id, taskId, (_a = req.body) !== null && _a !== void 0 ? _a : {});
        if (!result.ok) {
            return res.status(result.code).json({ error: result.error });
        }
        return res.json({ ok: true, task: result.task });
    }
    catch (error) {
        console.error("Failed to update task", error);
        const message = error instanceof Error ? error.message : "Failed to update task";
        return res.status(500).json({ error: message });
    }
}));
router.delete("/:taskId", requireUser_1.requireUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const taskId = typeof req.params.taskId === "string" ? req.params.taskId.trim() : "";
    if (!taskId)
        return res.status(400).json({ error: "task_id is required" });
    try {
        const supabaseAdmin = (0, calendarSyncQueueService_1.getSupabaseAdmin)();
        const result = yield (0, taskListService_1.deleteTaskForUser)(supabaseAdmin, req.user.id, taskId);
        if (!result.ok) {
            return res.status(result.code).json({ error: result.error });
        }
        return res.json({ ok: true });
    }
    catch (error) {
        console.error("Failed to delete task", error);
        const message = error instanceof Error ? error.message : "Failed to delete task";
        return res.status(500).json({ error: message });
    }
}));
exports.default = router;
