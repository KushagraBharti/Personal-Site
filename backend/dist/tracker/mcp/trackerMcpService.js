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
exports.syncCalendarNow = exports.deleteMcpTask = exports.uncompleteMcpTask = exports.completeMcpTask = exports.updateMcpTask = exports.createMcpTask = exports.listCompletedTasks = exports.listTasks = exports.getTrackerSnapshot = exports.TrackerMcpServiceError = exports.COMPLETED_TASK_MAX_LIMIT = void 0;
const luxon_1 = require("luxon");
const taskCalendarEventUtils_1 = require("../calendar/services/taskCalendarEventUtils");
const taskCalendarSyncService_1 = require("../calendar/services/taskCalendarSyncService");
const taskMutationService_1 = require("../tasks-hub/services/taskMutationService");
const taskReadService_1 = require("../tasks-hub/services/taskReadService");
const taskRecurrenceService_1 = require("../tasks-hub/services/taskRecurrenceService");
const taskHubUtils_1 = require("../tasks-hub/services/taskHubUtils");
const DEFAULT_TIME_ZONE = "America/Chicago";
const DATE_ONLY_INPUT_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const COMPLETED_TASK_DEFAULT_LIMIT = 10;
exports.COMPLETED_TASK_MAX_LIMIT = 75;
class TrackerMcpServiceError extends Error {
    constructor(message, code = 400, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = "TrackerMcpServiceError";
    }
}
exports.TrackerMcpServiceError = TrackerMcpServiceError;
const hasOwn = (input, key) => Object.prototype.hasOwnProperty.call(input, key);
const getDefaultTimeZone = () => {
    const configured = process.env.TRACKER_MCP_DEFAULT_TIMEZONE ||
        process.env.GOOGLE_EVENT_TIMEZONE ||
        DEFAULT_TIME_ZONE;
    return (0, taskHubUtils_1.isValidIanaTimeZone)(configured) ? configured : DEFAULT_TIME_ZONE;
};
const normalizeMcpTimeZone = (value) => typeof value === "string" && (0, taskHubUtils_1.isValidIanaTimeZone)(value)
    ? value
    : getDefaultTimeZone();
