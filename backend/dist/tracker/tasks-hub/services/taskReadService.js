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
exports.getTrackerBootstrapForUser = exports.fetchSortPreferencesForUser = exports.fetchTasksForUser = exports.fetchTaskListsForUser = void 0;
const taskCalendarEventUtils_1 = require("../../calendar/services/taskCalendarEventUtils");
const taskHubUtils_1 = require("./taskHubUtils");
const fetchTaskListsForUser = (supabaseAdmin, userId) => __awaiter(void 0, void 0, void 0, function* () {
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
exports.fetchTaskListsForUser = fetchTaskListsForUser;
const fetchTasksForUser = (supabaseAdmin, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const { data, error } = yield supabaseAdmin
        .from("tracker_tasks")
        .select("*")
        .eq("user_id", userId)
        .order("list_id", { ascending: true })
        .order("parent_task_id", { ascending: true, nullsFirst: true })
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
    if (error)
        throw new Error(error.message);
    return (data !== null && data !== void 0 ? data : []);
});
exports.fetchTasksForUser = fetchTasksForUser;
const fetchSortPreferencesForUser = (supabaseAdmin, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const { data, error } = yield supabaseAdmin
        .from("tracker_task_sort_preferences")
        .select("*")
        .eq("user_id", userId);
    if (error)
        throw new Error(error.message);
    return (data !== null && data !== void 0 ? data : []);
});
exports.fetchSortPreferencesForUser = fetchSortPreferencesForUser;
const seedDefaultTaskListForUser = (supabaseAdmin, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const { data, error } = yield supabaseAdmin
        .from("tracker_task_lists")
        .insert({
        user_id: userId,
        name: taskHubUtils_1.DEFAULT_LIST_NAME,
        color_hex: (0, taskHubUtils_1.pickAutoListColor)([]),
        sort_order: 1,
        archived: false,
    })
        .select("*")
        .single();
    if (error)
        throw new Error(error.message);
    return data;
});
const normalizeStoredTaskTimeZones = (supabaseAdmin, userId, tasks, browserTimeZone) => __awaiter(void 0, void 0, void 0, function* () {
    const missingTimedTimeZone = tasks.filter((task) => !!task.due_at && !task.due_timezone && !(0, taskCalendarEventUtils_1.isDateOnlyIso)(task.due_at));
    const dateOnlyWithTimeZone = tasks.filter((task) => !!task.due_at && !!task.due_timezone && (0, taskCalendarEventUtils_1.isDateOnlyIso)(task.due_at));
    const updates = [];
    missingTimedTimeZone.forEach((task) => {
        updates.push((() => __awaiter(void 0, void 0, void 0, function* () {
            const { error } = yield supabaseAdmin
                .from("tracker_tasks")
                .update({ due_timezone: browserTimeZone })
                .eq("user_id", userId)
                .eq("id", task.id);
            if (error)
                throw new Error(error.message);
        }))());
    });
    dateOnlyWithTimeZone.forEach((task) => {
        updates.push((() => __awaiter(void 0, void 0, void 0, function* () {
            const { error } = yield supabaseAdmin
                .from("tracker_tasks")
                .update({ due_timezone: null })
                .eq("user_id", userId)
                .eq("id", task.id);
            if (error)
                throw new Error(error.message);
        }))());
    });
    yield Promise.all(updates);
    return updates.length > 0;
});
const getTrackerBootstrapForUser = (supabaseAdmin, userId, input) => __awaiter(void 0, void 0, void 0, function* () {
    const browserTimeZone = (0, taskHubUtils_1.normalizeBrowserTimeZone)(input === null || input === void 0 ? void 0 : input.browserTimeZone);
    let lists = yield (0, exports.fetchTaskListsForUser)(supabaseAdmin, userId);
    if (lists.length === 0) {
        lists = [yield seedDefaultTaskListForUser(supabaseAdmin, userId)];
    }
    let tasks = yield (0, exports.fetchTasksForUser)(supabaseAdmin, userId);
    const changedTimeZones = yield normalizeStoredTaskTimeZones(supabaseAdmin, userId, tasks, browserTimeZone);
    if (changedTimeZones) {
        tasks = yield (0, exports.fetchTasksForUser)(supabaseAdmin, userId);
    }
    const sortPreferences = yield (0, exports.fetchSortPreferencesForUser)(supabaseAdmin, userId);
    return {
        lists,
        tasks,
        sort_preferences: sortPreferences,
    };
});
exports.getTrackerBootstrapForUser = getTrackerBootstrapForUser;
