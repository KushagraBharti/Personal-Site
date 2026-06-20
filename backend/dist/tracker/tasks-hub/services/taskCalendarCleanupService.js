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
exports.processBestEffortTaskDeleteCleanup = exports.deleteCalendarLinksForTasks = exports.buildSyntheticDeleteJob = void 0;
const taskCalendarSyncService_1 = require("../../calendar/services/taskCalendarSyncService");
const taskHubUtils_1 = require("./taskHubUtils");
const isMissingProjectionSchemaError = (error) => {
    const message = (0, taskHubUtils_1.getRawErrorMessage)(error).toLowerCase();
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
        run_after: (0, taskHubUtils_1.nowIso)(),
        last_error: null,
        locked_at: null,
        created_at: (0, taskHubUtils_1.nowIso)(),
        updated_at: (0, taskHubUtils_1.nowIso)(),
    });
};
exports.buildSyntheticDeleteJob = buildSyntheticDeleteJob;
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
exports.deleteCalendarLinksForTasks = deleteCalendarLinksForTasks;
const processBestEffortTaskDeleteCleanup = (supabaseAdmin, input) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, taskCalendarSyncService_1.processTaskDeleteJob)(supabaseAdmin, (0, exports.buildSyntheticDeleteJob)({
            userId: input.userId,
            listId: input.listId,
            taskId: input.taskId,
            source: input.source,
        }));
    }
    catch (_a) {
        // Local deletes should not fail if Google cleanup is temporarily unavailable.
    }
});
exports.processBestEffortTaskDeleteCleanup = processBestEffortTaskDeleteCleanup;
