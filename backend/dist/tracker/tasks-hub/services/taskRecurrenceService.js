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
exports.reconcileCompletedRecurringTasks = exports.setTaskCompletionForUser = exports.createNextRecurringTaskForCompletion = exports.getNextTaskSortOrder = void 0;
const taskCalendarEventUtils_1 = require("../../calendar/services/taskCalendarEventUtils");
const taskHubUtils_1 = require("./taskHubUtils");
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
exports.getNextTaskSortOrder = getNextTaskSortOrder;
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
    const sortOrder = yield (0, exports.getNextTaskSortOrder)(supabaseAdmin, userId, sourceTask.list_id, sourceTask.parent_task_id);
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
exports.createNextRecurringTaskForCompletion = createNextRecurringTaskForCompletion;
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
    const completedAt = isCompleted ? (0, taskHubUtils_1.nowIso)() : null;
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
        createdNextTask = yield (0, exports.createNextRecurringTaskForCompletion)(supabaseAdmin, userId, existingTask);
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
            const createdNextTask = yield (0, exports.createNextRecurringTaskForCompletion)(supabaseAdmin, taskRow.user_id, taskRow);
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
                error: (0, taskHubUtils_1.getRawErrorMessage)(error),
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