const normalizeMcpDueAt = (value, fieldName = "due_at") => {
    if (value === undefined)
        return undefined;
    if (value === null)
        return null;
    if (typeof value !== "string") {
        throw new TrackerMcpServiceError(`${fieldName} must be a string or null.`);
    }
    const trimmed = value.trim();
    if (!trimmed)
        return null;
    if (DATE_ONLY_INPUT_REGEX.test(trimmed)) {
        const parsed = new Date(`${trimmed}T12:00:00.${taskCalendarEventUtils_1.DATE_ONLY_MARKER_MS}Z`);
        if (Number.isNaN(parsed.getTime())) {
            throw new TrackerMcpServiceError(`${fieldName} is not a valid date.`);
        }
        return parsed.toISOString();
    }
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
        throw new TrackerMcpServiceError(`${fieldName} must be ISO 8601, YYYY-MM-DD, or null.`);
    }
    if (parsed.getMilliseconds() !== taskCalendarEventUtils_1.DATE_ONLY_MARKER_MS) {
        parsed.setMilliseconds(0);
    }
    return parsed.toISOString();
};
const safeTimestamp = (value) => {
    if (!value)
        return 0;
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
};
const sortTasksForDisplay = (tasks) => [...tasks].sort((left, right) => {
    var _a, _b;
    const leftParent = (_a = left.parent_task_id) !== null && _a !== void 0 ? _a : "";
    const rightParent = (_b = right.parent_task_id) !== null && _b !== void 0 ? _b : "";
    if (leftParent !== rightParent)
        return leftParent.localeCompare(rightParent);
    if (left.sort_order !== right.sort_order) {
        return left.sort_order - right.sort_order;
    }
    return safeTimestamp(left.created_at) - safeTimestamp(right.created_at);
});
const sortCompletedTasks = (tasks) => [...tasks].sort((left, right) => {
    var _a, _b;
    return safeTimestamp((_a = right.completed_at) !== null && _a !== void 0 ? _a : right.updated_at) -
        safeTimestamp((_b = left.completed_at) !== null && _b !== void 0 ? _b : left.updated_at);
});
const serializeTask = (task) => ({
    id: task.id,
    list_id: task.list_id,
    parent_task_id: task.parent_task_id,
    title: task.title,
    details: task.details,
    due_at: task.due_at,
    due_timezone: task.due_timezone,
    due_kind: task.due_at
        ? (0, taskCalendarEventUtils_1.isDateOnlyIso)(task.due_at)
            ? "date"
            : "date_time"
        : null,
    is_completed: task.is_completed,
    completed_at: task.completed_at,
    recurrence_type: task.recurrence_type,
    recurrence_interval: task.recurrence_interval,
    recurrence_unit: task.recurrence_unit,
    recurrence_ends_at: task.recurrence_ends_at,
    is_recurring: (0, taskCalendarEventUtils_1.isRecurringTask)(task),
    sort_order: task.sort_order,
    created_at: task.created_at,
    updated_at: task.updated_at,
});
const serializeList = (list) => ({
    id: list.id,
    name: list.name,
    color_hex: list.color_hex,
    sort_order: list.sort_order,
    created_at: list.created_at,
    updated_at: list.updated_at,
});
const getVisibleTrackerData = (context) => __awaiter(void 0, void 0, void 0, function* () {
    const [lists, tasks, syncSettings] = yield Promise.all([
        (0, taskReadService_1.fetchTaskListsForUser)(context.supabaseAdmin, context.userId),
        (0, taskReadService_1.fetchTasksForUser)(context.supabaseAdmin, context.userId),
        (0, taskCalendarSyncService_1.listUserSyncEnabledLists)(context.supabaseAdmin, context.userId),
    ]);
    const syncEnabledListIds = new Set(syncSettings
        .filter((setting) => setting.sync_enabled)
        .map((setting) => setting.list_id));
    const visibleLists = lists.filter((list) => syncEnabledListIds.has(list.id));
    const visibleListIds = new Set(visibleLists.map((list) => list.id));
    const visibleTasks = tasks.filter((task) => visibleListIds.has(task.list_id));
    return {
        visibleLists,
        visibleListIds,
        visibleTasks,
    };
});
const getCalendarConnectionSummary = (context) => __awaiter(void 0, void 0, void 0, function* () {
    const { data, error } = yield context.supabaseAdmin
        .from("tracker_google_calendar_connections_public")
        .select("status,selected_calendar_summary,last_full_sync_at,last_incremental_sync_at,last_error")
        .eq("user_id", context.userId)
        .maybeSingle();
    if (error)
        throw new Error(error.message);
    return data;
});
const resolveSingleVisibleList = (context, reference, options) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { visibleLists } = yield getVisibleTrackerData(context);
    const listId = (_a = reference.list_id) === null || _a === void 0 ? void 0 : _a.trim();
    const listName = (_b = reference.list_name) === null || _b === void 0 ? void 0 : _b.trim();
    if (listId && listName) {
        throw new TrackerMcpServiceError("Provide either list_id or list_name, not both.", 400, { visible_lists: visibleLists.map(serializeList) });
    }
    if (!listId && !listName) {
        if (options === null || options === void 0 ? void 0 : options.required) {
            throw new TrackerMcpServiceError("A calendar-synced list_id or exact list_name is required.", 400, { visible_lists: visibleLists.map(serializeList) });
        }
        return null;
    }
    if (listId) {
        const list = visibleLists.find((candidate) => candidate.id === listId);
        if (!list) {
            throw new TrackerMcpServiceError("List not found in MCP-visible calendar-synced lists.", 404, { visible_lists: visibleLists.map(serializeList) });
        }
        return list;
    }
    const normalized = (0, taskHubUtils_1.normalizeListName)(listName !== null && listName !== void 0 ? listName : "");
    const matches = visibleLists.filter((candidate) => (0, taskHubUtils_1.normalizeListName)(candidate.name) === normalized);
    if (matches.length === 1)
        return matches[0];
    throw new TrackerMcpServiceError(matches.length > 1
        ? "List name is ambiguous. Use list_id."
        : "List not found in MCP-visible calendar-synced lists.", matches.length > 1 ? 400 : 404, { visible_lists: visibleLists.map(serializeList) });
});
const getRequestedVisibleLists = (context, reference) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield getVisibleTrackerData(context);
    const selectedList = yield resolveSingleVisibleList(context, reference);
    return Object.assign(Object.assign({}, data), { selectedLists: selectedList ? [selectedList] : data.visibleLists });
});
const getVisibleTaskOrThrow = (context, taskId) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield getVisibleTrackerData(context);
    const task = data.visibleTasks.find((candidate) => candidate.id === taskId);
    if (!task) {
        throw new TrackerMcpServiceError("Task not found in MCP-visible calendar-synced lists.", 404, { visible_lists: data.visibleLists.map(serializeList) });
    }
    return Object.assign(Object.assign({}, data), { task });
});
const queueTaskUpsertBestEffort = (context, task, source) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, taskCalendarSyncService_1.queueTaskUpsertForUser)(context.supabaseAdmin, context.userId, task, source);
    }
    catch (error) {
        console.error("Failed to enqueue MCP calendar task sync", error);
    }
});
const getDueDay = (task, fallbackTimeZone) => {
    if (!task.due_at)
        return null;
    const parsed = luxon_1.DateTime.fromISO(task.due_at, { zone: "utc" });
    if (!parsed.isValid)
        return null;
    const zone = (0, taskHubUtils_1.isValidIanaTimeZone)(task.due_timezone)
        ? task.due_timezone
        : fallbackTimeZone;
    return parsed.setZone(zone).toISODate();
};
const summarizeTasksForList = (list, tasks, now, fallbackTimeZone) => {
    const listTasks = tasks.filter((task) => task.list_id === list.id);
    const activeTasks = listTasks.filter((task) => !task.is_completed);
    const completedTasks = listTasks.filter((task) => task.is_completed);
    let overdue = 0;
    let today = 0;
    let tomorrow = 0;
    let noDue = 0;
    let recurringActive = 0;
    for (const task of activeTasks) {
        if (!task.due_at) {
            noDue += 1;
        }
        else {
            const zone = (0, taskHubUtils_1.isValidIanaTimeZone)(task.due_timezone)
                ? task.due_timezone
                : fallbackTimeZone;
            const dueDay = getDueDay(task, fallbackTimeZone);
            const nowInZone = now.setZone(zone);
            if (dueDay && dueDay === nowInZone.toISODate())
                today += 1;
            if (dueDay && dueDay === nowInZone.plus({ days: 1 }).toISODate()) {
                tomorrow += 1;
            }
            if ((0, taskCalendarEventUtils_1.isTaskOverdue)(task, now))
                overdue += 1;
        }
        if ((0, taskCalendarEventUtils_1.isRecurringTask)(task))
            recurringActive += 1;
    }
    return {
        list: serializeList(list),
        counts: {
            active: activeTasks.length,
            completed: completedTasks.length,
            total: listTasks.length,
            overdue,
            today,
            tomorrow,
            no_due: noDue,
            recurring_active: recurringActive,
        },
    };
};
const getTrackerSnapshot = (context, input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const data = yield getVisibleTrackerData(context);
    const fallbackTimeZone = normalizeMcpTimeZone(input === null || input === void 0 ? void 0 : input.timezone);
    const now = luxon_1.DateTime.utc();
    const lists = data.visibleLists.map((list) => summarizeTasksForList(list, data.visibleTasks, now, fallbackTimeZone));
    const totals = lists.reduce((acc, item) => {
        Object.entries(item.counts).forEach(([key, value]) => {
            acc[key] += value;
        });
        return acc;
    }, {
        active: 0,
        completed: 0,
        total: 0,
        overdue: 0,
        today: 0,
        tomorrow: 0,
        no_due: 0,
        recurring_active: 0,
    });
    const calendarStatus = yield getCalendarConnectionSummary(context).catch(() => null);
    return {
        ok: true,
        generated_at: now.toISO(),
        scope: "Only non-archived task lists with Google Calendar sync enabled are visible through MCP.",
        timezone: fallbackTimeZone,
        calendar: calendarStatus
            ? {
                connected: calendarStatus.status === "connected",
                status: calendarStatus.status,
                selected_calendar_summary: (_a = calendarStatus.selected_calendar_summary) !== null && _a !== void 0 ? _a : null,
                last_full_sync_at: (_b = calendarStatus.last_full_sync_at) !== null && _b !== void 0 ? _b : null,
                last_incremental_sync_at: (_c = calendarStatus.last_incremental_sync_at) !== null && _c !== void 0 ? _c : null,
                last_error: (_d = calendarStatus.last_error) !== null && _d !== void 0 ? _d : null,
            }
            : null,
        totals,
        lists,
    };
});
exports.getTrackerSnapshot = getTrackerSnapshot;
const listTasks = (context_1, ...args_1) => __awaiter(void 0, [context_1, ...args_1], void 0, function* (context, input = {}) {
    const data = yield getRequestedVisibleLists(context, input);
    return {
        ok: true,
        scope: "Only active incomplete tasks from calendar-synced lists are returned.",
        lists: data.selectedLists.map((list) => {
            const activeTasks = sortTasksForDisplay(data.visibleTasks.filter((task) => task.list_id === list.id && !task.is_completed));
            return {
                list: serializeList(list),
                active_task_count: activeTasks.length,
                tasks: activeTasks.map(serializeTask),
            };
        }),
    };
});
exports.listTasks = listTasks;
const listCompletedTasks = (context_1, ...args_1) => __awaiter(void 0, [context_1, ...args_1], void 0, function* (context, input = {}) {
    const data = yield getRequestedVisibleLists(context, input);
    const limitPerList = Math.max(1, Math.min(Number.isFinite(input.limit_per_list)
        ? Math.floor(input.limit_per_list)
        : COMPLETED_TASK_DEFAULT_LIMIT, exports.COMPLETED_TASK_MAX_LIMIT));
    return {
        ok: true,
        scope: "Only recently completed tasks from calendar-synced lists are returned.",
        limit_per_list: limitPerList,
        lists: data.selectedLists.map((list) => {
            const completedTasks = sortCompletedTasks(data.visibleTasks.filter((task) => task.list_id === list.id && task.is_completed));
            const tasks = completedTasks.slice(0, limitPerList);
            return {
                list: serializeList(list),
                completed_task_count: completedTasks.length,
                returned_task_count: tasks.length,
                tasks: tasks.map(serializeTask),
            };
        }),
    };
});
exports.listCompletedTasks = listCompletedTasks;
const createMcpTask = (context, input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const targetList = yield resolveSingleVisibleList(context, input, {
        required: true,
    });
    if (!targetList) {
        throw new TrackerMcpServiceError("A visible list is required.");
    }
    const dueAt = normalizeMcpDueAt((_a = input.due_at) !== null && _a !== void 0 ? _a : null);
    const dueTimeZone = dueAt ? normalizeMcpTimeZone(input.due_timezone) : null;
    const result = yield (0, taskMutationService_1.createTaskForUser)(context.supabaseAdmin, context.userId, Object.assign(Object.assign({}, input), { list_id: targetList.id, due_at: dueAt, due_timezone: dueTimeZone, browser_timezone: dueTimeZone !== null && dueTimeZone !== void 0 ? dueTimeZone : getDefaultTimeZone() }));
    if (!result.ok) {
        throw new TrackerMcpServiceError(result.error, result.code);
    }
    yield queueTaskUpsertBestEffort(context, result.task, "mcp_task_create");
    return {
        ok: true,
        task: serializeTask(result.task),
    };
});
exports.createMcpTask = createMcpTask;
const updateMcpTask = (context, input) => __awaiter(void 0, void 0, void 0, function* () {
    yield getVisibleTaskOrThrow(context, input.task_id);
    const payload = {};
    if (hasOwn(input, "list_id") || hasOwn(input, "list_name")) {
        const targetList = yield resolveSingleVisibleList(context, input, {
            required: true,
        });
        payload.list_id = targetList === null || targetList === void 0 ? void 0 : targetList.id;
    }
    for (const field of [
        "title",
        "details",
        "parent_task_id",
        "recurrence_type",
        "recurrence_interval",
        "recurrence_unit",
        "recurrence_ends_at",
    ]) {
        if (hasOwn(input, field))
            payload[field] = input[field];
    }
    if (hasOwn(input, "due_at")) {
        payload.due_at = normalizeMcpDueAt(input.due_at);
    }
    if (hasOwn(input, "due_timezone")) {
        payload.due_timezone = normalizeMcpTimeZone(input.due_timezone);
        payload.browser_timezone = payload.due_timezone;
    }
    else if (hasOwn(input, "due_at")) {
        payload.browser_timezone = getDefaultTimeZone();
    }
    const result = yield (0, taskMutationService_1.updateTaskForUser)(context.supabaseAdmin, context.userId, input.task_id, payload);
    if (!result.ok) {
        throw new TrackerMcpServiceError(result.error, result.code);
    }
    yield getVisibleTaskOrThrow(context, result.task.id);
    yield queueTaskUpsertBestEffort(context, result.task, "mcp_task_update");
    return {
        ok: true,
        task: serializeTask(result.task),
    };
});
exports.updateMcpTask = updateMcpTask;
const completeMcpTask = (context, taskId) => __awaiter(void 0, void 0, void 0, function* () {
    yield getVisibleTaskOrThrow(context, taskId);
    const result = yield (0, taskRecurrenceService_1.setTaskCompletionForUser)(context.supabaseAdmin, context.userId, taskId, true);
    if (!result.ok) {
        throw new TrackerMcpServiceError(result.error, result.code);
    }
    yield queueTaskUpsertBestEffort(context, result.task, "mcp_task_completion");
    if (result.createdNextTask) {
        yield queueTaskUpsertBestEffort(context, result.createdNextTask, "mcp_task_completion_next");
    }
    return {
        ok: true,
        task: serializeTask(result.task),
        created_next_task: result.createdNextTask
            ? serializeTask(result.createdNextTask)
            : null,
    };
});
exports.completeMcpTask = completeMcpTask;
const uncompleteMcpTask = (context, taskId) => __awaiter(void 0, void 0, void 0, function* () {
    yield getVisibleTaskOrThrow(context, taskId);
    const result = yield (0, taskRecurrenceService_1.setTaskCompletionForUser)(context.supabaseAdmin, context.userId, taskId, false);
    if (!result.ok) {
        throw new TrackerMcpServiceError(result.error, result.code);
    }
    yield queueTaskUpsertBestEffort(context, result.task, "mcp_task_uncomplete");
    return {
        ok: true,
        task: serializeTask(result.task),
    };
});
exports.uncompleteMcpTask = uncompleteMcpTask;
const collectTaskSubtree = (tasks, rootTaskId) => {
    var _a, _b, _c;
    const byParent = new Map();
    for (const task of tasks) {
        const parentId = (_a = task.parent_task_id) !== null && _a !== void 0 ? _a : null;
        byParent.set(parentId, [...((_b = byParent.get(parentId)) !== null && _b !== void 0 ? _b : []), task]);
    }
    const subtree = [];
    const queue = [rootTaskId];
    const seen = new Set();
    while (queue.length > 0) {
        const taskId = queue.shift();
        if (seen.has(taskId))
            continue;
        seen.add(taskId);
        const task = tasks.find((candidate) => candidate.id === taskId);
        if (task)
            subtree.push(task);
        for (const child of (_c = byParent.get(taskId)) !== null && _c !== void 0 ? _c : []) {
            queue.push(child.id);
        }
    }
    return subtree;
};
const deleteMcpTask = (context, input) => __awaiter(void 0, void 0, void 0, function* () {
    if (!input.confirm_delete) {
        throw new TrackerMcpServiceError("confirm_delete must be true to delete a task.", 400);
    }
    const data = yield getVisibleTaskOrThrow(context, input.task_id);
    if (input.expected_title &&
        input.expected_title.trim() &&
        input.expected_title.trim() !== data.task.title) {
        throw new TrackerMcpServiceError("expected_title does not match the task title; delete refused.", 409, { actual_title: data.task.title });
    }
    const subtree = collectTaskSubtree(data.visibleTasks, input.task_id);
    if (subtree.length > 1 && !input.confirm_delete_children) {
        throw new TrackerMcpServiceError("Task has subtasks. Set confirm_delete_children to true to delete the whole subtree.", 400, {
            child_task_count: subtree.length - 1,
            child_task_ids: subtree.slice(1).map((task) => task.id),
        });
    }
    const result = yield (0, taskMutationService_1.deleteTaskForUser)(context.supabaseAdmin, context.userId, input.task_id);
    if (!result.ok) {
        throw new TrackerMcpServiceError(result.error, result.code);
    }
    return {
        ok: true,
        deleted_task_id: input.task_id,
        deleted_task_title: data.task.title,
        deleted_task_count: subtree.length,
        deleted_task_ids: subtree.map((task) => task.id),
    };
});
exports.deleteMcpTask = deleteMcpTask;
const syncCalendarNow = (context) => __awaiter(void 0, void 0, void 0, function* () {
    if (process.env.CALENDAR_SYNC_ENABLED === "0") {
        throw new TrackerMcpServiceError("Calendar sync is disabled.", 503);
    }
    try {
        const runId = yield (0, taskCalendarSyncService_1.queueManualSyncForUser)(context.supabaseAdmin, context.userId);
        yield (0, taskCalendarSyncService_1.processCalendarSyncJobs)({
            userId: context.userId,
            batchSize: 1,
            lanes: ["reconcile"],
        }).catch(() => { });
        return {
            ok: true,
            run_id: runId,
            queued: true,
        };
    }
    catch (_a) {
        const fallback = yield (0, taskCalendarSyncService_1.runLegacyManualSyncForUser)(context.supabaseAdmin, context.userId);
        return {
            ok: true,
            run_id: "",
            queued: false,
            processed: fallback.processed,
            failed: fallback.failed,
            failures: fallback.failures,
        };
    }
});
exports.syncCalendarNow = syncCalendarNow;
