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
const taskCalendarSyncService_1 = require("../../calendar/services/taskCalendarSyncService");
const taskListService_1 = require("../services/taskListService");
const router = (0, express_1.Router)();
const queueTaskUpsertBestEffort = (supabaseAdmin, userId, task, source) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, taskCalendarSyncService_1.queueTaskUpsertForUser)(supabaseAdmin, userId, task, source);
        return null;
    }
    catch (error) {
        console.error("Failed to enqueue live calendar task sync", error);
        return "Task saved, but calendar sync could not be queued.";
    }
});
const taskResponse = (payload, calendarSyncWarning) => {
    if (!calendarSyncWarning)
        return payload;
    return Object.assign(Object.assign({}, payload), { calendar_sync_warning: calendarSyncWarning });
};
router.post("/", requireUser_1.requireUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const supabaseAdmin = (0, calendarSyncQueueService_1.getSupabaseAdmin)();
        const result = yield (0, taskListService_1.createTaskForUser)(supabaseAdmin, req.user.id, (_a = req.body) !== null && _a !== void 0 ? _a : {});
        if (!result.ok) {
            return res.status(result.code).json({ error: result.error });
        }
        const calendarSyncWarning = yield queueTaskUpsertBestEffort(supabaseAdmin, req.user.id, result.task, "api_task_create");
        return res
            .status(201)
            .json(taskResponse({ ok: true, task: result.task }, calendarSyncWarning));
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
        let calendarSyncWarning = yield queueTaskUpsertBestEffort(supabaseAdmin, req.user.id, result.task, "api_task_completion");
        if (result.createdNextTask) {
            const nextTaskWarning = yield queueTaskUpsertBestEffort(supabaseAdmin, req.user.id, result.createdNextTask, "api_task_completion_next");
            if (nextTaskWarning)
                calendarSyncWarning = nextTaskWarning;
        }
        return res.json(taskResponse({
            ok: true,
            task: result.task,
            created_next_task: result.createdNextTask,
        }, calendarSyncWarning));
    }
    catch (error) {
        console.error("Failed to update task completion", error);
        const message = error instanceof Error
            ? error.message
            : "Failed to update task completion";
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
        const calendarSyncWarning = yield queueTaskUpsertBestEffort(supabaseAdmin, req.user.id, result.task, "api_task_update");
        return res.json(taskResponse({ ok: true, task: result.task }, calendarSyncWarning));
    }
    catch (error) {
        console.error("Failed to update task", error);
        const message = error instanceof Error ? error.message : "Failed to update task";
        return res.status(500).json({ error: message });
    }
}));
router.delete("/:taskId", requireUser_1.requireUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const taskId = typeof req.params.taskId === "string" ? req.params.taskId.trim() : "";
    if (!taskId)
        return res.status(400).json({ error: "task_id is required" });
    try {
        const supabaseAdmin = (0, calendarSyncQueueService_1.getSupabaseAdmin)();
        const result = yield (0, taskListService_1.deleteTaskForUser)(supabaseAdmin, req.user.id, taskId);
        if (!result.ok) {
            return res.status(result.code).json({ error: result.error });
        }
        return res.json(taskResponse({ ok: true }, (_a = result.calendarSyncWarning) !== null && _a !== void 0 ? _a : null));
    }
    catch (error) {
        console.error("Failed to delete task", error);
        const message = error instanceof Error ? error.message : "Failed to delete task";
        return res.status(500).json({ error: message });
    }
}));
exports.default = router;
