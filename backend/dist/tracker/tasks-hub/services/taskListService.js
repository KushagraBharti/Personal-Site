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
exports.deleteTaskListForUser = exports.deleteTaskForUser = exports.reconcileCompletedRecurringTasks = exports.setTaskCompletionForUser = void 0;
const taskCalendarSyncService_1 = require("../../calendar/services/taskCalendarSyncService");
const taskCalendarEventUtils_1 = require("../../calendar/services/taskCalendarEventUtils");
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
const buildSyntheticDeleteJob = (input) => {
    var _a;
    return ({
        id: 0,
        user_id: input.userId,
        run_id: null,
        lane: "system",
        task_id: input.taskId,
        google_event_id: null,
        list_id: input.listId,
        job_type: "task_delete",
        source: (_a = input.source) !== null && _a !== void 0 ? _a : "delete_task_list",
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
};
const collectTaskTreeForDelete = (supabaseAdmin, userId, taskId) => __awaiter(void 0, void 0, void 0, function* () {
    const { data: rootTask, error: rootTaskError } = yield supabaseAdmin
        .from("tracker_tasks")
        .select("id,list_id,parent_task_id")
        .eq("user_id", userId)
        .eq("id", taskId)
        .maybeSingle();
    if (rootTaskError)
        throw new Error(rootTaskError.message);
    if (!rootTask)
        return null;
    const rowsById = new Map();
    rowsById.set(String(rootTask.id), {
        id: String(rootTask.id),
        list_id: String(rootTask.list_id),
        parent_task_id: rootTask.parent_task_id ? String(rootTask.parent_task_id) : null,
    });
    let frontier = [String(rootTask.id)];
    while (frontier.length > 0) {
        const { data: childRows, error: childRowsError } = yield supabaseAdmin
            .from("tracker_tasks")
            .select("id,list_id,parent_task_id")
            .eq("user_id", userId)
            .in("parent_task_id", frontier);
        if (childRowsError)
            throw new Error(childRowsError.message);
        const nextFrontier = [];
        for (const row of childRows !== null && childRows !== void 0 ? childRows : []) {
            const id = String(row.id);
            if (rowsById.has(id))
                continue;
            rowsById.set(id, {
                id,
                list_id: String(row.list_id),
                parent_task_id: row.parent_task_id ? String(row.parent_task_id) : null,
            });
            nextFrontier.push(id);
        }
        frontier = nextFrontier;
    }
    return Array.from(rowsById.values());
});
const deleteCalendarLinksForTasks = (supabaseAdmin, userId, taskIds) => __awaiter(void 0, void 0, void 0, function* () {
    if (taskIds.length === 0)
        return;
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
});
const getNextTaskSortOrder = (supabaseAdmin, userId, listId, parentTaskId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let query = supabaseAdmin
        .from("tracker_tasks")
        .select("sort_order")
        .eq("user_id", userId)
        .eq("list_id", listId);
    query = parentTaskId ? query.eq("parent_task_id", parentTaskId) : query.is("parent_task_id", null);
    const { data, error } = yield query.order("sort_order", { ascending: false }).limit(1);
    if (error)
        throw new Error(error.message);
    const currentMax = Number((_a = data === null || data === void 0 ? void 0 : data[0]) === null || _a === void 0 ? void 0 : _a.sort_order);
    return Number.isFinite(currentMax) ? currentMax + 1 : 1;
});
const applyNullableFilter = (query, column, value) => (value === null ? query.is(column, null) : query.eq(column, value));
const findExistingNextRecurringTask = (supabaseAdmin, userId, sourceTask, nextDueAt, nextDueTimezone) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let query = supabaseAdmin
        .from("tracker_tasks")
        .select("*")
        .eq("user_id", userId)
        .eq("list_id", sourceTask.list_id)
        .eq("title", sourceTask.title)
        .eq("due_at", nextDueAt)
        .eq("is_completed", false)
        .eq("recurrence_type", sourceTask.recurrence_type);
    query = applyNullableFilter(query, "parent_task_id", sourceTask.parent_task_id);
    query = applyNullableFilter(query, "details", sourceTask.details);
    query = applyNullableFilter(query, "due_timezone", nextDueTimezone);
    query = applyNullableFilter(query, "recurrence_interval", sourceTask.recurrence_interval);
    query = applyNullableFilter(query, "recurrence_unit", sourceTask.recurrence_unit);
    query = applyNullableFilter(query, "recurrence_ends_at", sourceTask.recurrence_ends_at);
    const { data, error } = yield query.order("sort_order", { ascending: true }).limit(1);
    if (error)
        throw new Error(error.message);
    return ((_a = data === null || data === void 0 ? void 0 : data[0]) !== null && _a !== void 0 ? _a : null);
});
const createNextRecurringTaskForCompletion = (supabaseAdmin, userId, sourceTask) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!(0, taskCalendarEventUtils_1.isRecurringTask)(sourceTask))
        return null;
    const nextDueAt = (0, taskCalendarEventUtils_1.computeNextRecurringDueAt)(sourceTask);
    if (!nextDueAt)
        return null;
    const nextDueTimezone = (0, taskCalendarEventUtils_1.isDateOnlyIso)(nextDueAt)
        ? null
        : (0, taskCalendarEventUtils_1.resolveTaskTimeZone)(sourceTask.due_timezone);
    const existingNextTask = yield findExistingNextRecurringTask(supabaseAdmin, userId, sourceTask, nextDueAt, nextDueTimezone);
    if (existingNextTask)
        return null;
    const sortOrder = yield getNextTaskSortOrder(supabaseAdmin, userId, sourceTask.list_id, sourceTask.parent_task_id);
    const { data: nextTaskRow, error: nextTaskError } = yield supabaseAdmin
        .from("tracker_tasks")
        .insert({
        user_id: userId,
        list_id: sourceTask.list_id,
        parent_task_id: sourceTask.parent_task_id,
        title: sourceTask.title,
        details: sourceTask.details,
        due_at: nextDueAt,
        due_timezone: nextDueTimezone,
        is_completed: false,
        completed_at: null,
        recurrence_type: sourceTask.recurrence_type,
        recurrence_interval: sourceTask.recurrence_interval,
        recurrence_unit: sourceTask.recurrence_unit,
        recurrence_ends_at: sourceTask.recurrence_ends_at,
        sort_order: sortOrder,
    })
        .select("*")
        .single();
    if (nextTaskError)
        throw new Error(nextTaskError.message);
    return (_a = nextTaskRow) !== null && _a !== void 0 ? _a : null;
});
const setTaskCompletionForUser = (supabaseAdmin, userId, taskId, isCompleted) => __awaiter(void 0, void 0, void 0, function* () {
    const { data: existingTaskRow, error: existingTaskError } = yield supabaseAdmin
        .from("tracker_tasks")
        .select("*")
        .eq("user_id", userId)
        .eq("id", taskId)
        .maybeSingle();
    if (existingTaskError)
        throw new Error(existingTaskError.message);
    if (!existingTaskRow)
        return { ok: false, code: 404, error: "Task not found" };
    const existingTask = existingTaskRow;
    const wasCompleted = existingTask.is_completed;
    const completedAt = isCompleted ? nowIso() : null;
    const { data: updatedTaskRow, error: updateError } = yield supabaseAdmin
        .from("tracker_tasks")
        .update({
        is_completed: isCompleted,
        completed_at: completedAt,
    })
        .eq("user_id", userId)
        .eq("id", taskId)
        .select("*")
        .single();
    if (updateError)
        throw new Error(updateError.message);
    let createdNextTask = null;
    if (isCompleted && !wasCompleted && (0, taskCalendarEventUtils_1.isRecurringTask)(existingTask)) {
        createdNextTask = yield createNextRecurringTaskForCompletion(supabaseAdmin, userId, existingTask);
    }
    return {
        ok: true,
        task: updatedTaskRow,
        createdNextTask,
    };
});
exports.setTaskCompletionForUser = setTaskCompletionForUser;
const reconcileCompletedRecurringTasks = (supabaseAdmin, input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const limit = Math.max(1, Math.min((_a = input === null || input === void 0 ? void 0 : input.limit) !== null && _a !== void 0 ? _a : 25, 100));
    let query = supabaseAdmin
        .from("tracker_tasks")
        .select("*")
        .eq("is_completed", true)
        .neq("recurrence_type", "none")
        .not("due_at", "is", null);
    if (input === null || input === void 0 ? void 0 : input.userId)
        query = query.eq("user_id", input.userId);
    const { data: taskRows, error } = yield query
        .order("completed_at", { ascending: false, nullsFirst: false })
        .limit(limit);
    if (error)
        throw new Error(error.message);
    const results = [];
    for (const taskRow of (taskRows !== null && taskRows !== void 0 ? taskRows : [])) {
        try {
            const createdNextTask = yield createNextRecurringTaskForCompletion(supabaseAdmin, taskRow.user_id, taskRow);
            results.push({
                task_id: taskRow.id,
                ok: true,
                created: !!createdNextTask,
                created_next_task_id: (_b = createdNextTask === null || createdNextTask === void 0 ? void 0 : createdNextTask.id) !== null && _b !== void 0 ? _b : null,
            });
        }
        catch (error) {
            results.push({
                task_id: taskRow.id,
                ok: false,
                created: false,
                created_next_task_id: null,
                error: getRawErrorMessage(error),
            });
        }
    }
    const failed = results.filter((item) => !item.ok).length;
    return {
        ok: failed === 0,
        checked: results.length,
        created: results.filter((item) => item.created).length,
        failed,
        results,
    };
});
exports.reconcileCompletedRecurringTasks = reconcileCompletedRecurringTasks;
const deleteTaskForUser = (supabaseAdmin, userId, taskId) => __awaiter(void 0, void 0, void 0, function* () {
    const taskRows = yield collectTaskTreeForDelete(supabaseAdmin, userId, taskId);
    if (!taskRows)
        return { ok: false, code: 404, error: "Task not found" };
    const taskIds = taskRows.map((row) => row.id);
    for (const row of taskRows) {
        try {
            yield (0, taskCalendarSyncService_1.processTaskDeleteJob)(supabaseAdmin, buildSyntheticDeleteJob({
                userId,
                listId: row.list_id,
                taskId: row.id,
                source: "delete_task",
            }));
        }
        catch (_a) {
            // Best effort: local delete should still succeed even if Google cleanup fails.
        }
    }
    yield deleteCalendarLinksForTasks(supabaseAdmin, userId, taskIds);
    const { error: taskDeleteError } = yield supabaseAdmin
        .from("tracker_tasks")
        .delete()
        .eq("user_id", userId)
        .in("id", taskIds);
    if (taskDeleteError)
        throw new Error(taskDeleteError.message);
    return { ok: true };
});
exports.deleteTaskForUser = deleteTaskForUser;
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
        const { error: clearParentRefsError } = yield supabaseAdmin
            .from("tracker_tasks")
            .update({ parent_task_id: null })
            .eq("user_id", userId)
            .in("parent_task_id", taskIds);
        if (clearParentRefsError)
            throw new Error(clearParentRefsError.message);
        yield deleteCalendarLinksForTasks(supabaseAdmin, userId, taskIds);
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
