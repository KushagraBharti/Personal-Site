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
exports.reorderTasksForUser = exports.deleteTaskForUser = exports.updateTaskForUser = exports.createTaskForUser = void 0;
const taskHubUtils_1 = require("./taskHubUtils");
const taskCalendarCleanupService_1 = require("./taskCalendarCleanupService");
const taskRecurrenceService_1 = require("./taskRecurrenceService");
const hasOwn = (input, key) => Object.prototype.hasOwnProperty.call(input, key);
const normalizePositiveInteger = (value, fallback) => {
    if (value === undefined || value === null || value === "")
        return fallback;
    const parsed = Number(value);
    if (!Number.isFinite(parsed))
        return null;
    return Math.max(1, Math.floor(parsed));
};
const normalizeDueAt = (value) => {
    if (value === undefined)
        return undefined;
    if (value === null)
        return null;
    if (typeof value !== "string")
        return null;
    return value;
};
const normalizeRecurrenceCreateFields = (input) => {
    const recurrenceType = input.recurrence_type === undefined
        ? "none"
        : (0, taskHubUtils_1.normalizeRecurrenceType)(input.recurrence_type);
    if (!recurrenceType)
        return { ok: false, code: 400, error: "Invalid recurrence_type" };
    if (recurrenceType === "none") {
        return {
            ok: true,
            recurrenceType,
            recurrenceInterval: null,
            recurrenceUnit: null,
            recurrenceEndsAt: null,
        };
    }
    const recurrenceEndsAt = (0, taskHubUtils_1.cleanNullableString)(input.recurrence_ends_at);
    if (recurrenceEndsAt === undefined || recurrenceEndsAt === null || typeof recurrenceEndsAt === "string") {
        if (recurrenceType !== "custom") {
            return {
                ok: true,
                recurrenceType,
                recurrenceInterval: null,
                recurrenceUnit: null,
                recurrenceEndsAt: recurrenceEndsAt !== null && recurrenceEndsAt !== void 0 ? recurrenceEndsAt : null,
            };
        }
        const recurrenceInterval = normalizePositiveInteger(input.recurrence_interval, 1);
        if (!recurrenceInterval) {
            return { ok: false, code: 400, error: "Invalid recurrence_interval" };
        }
        const recurrenceUnit = input.recurrence_unit === undefined
            ? "day"
            : (0, taskHubUtils_1.normalizeRecurrenceUnit)(input.recurrence_unit);
        if (!recurrenceUnit)
            return { ok: false, code: 400, error: "Invalid recurrence_unit" };
        return {
            ok: true,
            recurrenceType,
            recurrenceInterval,
            recurrenceUnit,
            recurrenceEndsAt: recurrenceEndsAt !== null && recurrenceEndsAt !== void 0 ? recurrenceEndsAt : null,
        };
    }
    return { ok: false, code: 400, error: "Invalid recurrence_ends_at" };
};
const fetchTaskForUser = (supabaseAdmin, userId, taskId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { data, error } = yield supabaseAdmin
        .from("tracker_tasks")
        .select("*")
        .eq("user_id", userId)
        .eq("id", taskId)
        .maybeSingle();
    if (error)
        throw new Error(error.message);
    return (_a = data) !== null && _a !== void 0 ? _a : null;
});
const assertListBelongsToUser = (supabaseAdmin, userId, listId) => __awaiter(void 0, void 0, void 0, function* () {
    const { data, error } = yield supabaseAdmin
        .from("tracker_task_lists")
        .select("id")
        .eq("user_id", userId)
        .eq("id", listId)
        .eq("archived", false)
        .maybeSingle();
    if (error)
        throw new Error(error.message);
    if (!data)
        return { ok: false, code: 404, error: "List not found" };
    return null;
});
const assertParentBelongsToList = (supabaseAdmin, userId, listId, parentTaskId, editedTaskId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!parentTaskId)
        return null;
    if (parentTaskId === editedTaskId) {
        return { ok: false, code: 400, error: "Task cannot be its own parent" };
    }
    const parentTask = yield fetchTaskForUser(supabaseAdmin, userId, parentTaskId);
    if (!parentTask)
        return { ok: false, code: 404, error: "Parent task not found" };
    if (parentTask.list_id !== listId) {
        return { ok: false, code: 400, error: "Parent task must be in the same list" };
    }
    return null;
});
const createTaskForUser = (supabaseAdmin, userId, input) => __awaiter(void 0, void 0, void 0, function* () {
    const listId = (0, taskHubUtils_1.cleanOptionalString)(input.list_id);
    if (!listId)
        return { ok: false, code: 400, error: "list_id is required" };
    const title = (0, taskHubUtils_1.cleanOptionalString)(input.title);
    if (!title)
        return { ok: false, code: 400, error: "Task title is required" };
    const listFailure = yield assertListBelongsToUser(supabaseAdmin, userId, listId);
    if (listFailure)
        return listFailure;
    const parentTaskId = (0, taskHubUtils_1.cleanNullableString)(input.parent_task_id, { trim: true });
    if (parentTaskId === undefined || typeof parentTaskId === "string" || parentTaskId === null) {
        const parentFailure = yield assertParentBelongsToList(supabaseAdmin, userId, listId, parentTaskId !== null && parentTaskId !== void 0 ? parentTaskId : null);
        if (parentFailure)
            return parentFailure;
    }
    else {
        return { ok: false, code: 400, error: "Invalid parent_task_id" };
    }
    const dueAt = normalizeDueAt(input.due_at);
    if (dueAt === undefined) {
        return { ok: false, code: 400, error: "due_at is required" };
    }
    if (typeof dueAt !== "string" && dueAt !== null) {
        return { ok: false, code: 400, error: "Invalid due_at" };
    }
    const recurrenceFields = normalizeRecurrenceCreateFields(input);
    if (!recurrenceFields.ok)
        return recurrenceFields;
    if (recurrenceFields.recurrenceType !== "none" && !dueAt) {
        return { ok: false, code: 400, error: "Recurring tasks require a due date." };
    }
    const detailsInput = (0, taskHubUtils_1.cleanNullableString)(input.details, { trim: true });
    const details = detailsInput ? detailsInput : null;
    const sortOrder = yield (0, taskRecurrenceService_1.getNextTaskSortOrder)(supabaseAdmin, userId, listId, parentTaskId !== null && parentTaskId !== void 0 ? parentTaskId : null);
    const payload = {
        user_id: userId,
        list_id: listId,
        parent_task_id: parentTaskId !== null && parentTaskId !== void 0 ? parentTaskId : null,
        title,
        details,
        due_at: dueAt,
        due_timezone: (0, taskHubUtils_1.normalizeTaskDueTimeZone)(dueAt, input.due_timezone, input.browser_timezone),
        is_completed: false,
        completed_at: null,
        recurrence_type: recurrenceFields.recurrenceType,
        recurrence_interval: recurrenceFields.recurrenceInterval,
        recurrence_unit: recurrenceFields.recurrenceUnit,
        recurrence_ends_at: recurrenceFields.recurrenceEndsAt,
        sort_order: sortOrder,
    };
    const { data, error } = yield supabaseAdmin
        .from("tracker_tasks")
        .insert(payload)
        .select("*")
        .single();
    if (error)
        throw new Error(error.message);
    return { ok: true, task: data };
});
exports.createTaskForUser = createTaskForUser;
const updateTaskForUser = (supabaseAdmin, userId, taskId, input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const currentTask = yield fetchTaskForUser(supabaseAdmin, userId, taskId);
    if (!currentTask)
        return { ok: false, code: 404, error: "Task not found" };
    const payload = {};
    let nextListId = currentTask.list_id;
    if (hasOwn(input, "list_id")) {
        const listId = (0, taskHubUtils_1.cleanOptionalString)(input.list_id);
        if (!listId)
            return { ok: false, code: 400, error: "list_id is required" };
        const listFailure = yield assertListBelongsToUser(supabaseAdmin, userId, listId);
        if (listFailure)
            return listFailure;
        nextListId = listId;
        payload.list_id = listId;
    }
    let nextParentTaskId = currentTask.parent_task_id;
    if (hasOwn(input, "parent_task_id")) {
        const parentTaskId = (0, taskHubUtils_1.cleanNullableString)(input.parent_task_id, { trim: true });
        if (!(parentTaskId === undefined || typeof parentTaskId === "string" || parentTaskId === null)) {
            return { ok: false, code: 400, error: "Invalid parent_task_id" };
        }
        nextParentTaskId = parentTaskId !== null && parentTaskId !== void 0 ? parentTaskId : null;
        payload.parent_task_id = nextParentTaskId;
    }
    if (hasOwn(input, "list_id") || hasOwn(input, "parent_task_id")) {
        const parentFailure = yield assertParentBelongsToList(supabaseAdmin, userId, nextListId, nextParentTaskId, taskId);
        if (parentFailure)
            return parentFailure;
    }
    if (hasOwn(input, "title")) {
        const title = (0, taskHubUtils_1.cleanOptionalString)(input.title);
        if (!title)
            return { ok: false, code: 400, error: "Task title is required" };
        payload.title = title;
    }
    if (hasOwn(input, "details")) {
        const details = (0, taskHubUtils_1.cleanNullableString)(input.details, { trim: true });
        if (!(details === undefined || details === null || typeof details === "string")) {
            return { ok: false, code: 400, error: "Invalid details" };
        }
        payload.details = details ? details : null;
    }
    let nextDueAt = currentTask.due_at;
    if (hasOwn(input, "due_at")) {
        const dueAt = normalizeDueAt(input.due_at);
        if (!(typeof dueAt === "string" || dueAt === null)) {
            return { ok: false, code: 400, error: "Invalid due_at" };
        }
        nextDueAt = dueAt;
        payload.due_at = dueAt;
    }
    const recurrenceTouched = hasOwn(input, "recurrence_type") ||
        hasOwn(input, "recurrence_interval") ||
        hasOwn(input, "recurrence_unit") ||
        hasOwn(input, "recurrence_ends_at") ||
        hasOwn(input, "due_at");
    let nextRecurrenceType = currentTask.recurrence_type;
    if (hasOwn(input, "recurrence_type")) {
        const recurrenceType = (0, taskHubUtils_1.normalizeRecurrenceType)(input.recurrence_type);
        if (!recurrenceType)
            return { ok: false, code: 400, error: "Invalid recurrence_type" };
        nextRecurrenceType = recurrenceType;
        payload.recurrence_type = recurrenceType;
    }
    if (recurrenceTouched) {
        if (nextRecurrenceType !== "none" && !nextDueAt) {
            return { ok: false, code: 400, error: "Recurring tasks require a due date." };
        }
        if (nextRecurrenceType === "none") {
            payload.recurrence_interval = null;
            payload.recurrence_unit = null;
            payload.recurrence_ends_at = null;
        }
        else if (nextRecurrenceType === "custom") {
            const recurrenceInterval = hasOwn(input, "recurrence_interval")
                ? normalizePositiveInteger(input.recurrence_interval, (_a = currentTask.recurrence_interval) !== null && _a !== void 0 ? _a : 1)
                : (_b = currentTask.recurrence_interval) !== null && _b !== void 0 ? _b : 1;
            if (!recurrenceInterval) {
                return { ok: false, code: 400, error: "Invalid recurrence_interval" };
            }
            const recurrenceUnit = hasOwn(input, "recurrence_unit")
                ? (0, taskHubUtils_1.normalizeRecurrenceUnit)(input.recurrence_unit)
                : (_c = currentTask.recurrence_unit) !== null && _c !== void 0 ? _c : "day";
            if (!recurrenceUnit)
                return { ok: false, code: 400, error: "Invalid recurrence_unit" };
            payload.recurrence_interval = recurrenceInterval;
            payload.recurrence_unit = recurrenceUnit;
            if (hasOwn(input, "recurrence_ends_at")) {
                const recurrenceEndsAt = (0, taskHubUtils_1.cleanNullableString)(input.recurrence_ends_at);
                if (!(recurrenceEndsAt === undefined || recurrenceEndsAt === null || typeof recurrenceEndsAt === "string")) {
                    return { ok: false, code: 400, error: "Invalid recurrence_ends_at" };
                }
                payload.recurrence_ends_at = recurrenceEndsAt !== null && recurrenceEndsAt !== void 0 ? recurrenceEndsAt : null;
            }
        }
        else {
            payload.recurrence_interval = null;
            payload.recurrence_unit = null;
            if (hasOwn(input, "recurrence_ends_at")) {
                const recurrenceEndsAt = (0, taskHubUtils_1.cleanNullableString)(input.recurrence_ends_at);
                if (!(recurrenceEndsAt === undefined || recurrenceEndsAt === null || typeof recurrenceEndsAt === "string")) {
                    return { ok: false, code: 400, error: "Invalid recurrence_ends_at" };
                }
                payload.recurrence_ends_at = recurrenceEndsAt !== null && recurrenceEndsAt !== void 0 ? recurrenceEndsAt : null;
            }
        }
    }
    if (hasOwn(input, "due_at") || hasOwn(input, "due_timezone") || recurrenceTouched) {
        payload.due_timezone = (0, taskHubUtils_1.normalizeTaskDueTimeZone)(nextDueAt, input.due_timezone, input.browser_timezone, currentTask.due_timezone);
    }
    if (Object.keys(payload).length === 0)
        return { ok: true, task: currentTask };
    const { data, error } = yield supabaseAdmin
        .from("tracker_tasks")
        .update(payload)
        .eq("user_id", userId)
        .eq("id", taskId)
        .select("*")
        .single();
    if (error)
        throw new Error(error.message);
    return { ok: true, task: data };
});
exports.updateTaskForUser = updateTaskForUser;
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
const deleteTaskForUser = (supabaseAdmin, userId, taskId) => __awaiter(void 0, void 0, void 0, function* () {
    const taskRows = yield collectTaskTreeForDelete(supabaseAdmin, userId, taskId);
    if (!taskRows)
        return { ok: false, code: 404, error: "Task not found" };
    const taskIds = taskRows.map((row) => row.id);
    for (const row of taskRows) {
        yield (0, taskCalendarCleanupService_1.processBestEffortTaskDeleteCleanup)(supabaseAdmin, {
            userId,
            listId: row.list_id,
            taskId: row.id,
            source: "delete_task",
        });
    }
    yield (0, taskCalendarCleanupService_1.deleteCalendarLinksForTasks)(supabaseAdmin, userId, taskIds);
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
const reorderTasksForUser = (supabaseAdmin, userId, input) => __awaiter(void 0, void 0, void 0, function* () {
    const listId = (0, taskHubUtils_1.cleanOptionalString)(input.list_id);
    if (!listId)
        return { ok: false, code: 400, error: "list_id is required" };
    const parentTaskId = (0, taskHubUtils_1.cleanNullableString)(input.parent_task_id, { trim: true });
    if (!(parentTaskId === undefined || parentTaskId === null || typeof parentTaskId === "string")) {
        return { ok: false, code: 400, error: "Invalid parent_task_id" };
    }
    const orderedTaskIds = input.ordered_task_ids;
    if (!Array.isArray(orderedTaskIds) || orderedTaskIds.some((id) => typeof id !== "string")) {
        return { ok: false, code: 400, error: "ordered_task_ids must be an array of task ids" };
    }
    if (orderedTaskIds.length === 0)
        return { ok: false, code: 400, error: "ordered_task_ids is required" };
    const uniqueIds = new Set(orderedTaskIds);
    if (uniqueIds.size !== orderedTaskIds.length) {
        return { ok: false, code: 400, error: "ordered_task_ids must not contain duplicates" };
    }
    let siblingQuery = supabaseAdmin
        .from("tracker_tasks")
        .select("*")
        .eq("user_id", userId)
        .eq("list_id", listId);
    siblingQuery = parentTaskId
        ? siblingQuery.eq("parent_task_id", parentTaskId)
        : siblingQuery.is("parent_task_id", null);
    const { data: siblingRows, error: siblingError } = yield siblingQuery;
    if (siblingError)
        throw new Error(siblingError.message);
    const siblingById = new Map((siblingRows !== null && siblingRows !== void 0 ? siblingRows : []).map((task) => [task.id, task]));
    if (orderedTaskIds.some((taskId) => !siblingById.has(taskId))) {
        return { ok: false, code: 400, error: "ordered_task_ids contains an unknown task" };
    }
    const updatedTasks = [];
    for (const [index, taskId] of orderedTaskIds.entries()) {
        const { data, error } = yield supabaseAdmin
            .from("tracker_tasks")
            .update({ sort_order: index + 1 })
            .eq("user_id", userId)
            .eq("id", taskId)
            .select("*")
            .single();
        if (error)
            throw new Error(error.message);
        updatedTasks.push(data);
    }
    return {
        ok: true,
        tasks: updatedTasks.sort((left, right) => left.sort_order - right.sort_order),
    };
});
exports.reorderTasksForUser = reorderTasksForUser;
