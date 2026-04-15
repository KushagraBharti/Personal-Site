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
exports.deleteTaskListForUser = void 0;
const taskCalendarSyncService_1 = require("../../calendar/services/taskCalendarSyncService");
const nowIso = () => new Date().toISOString();
const getRawErrorMessage = (error) => {
    var _a;
    if (error instanceof Error)
        return error.message;
    if (typeof error === "object" && error !== null && "message" in error) {
        return String((_a = error.message) !== null && _a !== void 0 ? _a : "");
    }
    return String(error);
};
const isMissingProjectionSchemaError = (error) => {
    const message = getRawErrorMessage(error).toLowerCase();
    if (!message.includes("tracker_task_google_projection_event_links"))
        return false;
    return (message.includes("schema cache") ||
        message.includes("does not exist") ||
        message.includes("relation") ||
        message.includes("not found"));
};
const buildSyntheticDeleteJob = (input) => ({
    id: 0,
    user_id: input.userId,
    run_id: null,
    lane: "system",
    task_id: input.taskId,
    google_event_id: null,
    list_id: input.listId,
    job_type: "task_delete",
    source: "delete_task_list",
    dedupe_key: null,
    priority: 0,
    payload: {},
    status: "pending",
    attempt_count: 0,
    max_attempts: 1,
    run_after: nowIso(),
    last_error: null,
    locked_at: null,
    created_at: nowIso(),
    updated_at: nowIso(),
});
const deleteTaskListForUser = (supabaseAdmin, userId, listId) => __awaiter(void 0, void 0, void 0, function* () {
    const { data: listRow, error: listError } = yield supabaseAdmin
        .from("tracker_task_lists")
        .select("id")
        .eq("user_id", userId)
        .eq("id", listId)
        .maybeSingle();
    if (listError)
        throw new Error(listError.message);
    if (!listRow)
        return { ok: false, code: 404, error: "List not found" };
    const { data: taskRows, error: taskRowsError } = yield supabaseAdmin
        .from("tracker_tasks")
        .select("id")
        .eq("user_id", userId)
        .eq("list_id", listId);
    if (taskRowsError)
        throw new Error(taskRowsError.message);
    const taskIds = (taskRows !== null && taskRows !== void 0 ? taskRows : []).map((row) => String(row.id)).filter(Boolean);
    for (const taskId of taskIds) {
        try {
            yield (0, taskCalendarSyncService_1.processTaskDeleteJob)(supabaseAdmin, buildSyntheticDeleteJob({
                userId,
                listId,
                taskId,
            }));
        }
        catch (_a) {
            // Best effort: local delete should still succeed even if Google cleanup fails.
        }
    }
    const { error: jobUpdateError } = yield supabaseAdmin
        .from("tracker_google_sync_jobs")
        .update({ list_id: null })
        .eq("user_id", userId)
        .eq("list_id", listId);
    if (jobUpdateError)
        throw new Error(jobUpdateError.message);
    const { error: listSyncSettingsError } = yield supabaseAdmin
        .from("tracker_task_list_sync_settings")
        .delete()
        .eq("user_id", userId)
        .eq("list_id", listId);
    if (listSyncSettingsError)
        throw new Error(listSyncSettingsError.message);
    const { error: sortPrefError } = yield supabaseAdmin
        .from("tracker_task_sort_preferences")
        .delete()
        .eq("user_id", userId)
        .eq("list_id", listId);
    if (sortPrefError)
        throw new Error(sortPrefError.message);
    if (taskIds.length > 0) {
        try {
            const { error: projectionLinkError } = yield supabaseAdmin
                .from("tracker_task_google_projection_event_links")
                .delete()
                .eq("user_id", userId)
                .in("task_id", taskIds);
            if (projectionLinkError)
                throw new Error(projectionLinkError.message);
        }
        catch (error) {
            if (!isMissingProjectionSchemaError(error))
                throw error;
        }
        const { error: primaryLinkError } = yield supabaseAdmin
            .from("tracker_task_google_event_links")
            .delete()
            .eq("user_id", userId)
            .in("task_id", taskIds);
        if (primaryLinkError)
            throw new Error(primaryLinkError.message);
        const { error: taskDeleteError } = yield supabaseAdmin
            .from("tracker_tasks")
            .delete()
            .eq("user_id", userId)
            .eq("list_id", listId);
        if (taskDeleteError)
            throw new Error(taskDeleteError.message);
    }
    const { error: listDeleteError } = yield supabaseAdmin
        .from("tracker_task_lists")
        .delete()
        .eq("user_id", userId)
        .eq("id", listId);
    if (listDeleteError)
        throw new Error(listDeleteError.message);
    return { ok: true };
});
exports.deleteTaskListForUser = deleteTaskListForUser;
