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
exports.deleteTaskListForUser = exports.reorderTaskListsForUser = exports.updateTaskListForUser = exports.createTaskListForUser = void 0;
const taskHubUtils_1 = require("./taskHubUtils");
const taskCalendarCleanupService_1 = require("./taskCalendarCleanupService");
const fetchActiveListsForUser = (supabaseAdmin, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const { data, error } = yield supabaseAdmin
        .from("tracker_task_lists")
        .select("*")
        .eq("user_id", userId)
        .eq("archived", false)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
    if (error)
        throw new Error(error.message);
    return (data !== null && data !== void 0 ? data : []);
});
const getNextListSortOrder = (lists) => {
    if (lists.length === 0)
        return 1;
    return Math.max(...lists.map((list) => Number(list.sort_order) || 0)) + 1;
};
const findDuplicateList = (lists, name, exceptListId) => {
    var _a;
    return (_a = lists.find((list) => list.id !== exceptListId &&
        (0, taskHubUtils_1.normalizeListName)(list.name) === (0, taskHubUtils_1.normalizeListName)(name))) !== null && _a !== void 0 ? _a : null;
};
const createTaskListForUser = (supabaseAdmin, userId, input) => __awaiter(void 0, void 0, void 0, function* () {
    const cleanedName = (0, taskHubUtils_1.cleanOptionalString)(input.name);
    if (!cleanedName)
        return { ok: false, code: 400, error: "List name is required" };
    const lists = yield fetchActiveListsForUser(supabaseAdmin, userId);
    const duplicate = findDuplicateList(lists, cleanedName);
    if (duplicate) {
        return { ok: false, code: 409, error: `List "${duplicate.name}" already exists.` };
    }
    const requestedColor = (0, taskHubUtils_1.cleanOptionalString)(input.color_hex);
    const colorHex = requestedColor || (0, taskHubUtils_1.pickAutoListColor)(lists.map((list) => list.color_hex));
    const { data, error } = yield supabaseAdmin
        .from("tracker_task_lists")
        .insert({
        user_id: userId,
        name: cleanedName,
        color_hex: colorHex,
        sort_order: getNextListSortOrder(lists),
        archived: false,
    })
        .select("*")
        .single();
    if (error)
        throw new Error(error.message);
    return { ok: true, list: data };
});
exports.createTaskListForUser = createTaskListForUser;
const updateTaskListForUser = (supabaseAdmin, userId, listId, input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const lists = yield fetchActiveListsForUser(supabaseAdmin, userId);
    const existing = (_a = lists.find((list) => list.id === listId)) !== null && _a !== void 0 ? _a : null;
    if (!existing)
        return { ok: false, code: 404, error: "List not found" };
    const payload = {};
    if (Object.prototype.hasOwnProperty.call(input, "name")) {
        const cleanedName = (0, taskHubUtils_1.cleanOptionalString)(input.name);
        if (!cleanedName)
            return { ok: false, code: 400, error: "List name is required" };
        const duplicate = findDuplicateList(lists, cleanedName, listId);
        if (duplicate) {
            return { ok: false, code: 409, error: `List "${duplicate.name}" already exists.` };
        }
        payload.name = cleanedName;
    }
    if (Object.prototype.hasOwnProperty.call(input, "color_hex")) {
        const cleanedColor = (0, taskHubUtils_1.cleanOptionalString)(input.color_hex);
        if (!cleanedColor)
            return { ok: false, code: 400, error: "color_hex is required" };
        payload.color_hex = cleanedColor;
    }
    if (Object.keys(payload).length === 0)
        return { ok: true, list: existing };
    const { data, error } = yield supabaseAdmin
        .from("tracker_task_lists")
        .update(payload)
        .eq("user_id", userId)
        .eq("id", listId)
        .select("*")
        .single();
    if (error)
        throw new Error(error.message);
    return { ok: true, list: data };
});
exports.updateTaskListForUser = updateTaskListForUser;
const reorderTaskListsForUser = (supabaseAdmin, userId, orderedListIds) => __awaiter(void 0, void 0, void 0, function* () {
    if (!Array.isArray(orderedListIds) || orderedListIds.some((id) => typeof id !== "string")) {
        return { ok: false, code: 400, error: "ordered_list_ids must be an array of list ids" };
    }
    if (orderedListIds.length === 0)
        return { ok: false, code: 400, error: "ordered_list_ids is required" };
    const lists = yield fetchActiveListsForUser(supabaseAdmin, userId);
    const listById = new Map(lists.map((list) => [list.id, list]));
    const uniqueIds = new Set(orderedListIds);
    if (uniqueIds.size !== orderedListIds.length) {
        return { ok: false, code: 400, error: "ordered_list_ids must not contain duplicates" };
    }
    if (orderedListIds.some((listId) => !listById.has(listId))) {
        return { ok: false, code: 400, error: "ordered_list_ids contains an unknown list" };
    }
    const updatedLists = [];
    for (const [index, listId] of orderedListIds.entries()) {
        const { data, error } = yield supabaseAdmin
            .from("tracker_task_lists")
            .update({ sort_order: index + 1 })
            .eq("user_id", userId)
            .eq("id", listId)
            .select("*")
            .single();
        if (error)
            throw new Error(error.message);
        updatedLists.push(data);
    }
    return {
        ok: true,
        lists: updatedLists.sort((left, right) => left.sort_order - right.sort_order),
    };
});
exports.reorderTaskListsForUser = reorderTaskListsForUser;
const deleteTaskListForUser = (supabaseAdmin, userId, listId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const activeLists = yield fetchActiveListsForUser(supabaseAdmin, userId);
    const listRow = (_a = activeLists.find((list) => list.id === listId)) !== null && _a !== void 0 ? _a : null;
    if (!listRow)
        return { ok: false, code: 404, error: "List not found" };
    if (activeLists.length <= 1) {
        return {
            ok: false,
            code: 400,
            error: "Create another list before deleting your last remaining list.",
        };
    }
    const { data: taskRows, error: taskRowsError } = yield supabaseAdmin
        .from("tracker_tasks")
        .select("id")
        .eq("user_id", userId)
        .eq("list_id", listId);
    if (taskRowsError)
        throw new Error(taskRowsError.message);
    const taskIds = (taskRows !== null && taskRows !== void 0 ? taskRows : []).map((row) => String(row.id)).filter(Boolean);
    for (const taskId of taskIds) {
        yield (0, taskCalendarCleanupService_1.processBestEffortTaskDeleteCleanup)(supabaseAdmin, {
            userId,
            listId,
            taskId,
        });
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
        yield (0, taskCalendarCleanupService_1.deleteCalendarLinksForTasks)(supabaseAdmin, userId, taskIds);
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
