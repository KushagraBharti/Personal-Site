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
exports.normalizeDueAtForSync = exports.inferLanesForRunMode = exports.getSyncRunDebug = exports.getSyncProgressForRun = exports.getCalendarStatusForUser = exports.upsertListSyncSetting = exports.listUserSyncEnabledLists = exports.renewExpiringCalendarWatches = exports.disconnectGoogleCalendarForUser = exports.upsertGoogleConnectionFromOAuth = exports.queueLivePumpForUser = exports.queueManualSyncForUser = exports.queueRebuildRunForUser = exports.queueReconcileRunForUser = exports.queueFullBackfill = exports.processCalendarSyncJobs = exports.renewCalendarWatchForUser = void 0;
const crypto_1 = require("crypto");
const calendarSyncQueueService_1 = require("./calendarSyncQueueService");
const googleCalendarApiService_1 = require("./googleCalendarApiService");
const encryptionService_1 = require("./encryptionService");
const GOOGLE_WEBHOOK_URL = () => {
    const value = process.env.GOOGLE_WEBHOOK_URL;
    if (!value)
        throw new Error("GOOGLE_WEBHOOK_URL must be set");
    return value;
};
const nowIso = () => new Date().toISOString();
const LIVE_PUMP_BATCH_SIZE = 3;
const RECONCILE_APP_PAGE_SIZE = 60;
const RECONCILE_GOOGLE_PAGE_SIZE = 60;
const HARD_RESET_CLEAR_PAGE_SIZE = 15;
const INBOUND_DELTA_PAGE_SIZE = 60;
const PRIORITY_LIVE = 5;
const PRIORITY_REBUILD_CLEAR = 10;
const PRIORITY_RECONCILE_APP = 20;
const PRIORITY_RECONCILE_GOOGLE = 22;
const PRIORITY_TASK_FROM_RECONCILE = 30;
const PRIORITY_SYSTEM_INBOUND = 70;
const createRunId = (mode) => `${mode}_run_${Date.now()}_${(0, crypto_1.randomBytes)(5).toString("hex")}`;
const getJobStringPayload = (job, key) => {
    var _a;
    const raw = (_a = job.payload) === null || _a === void 0 ? void 0 : _a[key];
    return typeof raw === "string" && raw.trim() ? raw.trim() : null;
};
const getJobRunId = (job) => job.run_id || getJobStringPayload(job, "run_id");
const withRunPayload = (base, runId) => runId ? Object.assign(Object.assign({}, base), { run_id: runId }) : base;
const formatSyncErrorMessage = (error) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const err = error;
    const status = (_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.status;
    const tokenErr = (_c = (_b = err === null || err === void 0 ? void 0 : err.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.error;
    const tokenErrDescription = (_e = (_d = err === null || err === void 0 ? void 0 : err.response) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e.error_description;
    const apiErrMessage = typeof ((_h = (_g = (_f = err === null || err === void 0 ? void 0 : err.response) === null || _f === void 0 ? void 0 : _f.data) === null || _g === void 0 ? void 0 : _g.error) === null || _h === void 0 ? void 0 : _h.message) === "string"
        ? err.response.data.error.message
        : null;
    const generic = error instanceof Error ? error.message : String(error);
    if (status === 400 && tokenErr === "invalid_grant") {
        return tokenErrDescription
            ? `Google auth expired/revoked: ${tokenErrDescription}. Please reconnect Google Calendar.`
            : "Google auth expired/revoked. Please reconnect Google Calendar.";
    }
    if (status === 401 || status === 403) {
        return "Google authorization failed. Please reconnect Google Calendar.";
    }
    if (apiErrMessage)
        return apiErrMessage;
    return generic;
};
const getSyncErrorCode = (error) => {
    var _a;
    const err = error;
    const status = (_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.status;
    if (typeof status === "number")
        return String(status);
    const code = err === null || err === void 0 ? void 0 : err.code;
    return typeof code === "string" && code.trim() ? code : null;
};
const logSyncJobLifecycle = (input) => {
    var _a, _b;
    console.info("[calendar_sync_job]", JSON.stringify({
        run_id: input.runId,
        job_id: input.jobId,
        lane: input.lane,
        job_type: input.jobType,
        task_id: input.taskId,
        google_event_id: input.googleEventId,
        attempt_count: input.attemptCount,
        duration_ms: input.durationMs,
        result: input.result,
        error_code: (_a = input.errorCode) !== null && _a !== void 0 ? _a : null,
        error_message: (_b = input.errorMessage) !== null && _b !== void 0 ? _b : null,
    }));
};
const isAuthFatalSyncError = (error) => {
    var _a, _b, _c;
    const err = error;
    const status = (_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.status;
    const googleErrorCode = (_c = (_b = err === null || err === void 0 ? void 0 : err.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.error;
    const message = error instanceof Error
        ? error.message.toLowerCase()
        : typeof (err === null || err === void 0 ? void 0 : err.message) === "string"
            ? err.message.toLowerCase()
            : "";
    if (status === 401 || status === 403)
        return true;
    if (status === 400 &&
        typeof googleErrorCode === "string" &&
        ["invalid_grant", "invalid_client", "invalid_request", "unauthorized_client"].includes(googleErrorCode)) {
        return true;
    }
    return (message.includes("no google refresh token available") ||
        message.includes("google calendar connection not found") ||
        message.includes("invalid grant"));
};
const isGoogleNotFoundError = (error) => {
    var _a;
    const err = error;
    return ((_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.status) === 404;
};
const isGoogleConflictError = (error) => {
    var _a;
    const err = error;
    return ((_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.status) === 409;
};
const getScopedSyncEnabledListIds = (supabaseAdmin, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const { data, error } = yield supabaseAdmin
        .from("tracker_task_list_sync_settings")
        .select("list_id")
        .eq("user_id", userId)
        .eq("sync_enabled", true);
    if (error)
        throw new Error(error.message);
    return (data !== null && data !== void 0 ? data : []).map((row) => String(row.list_id));
});
const isListSyncEnabled = (supabaseAdmin, userId, listId) => __awaiter(void 0, void 0, void 0, function* () {
    const { data } = yield supabaseAdmin
        .from("tracker_task_list_sync_settings")
        .select("sync_enabled")
        .eq("user_id", userId)
        .eq("list_id", listId)
        .maybeSingle();
    return !!(data === null || data === void 0 ? void 0 : data.sync_enabled);
});
const getTaskById = (supabaseAdmin, userId, taskId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { data } = yield supabaseAdmin
        .from("tracker_tasks")
        .select("*")
        .eq("user_id", userId)
        .eq("id", taskId)
        .maybeSingle();
    return (_a = data) !== null && _a !== void 0 ? _a : null;
});
const getLinkByTaskId = (supabaseAdmin, userId, taskId) => __awaiter(void 0, void 0, void 0, function* () {
    const { data } = yield supabaseAdmin
        .from("tracker_task_google_event_links")
        .select("*")
        .eq("user_id", userId)
        .eq("task_id", taskId)
        .maybeSingle();
    return data;
});
const getLinkByEvent = (supabaseAdmin, userId, calendarId, googleEventId) => __awaiter(void 0, void 0, void 0, function* () {
    const { data } = yield supabaseAdmin
        .from("tracker_task_google_event_links")
        .select("*")
        .eq("user_id", userId)
        .eq("calendar_id", calendarId)
        .eq("google_event_id", googleEventId)
        .maybeSingle();
    return data;
});
const upsertLink = (supabaseAdmin, input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const { error } = yield supabaseAdmin.from("tracker_task_google_event_links").upsert({
        user_id: input.userId,
        task_id: input.taskId,
        calendar_id: input.calendarId,
        google_event_id: input.googleEventId,
        google_event_etag: (_a = input.etag) !== null && _a !== void 0 ? _a : null,
        google_event_updated_at: (_b = input.googleUpdatedAt) !== null && _b !== void 0 ? _b : null,
        last_synced_task_updated_at: (_c = input.lastSyncedTaskUpdatedAt) !== null && _c !== void 0 ? _c : null,
        last_sync_source: (_d = input.lastSyncSource) !== null && _d !== void 0 ? _d : "system",
        is_deleted: (_e = input.isDeleted) !== null && _e !== void 0 ? _e : false,
    }, { onConflict: "task_id" });
    if (error)
        throw new Error(error.message);
});
const setConnectionHealth = (supabaseAdmin, userId, values) => __awaiter(void 0, void 0, void 0, function* () {
    const { error } = yield supabaseAdmin
        .from("tracker_google_calendar_connections_public")
        .update(values)
        .eq("user_id", userId);
    if (error)
        throw new Error(error.message);
});
const shouldSyncTask = (task, listEnabled) => listEnabled && !task.is_completed && !!task.due_at;
const createSyncRun = (supabaseAdmin, userId, mode) => __awaiter(void 0, void 0, void 0, function* () {
    const runId = createRunId(mode);
    const { error } = yield supabaseAdmin.from("tracker_google_sync_runs").insert({
        id: runId,
        user_id: userId,
        mode,
        status: "queued",
        started_at: nowIso(),
        queued_jobs: 0,
        processed_jobs: 0,
        failed_jobs: 0,
    });
    if (error)
        throw new Error(error.message);
    return runId;
});
const getSyncRunById = (supabaseAdmin, userId, runId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { data, error } = yield supabaseAdmin
        .from("tracker_google_sync_runs")
        .select("*")
        .eq("id", runId)
        .eq("user_id", userId)
        .maybeSingle();
    if (error)
        throw new Error(error.message);
    return (_a = data) !== null && _a !== void 0 ? _a : null;
});
const countRunJobs = (supabaseAdmin, runId, statuses) => __awaiter(void 0, void 0, void 0, function* () {
    let query = supabaseAdmin
        .from("tracker_google_sync_jobs")
        .select("id", { count: "exact", head: true })
        .eq("run_id", runId);
    if (statuses && statuses.length > 0)
        query = query.in("status", statuses);
    const { count, error } = yield query;
    if (error)
        throw new Error(error.message);
    return count !== null && count !== void 0 ? count : 0;
});
const refreshSyncRunState = (supabaseAdmin, runId) => __awaiter(void 0, void 0, void 0, function* () {
    const [total, pending, running, doneCount, failedCount] = yield Promise.all([
        countRunJobs(supabaseAdmin, runId),
        countRunJobs(supabaseAdmin, runId, ["pending"]),
        countRunJobs(supabaseAdmin, runId, ["running"]),
        countRunJobs(supabaseAdmin, runId, ["done"]),
        countRunJobs(supabaseAdmin, runId, ["failed", "dead"]),
    ]);
    const finished = total > 0 && pending === 0 && running === 0;
    const status = finished ? (failedCount > 0 ? "failed" : "done") : "running";
    const { error } = yield supabaseAdmin
        .from("tracker_google_sync_runs")
        .update({
        queued_jobs: total,
        processed_jobs: doneCount + failedCount,
        failed_jobs: failedCount,
        status,
        finished_at: finished ? nowIso() : null,
        updated_at: nowIso(),
    })
        .eq("id", runId);
    if (error)
        throw new Error(error.message);
});
const enqueueTaskUpsert = (input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    yield (0, calendarSyncQueueService_1.enqueueSyncJob)(input.supabaseAdmin, {
        userId: input.userId,
        runId: (_a = input.runId) !== null && _a !== void 0 ? _a : null,
        lane: input.lane,
        taskId: input.taskId,
        listId: input.listId,
        jobType: "task_upsert",
        source: input.source,
        priority: input.priority,
        payload: withRunPayload({ source: input.source }, (_b = input.runId) !== null && _b !== void 0 ? _b : null),
        dedupeKey: input.dedupeKey,
    });
});
const enqueueTaskDelete = (input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    yield (0, calendarSyncQueueService_1.enqueueSyncJob)(input.supabaseAdmin, {
        userId: input.userId,
        runId: (_a = input.runId) !== null && _a !== void 0 ? _a : null,
        lane: input.lane,
        taskId: (_b = input.taskId) !== null && _b !== void 0 ? _b : null,
        listId: (_c = input.listId) !== null && _c !== void 0 ? _c : null,
        googleEventId: input.googleEventId,
        jobType: "task_delete",
        source: input.source,
        priority: input.priority,
        payload: withRunPayload({
            source: input.source,
            google_event_id: input.googleEventId,
            calendar_id: (_d = input.calendarId) !== null && _d !== void 0 ? _d : null,
        }, (_e = input.runId) !== null && _e !== void 0 ? _e : null),
        dedupeKey: input.dedupeKey,
    });
});
const processTaskUpsertJob = (supabaseAdmin, job) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    if (!job.task_id)
        return;
    const task = yield getTaskById(supabaseAdmin, job.user_id, job.task_id);
    if (!task)
        return;
    const listEnabled = yield isListSyncEnabled(supabaseAdmin, job.user_id, task.list_id);
    const { accessToken, publicRow } = yield (0, googleCalendarApiService_1.getValidGoogleAccessToken)(supabaseAdmin, job.user_id);
    const calendarId = publicRow.selected_calendar_id;
    if (!calendarId)
        return;
    const existingLink = yield getLinkByTaskId(supabaseAdmin, job.user_id, task.id);
    if (!shouldSyncTask(task, listEnabled)) {
        if (existingLink && !existingLink.is_deleted) {
            try {
                yield (0, googleCalendarApiService_1.deleteGoogleEvent)(accessToken, existingLink.calendar_id, existingLink.google_event_id);
            }
            catch (_g) {
                // best effort
            }
            yield upsertLink(supabaseAdmin, {
                userId: job.user_id,
                taskId: task.id,
                calendarId: existingLink.calendar_id,
                googleEventId: existingLink.google_event_id,
                etag: existingLink.google_event_etag,
                googleUpdatedAt: existingLink.google_event_updated_at,
                lastSyncedTaskUpdatedAt: task.updated_at,
                lastSyncSource: "app",
                isDeleted: true,
            });
        }
        return;
    }
    const eventPayload = (0, googleCalendarApiService_1.taskToGoogleEventPayload)(task);
    if (!eventPayload.start)
        return;
    if (existingLink && !existingLink.is_deleted) {
        try {
            const patched = yield (0, googleCalendarApiService_1.patchGoogleEvent)(accessToken, existingLink.calendar_id, existingLink.google_event_id, eventPayload);
            yield upsertLink(supabaseAdmin, {
                userId: job.user_id,
                taskId: task.id,
                calendarId: existingLink.calendar_id,
                googleEventId: existingLink.google_event_id,
                etag: (_a = patched.etag) !== null && _a !== void 0 ? _a : null,
                googleUpdatedAt: (_b = patched.updated) !== null && _b !== void 0 ? _b : nowIso(),
                lastSyncedTaskUpdatedAt: task.updated_at,
                lastSyncSource: "app",
                isDeleted: false,
            });
            return;
        }
        catch (error) {
            if (!isGoogleNotFoundError(error))
                throw error;
        }
    }
    const deterministicEventId = (0, googleCalendarApiService_1.taskIdToDeterministicGoogleEventId)(task.id);
    try {
        const inserted = yield (0, googleCalendarApiService_1.insertGoogleEvent)(accessToken, calendarId, Object.assign(Object.assign({}, eventPayload), { id: deterministicEventId }));
        yield upsertLink(supabaseAdmin, {
            userId: job.user_id,
            taskId: task.id,
            calendarId,
            googleEventId: inserted.id,
            etag: (_c = inserted.etag) !== null && _c !== void 0 ? _c : null,
            googleUpdatedAt: (_d = inserted.updated) !== null && _d !== void 0 ? _d : nowIso(),
            lastSyncedTaskUpdatedAt: task.updated_at,
            lastSyncSource: "app",
            isDeleted: false,
        });
        return;
    }
    catch (error) {
        if (!isGoogleConflictError(error))
            throw error;
    }
    const patched = yield (0, googleCalendarApiService_1.patchGoogleEvent)(accessToken, calendarId, deterministicEventId, eventPayload);
    yield upsertLink(supabaseAdmin, {
        userId: job.user_id,
        taskId: task.id,
        calendarId,
        googleEventId: deterministicEventId,
        etag: (_e = patched.etag) !== null && _e !== void 0 ? _e : null,
        googleUpdatedAt: (_f = patched.updated) !== null && _f !== void 0 ? _f : nowIso(),
        lastSyncedTaskUpdatedAt: task.updated_at,
        lastSyncSource: "app",
        isDeleted: false,
    });
});
const processTaskDeleteJob = (supabaseAdmin, job) => __awaiter(void 0, void 0, void 0, function* () {
    const payloadEventId = getJobStringPayload(job, "google_event_id");
    const payloadCalendarId = getJobStringPayload(job, "calendar_id");
    let googleEventId = job.google_event_id || payloadEventId || null;
    let calendarId = payloadCalendarId || null;
    let link = null;
    if (job.task_id) {
        link = yield getLinkByTaskId(supabaseAdmin, job.user_id, job.task_id);
        if (!googleEventId && (link === null || link === void 0 ? void 0 : link.google_event_id))
            googleEventId = String(link.google_event_id);
        if (!calendarId && (link === null || link === void 0 ? void 0 : link.calendar_id))
            calendarId = String(link.calendar_id);
    }
    if (!googleEventId)
        return;
    const { accessToken, publicRow } = yield (0, googleCalendarApiService_1.getValidGoogleAccessToken)(supabaseAdmin, job.user_id);
    if (!calendarId)
        calendarId = publicRow.selected_calendar_id;
    if (!calendarId)
        return;
    try {
        yield (0, googleCalendarApiService_1.deleteGoogleEvent)(accessToken, calendarId, googleEventId);
    }
    catch (error) {
        if (!isGoogleNotFoundError(error))
            throw error;
    }
    if (!link && job.task_id) {
        link = yield getLinkByTaskId(supabaseAdmin, job.user_id, job.task_id);
    }
    if (!link) {
        link = yield getLinkByEvent(supabaseAdmin, job.user_id, calendarId, googleEventId);
    }
    if (link === null || link === void 0 ? void 0 : link.id) {
        const { error } = yield supabaseAdmin
            .from("tracker_task_google_event_links")
            .update({
            is_deleted: true,
            last_sync_source: "app",
            last_synced_task_updated_at: nowIso(),
        })
            .eq("id", link.id);
        if (error)
            throw new Error(error.message);
    }
});
const processReconcileAppPageJob = (supabaseAdmin, job) => __awaiter(void 0, void 0, void 0, function* () {
    const runId = getJobRunId(job);
    const cursorAfter = getJobStringPayload(job, "cursor_after");
    const listIdFromPayload = getJobStringPayload(job, "list_id");
    const listId = job.list_id || listIdFromPayload || null;
    const enabledListIds = yield getScopedSyncEnabledListIds(supabaseAdmin, job.user_id);
    if (enabledListIds.length === 0)
        return;
    let query = supabaseAdmin
        .from("tracker_tasks")
        .select("id,list_id,updated_at,due_at,is_completed")
        .eq("user_id", job.user_id)
        .in("list_id", enabledListIds)
        .eq("is_completed", false)
        .not("due_at", "is", null)
        .order("id", { ascending: true })
        .limit(RECONCILE_APP_PAGE_SIZE);
    if (listId)
        query = query.eq("list_id", listId);
    if (cursorAfter)
        query = query.gt("id", cursorAfter);
    const { data: rows, error } = yield query;
    if (error)
        throw new Error(error.message);
    const page = rows !== null && rows !== void 0 ? rows : [];
    for (const row of page) {
        yield enqueueTaskUpsert({
            supabaseAdmin,
            userId: job.user_id,
            taskId: String(row.id),
            listId: String(row.list_id),
            lane: job.lane,
            runId,
            priority: PRIORITY_TASK_FROM_RECONCILE,
            source: "reconcile_app_page",
            dedupeKey: `reconcile:upsert:${row.id}:${row.updated_at || "na"}`,
        });
    }
    if (page.length === RECONCILE_APP_PAGE_SIZE) {
        const lastTaskId = String(page[page.length - 1].id);
        yield (0, calendarSyncQueueService_1.enqueueSyncJob)(supabaseAdmin, {
            userId: job.user_id,
            runId,
            lane: job.lane,
            listId,
            jobType: "reconcile_app_page",
            source: "reconcile_app_page_cont",
            priority: PRIORITY_RECONCILE_APP,
            payload: withRunPayload({
                source: "reconcile_app_page_cont",
                cursor_after: lastTaskId,
                list_id: listId,
            }, runId),
            dedupeKey: `reconcile:app-page:${runId || "system"}:${listId || "all"}:${lastTaskId}`,
        });
    }
});
const processReconcileGooglePageJob = (supabaseAdmin, job) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const runId = getJobRunId(job);
    const pageToken = getJobStringPayload(job, "page_token");
    const { accessToken, publicRow } = yield (0, googleCalendarApiService_1.getValidGoogleAccessToken)(supabaseAdmin, job.user_id);
    const calendarId = publicRow.selected_calendar_id;
    if (!calendarId)
        return;
    const page = yield (0, googleCalendarApiService_1.listGoogleEventsPage)({
        accessToken,
        calendarId,
        pageToken,
        maxResults: RECONCILE_GOOGLE_PAGE_SIZE,
    });
    const events = ((_a = page.items) !== null && _a !== void 0 ? _a : []).filter((event) => !!(event === null || event === void 0 ? void 0 : event.id));
    const referencedTaskIds = Array.from(new Set(events
        .map((event) => { var _a, _b; return (_b = (_a = event === null || event === void 0 ? void 0 : event.extendedProperties) === null || _a === void 0 ? void 0 : _a.private) === null || _b === void 0 ? void 0 : _b.tracker_task_id; })
        .filter((id) => typeof id === "string" && id.trim())));
    const enabledListIds = new Set(yield getScopedSyncEnabledListIds(supabaseAdmin, job.user_id));
    const scopedTasksById = new Map();
    if (referencedTaskIds.length > 0) {
        const { data: tasks, error } = yield supabaseAdmin
            .from("tracker_tasks")
            .select("*")
            .eq("user_id", job.user_id)
            .in("id", referencedTaskIds);
        if (error)
            throw new Error(error.message);
        for (const task of tasks !== null && tasks !== void 0 ? tasks : []) {
            const typed = task;
            if (!enabledListIds.has(typed.list_id))
                continue;
            if (typed.is_completed || !typed.due_at)
                continue;
            scopedTasksById.set(typed.id, typed);
        }
    }
    for (const event of events) {
        const googleEventId = String(event.id);
        const taskIdRaw = (_c = (_b = event === null || event === void 0 ? void 0 : event.extendedProperties) === null || _b === void 0 ? void 0 : _b.private) === null || _c === void 0 ? void 0 : _c.tracker_task_id;
        const trackerTaskId = typeof taskIdRaw === "string" && taskIdRaw.trim() ? taskIdRaw.trim() : null;
        if (!trackerTaskId) {
            yield enqueueTaskDelete({
                supabaseAdmin,
                userId: job.user_id,
                lane: job.lane,
                runId,
                googleEventId,
                calendarId,
                source: "reconcile_orphan_google_event",
                dedupeKey: `reconcile:delete-orphan:${googleEventId}`,
                priority: PRIORITY_TASK_FROM_RECONCILE,
            });
            continue;
        }
        const scopedTask = scopedTasksById.get(trackerTaskId);
        if (!scopedTask) {
            yield enqueueTaskDelete({
                supabaseAdmin,
                userId: job.user_id,
                lane: job.lane,
                runId,
                taskId: trackerTaskId,
                googleEventId,
                calendarId,
                source: "reconcile_out_of_scope_task",
                dedupeKey: `reconcile:delete-out:${trackerTaskId}:${googleEventId}`,
                priority: PRIORITY_TASK_FROM_RECONCILE,
            });
            continue;
        }
        yield upsertLink(supabaseAdmin, {
            userId: job.user_id,
            taskId: scopedTask.id,
            calendarId,
            googleEventId,
            etag: (_d = event.etag) !== null && _d !== void 0 ? _d : null,
            googleUpdatedAt: (_e = event.updated) !== null && _e !== void 0 ? _e : null,
            lastSyncedTaskUpdatedAt: scopedTask.updated_at,
            lastSyncSource: "system",
            isDeleted: false,
        });
        yield enqueueTaskUpsert({
            supabaseAdmin,
            userId: job.user_id,
            taskId: scopedTask.id,
            listId: scopedTask.list_id,
            lane: job.lane,
            runId,
            priority: PRIORITY_TASK_FROM_RECONCILE,
            source: "reconcile_google_page",
            dedupeKey: `reconcile:confirm:${scopedTask.id}:${scopedTask.updated_at}`,
        });
    }
    if (page.nextPageToken) {
        yield (0, calendarSyncQueueService_1.enqueueSyncJob)(supabaseAdmin, {
            userId: job.user_id,
            runId,
            lane: job.lane,
            jobType: "reconcile_google_page",
            source: "reconcile_google_page_cont",
            priority: PRIORITY_RECONCILE_GOOGLE,
            payload: withRunPayload({
                source: "reconcile_google_page_cont",
                page_token: page.nextPageToken,
            }, runId),
            dedupeKey: `reconcile:google-page:${runId || "system"}:${page.nextPageToken}`,
        });
    }
});
const processHardResetClearPageJob = (supabaseAdmin, job) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const runId = getJobRunId(job);
    if (!runId)
        throw new Error("Hard reset clear job missing run_id");
    const { accessToken, publicRow } = yield (0, googleCalendarApiService_1.getValidGoogleAccessToken)(supabaseAdmin, job.user_id);
    const calendarId = publicRow.selected_calendar_id;
    if (!calendarId)
        return;
    const page = yield (0, googleCalendarApiService_1.listGoogleEventsPage)({
        accessToken,
        calendarId,
        maxResults: HARD_RESET_CLEAR_PAGE_SIZE,
    });
    const events = ((_a = page.items) !== null && _a !== void 0 ? _a : []).filter((event) => !!(event === null || event === void 0 ? void 0 : event.id));
    if (events.length === 0) {
        yield (0, calendarSyncQueueService_1.enqueueSyncJob)(supabaseAdmin, {
            userId: job.user_id,
            runId,
            lane: "rebuild",
            jobType: "reconcile_app_page",
            source: "rebuild_seed_reconcile",
            priority: PRIORITY_RECONCILE_APP,
            payload: withRunPayload({ source: "rebuild_seed_reconcile" }, runId),
            dedupeKey: `rebuild:seed-reconcile:${runId}`,
        });
        return;
    }
    const eventIds = [];
    for (const event of events) {
        const eventId = String(event.id);
        eventIds.push(eventId);
        try {
            yield (0, googleCalendarApiService_1.deleteGoogleEvent)(accessToken, calendarId, eventId);
        }
        catch (error) {
            if (!isGoogleNotFoundError(error))
                throw error;
        }
    }
    if (eventIds.length > 0) {
        yield supabaseAdmin
            .from("tracker_task_google_event_links")
            .update({ is_deleted: true, last_sync_source: "system" })
            .eq("user_id", job.user_id)
            .eq("calendar_id", calendarId)
            .in("google_event_id", eventIds);
    }
    yield (0, calendarSyncQueueService_1.enqueueSyncJob)(supabaseAdmin, {
        userId: job.user_id,
        runId,
        lane: "rebuild",
        jobType: "hard_reset_clear_page",
        source: "rebuild_clear_cont",
        priority: PRIORITY_REBUILD_CLEAR,
        payload: withRunPayload({ source: "rebuild_clear_cont" }, runId),
        dedupeKey: `rebuild:clear:${runId}:${(0, crypto_1.randomBytes)(4).toString("hex")}`,
    });
});
const processInboundDeltaJob = (supabaseAdmin, job) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const { accessToken, publicRow, secretsRow } = yield (0, googleCalendarApiService_1.getValidGoogleAccessToken)(supabaseAdmin, job.user_id);
    const calendarId = publicRow.selected_calendar_id;
    if (!calendarId)
        return;
    const pageToken = getJobStringPayload(job, "page_token");
    const syncTokenFromPayload = getJobStringPayload(job, "sync_token");
    const syncToken = syncTokenFromPayload || secretsRow.sync_token || null;
    let delta;
    try {
        delta = yield (0, googleCalendarApiService_1.listGoogleEventsDelta)({
            accessToken,
            calendarId,
            syncToken,
            pageToken,
            maxResults: INBOUND_DELTA_PAGE_SIZE,
            timeMin: syncToken ? undefined : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        });
    }
    catch (err) {
        const status = (_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.status;
        if (status === 410 && syncToken) {
            const { error } = yield supabaseAdmin
                .from("tracker_google_calendar_connections_secrets")
                .update({ sync_token: null })
                .eq("id", secretsRow.id);
            if (error)
                throw new Error(error.message);
            return;
        }
        throw err;
    }
    const enabledListIds = new Set(yield getScopedSyncEnabledListIds(supabaseAdmin, job.user_id));
    for (const event of (_b = delta.items) !== null && _b !== void 0 ? _b : []) {
        if (!(event === null || event === void 0 ? void 0 : event.id) || event.status !== "cancelled")
            continue;
        const taskIdRaw = (_d = (_c = event === null || event === void 0 ? void 0 : event.extendedProperties) === null || _c === void 0 ? void 0 : _c.private) === null || _d === void 0 ? void 0 : _d.tracker_task_id;
        const taskId = typeof taskIdRaw === "string" && taskIdRaw.trim() ? taskIdRaw.trim() : null;
        if (!taskId)
            continue;
        const task = yield getTaskById(supabaseAdmin, job.user_id, taskId);
        if (!task)
            continue;
        if (!enabledListIds.has(task.list_id))
            continue;
        if (task.is_completed || !task.due_at)
            continue;
        yield enqueueTaskUpsert({
            supabaseAdmin,
            userId: job.user_id,
            taskId: task.id,
            listId: task.list_id,
            lane: "system",
            priority: PRIORITY_SYSTEM_INBOUND,
            source: "inbound_cancelled_restore",
            dedupeKey: `inbound:restore:${task.id}:${task.updated_at}`,
        });
    }
    if (delta.nextPageToken) {
        yield (0, calendarSyncQueueService_1.enqueueSyncJob)(supabaseAdmin, {
            userId: job.user_id,
            lane: "system",
            jobType: "inbound_delta",
            source: "inbound_delta_continuation",
            priority: PRIORITY_SYSTEM_INBOUND,
            payload: {
                source: "inbound_delta_continuation",
                page_token: delta.nextPageToken,
                sync_token: syncToken,
            },
            dedupeKey: `inbound:page:${job.user_id}:${delta.nextPageToken}`,
        });
        return;
    }
    const { error: secretErr } = yield supabaseAdmin
        .from("tracker_google_calendar_connections_secrets")
        .update({
        sync_token: (_e = delta.nextSyncToken) !== null && _e !== void 0 ? _e : syncToken,
    })
        .eq("id", secretsRow.id);
    if (secretErr)
        throw new Error(secretErr.message);
    yield setConnectionHealth(supabaseAdmin, job.user_id, {
        last_incremental_sync_at: nowIso(),
        status: "connected",
        last_error: null,
    });
});
const renewWatchForUser = (supabaseAdmin, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const { accessToken, publicRow, secretsRow } = yield (0, googleCalendarApiService_1.getValidGoogleAccessToken)(supabaseAdmin, userId);
    const calendarId = publicRow.selected_calendar_id;
    if (!calendarId)
        return;
    if (secretsRow.channel_id && secretsRow.channel_resource_id) {
        try {
            yield (0, googleCalendarApiService_1.stopGoogleCalendarWatch)(accessToken, secretsRow.channel_id, secretsRow.channel_resource_id);
        }
        catch (_a) {
            // best effort
        }
    }
    const rawChannelToken = (0, crypto_1.randomBytes)(32).toString("hex");
    const watch = yield (0, googleCalendarApiService_1.upsertGoogleCalendarWatch)({
        accessToken,
        calendarId,
        webhookUrl: GOOGLE_WEBHOOK_URL(),
        rawChannelToken,
    });
    const { error } = yield supabaseAdmin
        .from("tracker_google_calendar_connections_secrets")
        .update({
        channel_id: watch.channelId,
        channel_resource_id: watch.resourceId,
        channel_token_hash: (0, googleCalendarApiService_1.hashChannelToken)(rawChannelToken),
        channel_expiration: watch.expiration,
    })
        .eq("id", secretsRow.id);
    if (error)
        throw new Error(error.message);
});
const renewCalendarWatchForUser = (supabaseAdmin, userId) => __awaiter(void 0, void 0, void 0, function* () {
    yield renewWatchForUser(supabaseAdmin, userId);
});
exports.renewCalendarWatchForUser = renewCalendarWatchForUser;
const processRenewWatchJob = (supabaseAdmin, job) => __awaiter(void 0, void 0, void 0, function* () {
    yield renewWatchForUser(supabaseAdmin, job.user_id);
});
const processOneJob = (supabaseAdmin, job) => __awaiter(void 0, void 0, void 0, function* () {
    if (job.job_type === "task_upsert")
        return processTaskUpsertJob(supabaseAdmin, job);
    if (job.job_type === "task_delete")
        return processTaskDeleteJob(supabaseAdmin, job);
    if (job.job_type === "reconcile_app_page")
        return processReconcileAppPageJob(supabaseAdmin, job);
    if (job.job_type === "reconcile_google_page")
        return processReconcileGooglePageJob(supabaseAdmin, job);
    if (job.job_type === "hard_reset_clear_page")
        return processHardResetClearPageJob(supabaseAdmin, job);
    // Legacy compatibility while old jobs drain.
    if (job.job_type === "full_backfill")
        return processReconcileAppPageJob(supabaseAdmin, job);
    if (job.job_type === "inbound_delta")
        return processInboundDeltaJob(supabaseAdmin, job);
    if (job.job_type === "renew_watch")
        return processRenewWatchJob(supabaseAdmin, job);
});
const processCalendarSyncJobs = (input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const supabaseAdmin = (0, calendarSyncQueueService_1.getSupabaseAdmin)();
    const jobs = yield (0, calendarSyncQueueService_1.claimSyncJobs)(supabaseAdmin, (_a = input === null || input === void 0 ? void 0 : input.batchSize) !== null && _a !== void 0 ? _a : 25, input === null || input === void 0 ? void 0 : input.userId, input === null || input === void 0 ? void 0 : input.lanes);
    const touchedRunIds = new Set();
    const results = [];
    for (const job of jobs) {
        const runId = getJobRunId(job);
        const startedAt = Date.now();
        try {
            yield processOneJob(supabaseAdmin, job);
            yield (0, calendarSyncQueueService_1.completeSyncJob)(supabaseAdmin, job.id);
            yield setConnectionHealth(supabaseAdmin, job.user_id, {
                status: "connected",
                last_error: null,
            }).catch(() => { });
            if (runId)
                touchedRunIds.add(runId);
            logSyncJobLifecycle({
                runId,
                jobId: job.id,
                lane: job.lane,
                jobType: job.job_type,
                taskId: job.task_id,
                googleEventId: job.google_event_id,
                attemptCount: job.attempt_count + 1,
                durationMs: Math.max(0, Date.now() - startedAt),
                result: "ok",
            });
            results.push({ id: job.id, ok: true, lane: job.lane });
        }
        catch (error) {
            const message = formatSyncErrorMessage(error);
            const errorCode = getSyncErrorCode(error);
            const retryDelay = (0, calendarSyncQueueService_1.computeRetryDelayInterval)(job.attempt_count + 1);
            const authFatal = isAuthFatalSyncError(error);
            try {
                yield (0, calendarSyncQueueService_1.failSyncJob)(supabaseAdmin, job.id, message, retryDelay);
            }
            catch (_b) {
                // suppress
            }
            yield setConnectionHealth(supabaseAdmin, job.user_id, authFatal ? { status: "error", last_error: message } : { last_error: message }).catch(() => { });
            if (runId) {
                touchedRunIds.add(runId);
                try {
                    yield supabaseAdmin
                        .from("tracker_google_sync_runs")
                        .update({ last_error: message, updated_at: nowIso() })
                        .eq("id", runId);
                }
                catch (_c) {
                    // suppress secondary run-status update failures
                }
            }
            logSyncJobLifecycle({
                runId,
                jobId: job.id,
                lane: job.lane,
                jobType: job.job_type,
                taskId: job.task_id,
                googleEventId: job.google_event_id,
                attemptCount: job.attempt_count + 1,
                durationMs: Math.max(0, Date.now() - startedAt),
                result: "failed",
                errorCode,
                errorMessage: message,
            });
            results.push({ id: job.id, ok: false, error: message, lane: job.lane });
        }
    }
    for (const runId of touchedRunIds) {
        yield refreshSyncRunState(supabaseAdmin, runId).catch(() => { });
    }
    return results;
});
exports.processCalendarSyncJobs = processCalendarSyncJobs;
const queueFullBackfill = (supabaseAdmin, userId, listId, options) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const runId = ((_a = options === null || options === void 0 ? void 0 : options.runId) === null || _a === void 0 ? void 0 : _a.trim()) || null;
    const source = (options === null || options === void 0 ? void 0 : options.source) || "manual_or_connect";
    yield (0, calendarSyncQueueService_1.enqueueSyncJob)(supabaseAdmin, {
        userId,
        runId,
        lane: runId ? "reconcile" : "system",
        listId: listId !== null && listId !== void 0 ? listId : null,
        jobType: "reconcile_app_page",
        source,
        priority: PRIORITY_RECONCILE_APP,
        payload: withRunPayload({ source, list_id: listId !== null && listId !== void 0 ? listId : null }, runId),
        dedupeKey: runId
            ? `reconcile:app-seed:${runId}:${listId || "all"}`
            : `system:app-seed:${userId}:${listId || "all"}`,
    });
});
exports.queueFullBackfill = queueFullBackfill;
const queueReconcileRunForUser = (supabaseAdmin, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const runId = yield createSyncRun(supabaseAdmin, userId, "reconcile");
    yield (0, calendarSyncQueueService_1.enqueueSyncJob)(supabaseAdmin, {
        userId,
        runId,
        lane: "reconcile",
        jobType: "reconcile_app_page",
        source: "manual_sync_now",
        priority: PRIORITY_RECONCILE_APP,
        payload: withRunPayload({ source: "manual_sync_now" }, runId),
        dedupeKey: `reconcile:app-seed:${runId}`,
    });
    yield (0, calendarSyncQueueService_1.enqueueSyncJob)(supabaseAdmin, {
        userId,
        runId,
        lane: "reconcile",
        jobType: "reconcile_google_page",
        source: "manual_sync_now",
        priority: PRIORITY_RECONCILE_GOOGLE,
        payload: withRunPayload({ source: "manual_sync_now" }, runId),
        dedupeKey: `reconcile:google-seed:${runId}`,
    });
    yield refreshSyncRunState(supabaseAdmin, runId).catch(() => { });
    return runId;
});
exports.queueReconcileRunForUser = queueReconcileRunForUser;
const queueRebuildRunForUser = (supabaseAdmin, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const runId = yield createSyncRun(supabaseAdmin, userId, "rebuild");
    yield (0, calendarSyncQueueService_1.enqueueSyncJob)(supabaseAdmin, {
        userId,
        runId,
        lane: "rebuild",
        jobType: "hard_reset_clear_page",
        source: "manual_rebuild",
        priority: PRIORITY_REBUILD_CLEAR,
        payload: withRunPayload({ source: "manual_rebuild" }, runId),
        dedupeKey: `rebuild:clear-seed:${runId}`,
    });
    yield refreshSyncRunState(supabaseAdmin, runId).catch(() => { });
    return runId;
});
exports.queueRebuildRunForUser = queueRebuildRunForUser;
const queueManualSyncForUser = (supabaseAdmin, userId) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, exports.queueReconcileRunForUser)(supabaseAdmin, userId);
});
exports.queueManualSyncForUser = queueManualSyncForUser;
const queueLivePumpForUser = (supabaseAdmin, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const results = yield (0, exports.processCalendarSyncJobs)({
        userId,
        batchSize: LIVE_PUMP_BATCH_SIZE,
        lanes: ["live"],
    });
    return {
        processed: results.length,
        failed: results.filter((item) => !item.ok).length,
        failures: results
            .filter((item) => !item.ok)
            .slice(0, 5)
            .map((item) => ({ id: item.id, error: item.error || "Unknown sync error" })),
    };
});
exports.queueLivePumpForUser = queueLivePumpForUser;
const upsertGoogleConnectionFromOAuth = (params) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { supabaseAdmin, userId } = params;
    const existing = yield (0, googleCalendarApiService_1.loadCalendarConnection)(supabaseAdmin, userId);
    const tasksCalendar = yield (0, googleCalendarApiService_1.ensureTasksCalendar)({
        accessToken: params.accessToken,
        preferredCalendarId: ((_a = existing.publicRow) === null || _a === void 0 ? void 0 : _a.selected_calendar_id) || null,
    });
    const googleEmail = yield (0, googleCalendarApiService_1.fetchGoogleUserEmail)(params.accessToken);
    const existingRefreshEncrypted = ((_b = existing.secretsRow) === null || _b === void 0 ? void 0 : _b.refresh_token_encrypted) || null;
    const refreshTokenEncrypted = params.refreshToken
        ? (0, encryptionService_1.encryptToBase64)(params.refreshToken)
        : existingRefreshEncrypted;
    if (!refreshTokenEncrypted) {
        throw new Error("No Google refresh token available. Reconnect with consent.");
    }
    const expiresAtIso = new Date(Date.now() + params.expiresInSeconds * 1000).toISOString();
    const { data: connectionPublic, error: publicErr } = yield supabaseAdmin
        .from("tracker_google_calendar_connections_public")
        .upsert({
        user_id: userId,
        status: "connected",
        google_email: googleEmail,
        selected_calendar_id: tasksCalendar.id,
        selected_calendar_summary: tasksCalendar.summary,
        last_error: null,
    }, { onConflict: "user_id" })
        .select("*")
        .single();
    if (publicErr || !connectionPublic) {
        throw new Error((publicErr === null || publicErr === void 0 ? void 0 : publicErr.message) || "Failed to persist Google connection");
    }
    const { data: secrets, error: secErr } = yield supabaseAdmin
        .from("tracker_google_calendar_connections_secrets")
        .upsert({
        user_id: userId,
        connection_public_id: connectionPublic.id,
        refresh_token_encrypted: refreshTokenEncrypted,
        access_token_encrypted: (0, encryptionService_1.encryptToBase64)(params.accessToken),
        access_token_expires_at: expiresAtIso,
    }, { onConflict: "user_id" })
        .select("*")
        .single();
    if (secErr || !secrets) {
        throw new Error((secErr === null || secErr === void 0 ? void 0 : secErr.message) || "Failed to persist Google connection secrets");
    }
    yield renewWatchForUser(supabaseAdmin, userId);
    yield (0, exports.queueFullBackfill)(supabaseAdmin, userId, undefined, { source: "oauth_connect_seed" });
    return {
        connectionPublic: connectionPublic,
        calendar: tasksCalendar,
    };
});
exports.upsertGoogleConnectionFromOAuth = upsertGoogleConnectionFromOAuth;
const disconnectGoogleCalendarForUser = (supabaseAdmin, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const { publicRow, secretsRow } = yield (0, googleCalendarApiService_1.loadCalendarConnection)(supabaseAdmin, userId);
    if (!publicRow || !secretsRow)
        return;
    try {
        if (secretsRow.channel_id && secretsRow.channel_resource_id) {
            const { accessToken } = yield (0, googleCalendarApiService_1.getValidGoogleAccessToken)(supabaseAdmin, userId);
            yield (0, googleCalendarApiService_1.stopGoogleCalendarWatch)(accessToken, secretsRow.channel_id, secretsRow.channel_resource_id);
        }
    }
    catch (_a) {
        // best effort
    }
    yield supabaseAdmin
        .from("tracker_google_calendar_connections_public")
        .update({
        status: "disconnected",
        selected_calendar_id: null,
        selected_calendar_summary: null,
        last_error: null,
    })
        .eq("user_id", userId);
    yield supabaseAdmin
        .from("tracker_google_calendar_connections_secrets")
        .delete()
        .eq("user_id", userId);
    yield supabaseAdmin.from("tracker_task_google_event_links").delete().eq("user_id", userId);
});
exports.disconnectGoogleCalendarForUser = disconnectGoogleCalendarForUser;
const renewExpiringCalendarWatches = (input) => __awaiter(void 0, void 0, void 0, function* () {
    const supabaseAdmin = (0, calendarSyncQueueService_1.getSupabaseAdmin)();
    let query = supabaseAdmin
        .from("tracker_google_calendar_connections_secrets")
        .select("user_id, channel_expiration");
    if (input === null || input === void 0 ? void 0 : input.userId)
        query = query.eq("user_id", input.userId);
    const { data, error } = yield query;
    if (error)
        throw new Error(error.message);
    const horizon = Date.now() + 24 * 60 * 60 * 1000;
    const usersToRenew = (data !== null && data !== void 0 ? data : [])
        .filter((row) => !row.channel_expiration || new Date(row.channel_expiration).getTime() < horizon)
        .map((row) => row.user_id);
    const results = [];
    for (const userId of usersToRenew) {
        try {
            yield renewWatchForUser(supabaseAdmin, userId);
            yield setConnectionHealth(supabaseAdmin, userId, {
                status: "connected",
                last_error: null,
            }).catch(() => { });
            results.push({ userId, ok: true });
        }
        catch (err) {
            const message = formatSyncErrorMessage(err);
            const authFatal = isAuthFatalSyncError(err);
            yield setConnectionHealth(supabaseAdmin, userId, authFatal ? { status: "error", last_error: message } : { last_error: message }).catch(() => { });
            results.push({ userId, ok: false, error: message });
        }
    }
    return results;
});
exports.renewExpiringCalendarWatches = renewExpiringCalendarWatches;
const listUserSyncEnabledLists = (supabaseAdmin, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const { data, error } = yield supabaseAdmin
        .from("tracker_task_list_sync_settings")
        .select("list_id, sync_enabled")
        .eq("user_id", userId);
    if (error)
        throw new Error(error.message);
    return (data !== null && data !== void 0 ? data : []);
});
exports.listUserSyncEnabledLists = listUserSyncEnabledLists;
const upsertListSyncSetting = (supabaseAdmin, userId, listId, syncEnabled) => __awaiter(void 0, void 0, void 0, function* () {
    const { error } = yield supabaseAdmin
        .from("tracker_task_list_sync_settings")
        .upsert({
        user_id: userId,
        list_id: listId,
        sync_enabled: syncEnabled,
    }, { onConflict: "user_id,list_id" });
    if (error)
        throw new Error(error.message);
});
exports.upsertListSyncSetting = upsertListSyncSetting;
const getCalendarStatusForUser = (supabaseAdmin, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const { publicRow, secretsRow } = yield (0, googleCalendarApiService_1.loadCalendarConnection)(supabaseAdmin, userId);
    const listSettings = yield (0, exports.listUserSyncEnabledLists)(supabaseAdmin, userId).catch(() => []);
    let connectionRow = publicRow;
    const canAutoRepairBinding = !!connectionRow && !connectionRow.selected_calendar_id && !!(secretsRow === null || secretsRow === void 0 ? void 0 : secretsRow.refresh_token_encrypted);
    if (canAutoRepairBinding) {
        try {
            const { accessToken } = yield (0, googleCalendarApiService_1.getValidGoogleAccessToken)(supabaseAdmin, userId);
            const repairedCalendar = yield (0, googleCalendarApiService_1.ensureTasksCalendar)({
                accessToken,
                preferredCalendarId: null,
            });
            const { data: repairedRow, error: repairedErr } = yield supabaseAdmin
                .from("tracker_google_calendar_connections_public")
                .update({
                selected_calendar_id: repairedCalendar.id,
                selected_calendar_summary: repairedCalendar.summary,
                status: "connected",
                last_error: null,
            })
                .eq("user_id", userId)
                .select("*")
                .single();
            if (!repairedErr && repairedRow) {
                connectionRow = repairedRow;
            }
        }
        catch (error) {
            const message = formatSyncErrorMessage(error);
            yield setConnectionHealth(supabaseAdmin, userId, { last_error: message }).catch(() => { });
        }
    }
    return {
        connected: !!connectionRow && !!(secretsRow === null || secretsRow === void 0 ? void 0 : secretsRow.refresh_token_encrypted),
        connection: connectionRow,
        watch_expires_at: (secretsRow === null || secretsRow === void 0 ? void 0 : secretsRow.channel_expiration) || null,
        list_sync_settings: listSettings,
    };
});
exports.getCalendarStatusForUser = getCalendarStatusForUser;
const getSyncProgressForRun = (supabaseAdmin, userId, runId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const normalizedRunId = runId.trim();
    if (!normalizedRunId) {
        return {
            run_id: runId,
            mode: null,
            status: "queued",
            total: 0,
            processed: 0,
            failed: 0,
            pending: 0,
            running: 0,
            done: false,
            failures: [],
        };
    }
    const run = yield getSyncRunById(supabaseAdmin, userId, normalizedRunId);
    if (!run) {
        return {
            run_id: normalizedRunId,
            mode: null,
            status: "queued",
            total: 0,
            processed: 0,
            failed: 0,
            pending: 0,
            running: 0,
            done: false,
            failures: [],
        };
    }
    yield refreshSyncRunState(supabaseAdmin, normalizedRunId).catch(() => { });
    const [total, pending, running, failuresRes, updatedRun] = yield Promise.all([
        countRunJobs(supabaseAdmin, normalizedRunId),
        countRunJobs(supabaseAdmin, normalizedRunId, ["pending"]),
        countRunJobs(supabaseAdmin, normalizedRunId, ["running"]),
        supabaseAdmin
            .from("tracker_google_sync_jobs")
            .select("id,last_error")
            .eq("run_id", normalizedRunId)
            .in("status", ["failed", "dead"])
            .order("id", { ascending: false })
            .limit(5),
        getSyncRunById(supabaseAdmin, userId, normalizedRunId),
    ]);
    const failedRows = ((_a = failuresRes.data) !== null && _a !== void 0 ? _a : []);
    const processed = (_b = updatedRun === null || updatedRun === void 0 ? void 0 : updatedRun.processed_jobs) !== null && _b !== void 0 ? _b : run.processed_jobs;
    const failed = (_c = updatedRun === null || updatedRun === void 0 ? void 0 : updatedRun.failed_jobs) !== null && _c !== void 0 ? _c : run.failed_jobs;
    return {
        run_id: normalizedRunId,
        mode: (_d = updatedRun === null || updatedRun === void 0 ? void 0 : updatedRun.mode) !== null && _d !== void 0 ? _d : run.mode,
        status: (_e = updatedRun === null || updatedRun === void 0 ? void 0 : updatedRun.status) !== null && _e !== void 0 ? _e : run.status,
        total,
        processed,
        failed,
        pending,
        running,
        done: pending === 0 && running === 0 && total > 0,
        failures: failedRows.map((row) => ({
            id: row.id,
            error: row.last_error || "Unknown sync error",
        })),
    };
});
exports.getSyncProgressForRun = getSyncProgressForRun;
const getSyncRunDebug = (supabaseAdmin, userId, runId) => __awaiter(void 0, void 0, void 0, function* () {
    const normalizedRunId = runId.trim();
    const run = yield getSyncRunById(supabaseAdmin, userId, normalizedRunId);
    if (!run)
        return null;
    const [{ data: rows }, { data: failures }] = yield Promise.all([
        supabaseAdmin
            .from("tracker_google_sync_jobs")
            .select("job_type,status")
            .eq("run_id", normalizedRunId)
            .order("id", { ascending: false })
            .limit(5000),
        supabaseAdmin
            .from("tracker_google_sync_jobs")
            .select("id,job_type,last_error,updated_at")
            .eq("run_id", normalizedRunId)
            .in("status", ["failed", "dead"])
            .order("id", { ascending: false })
            .limit(20),
    ]);
    const counts = {};
    for (const row of rows !== null && rows !== void 0 ? rows : []) {
        const key = String(row.job_type || "unknown");
        if (!counts[key])
            counts[key] = { total: 0, failed: 0, done: 0, pending: 0, running: 0 };
        counts[key].total += 1;
        const status = String(row.status || "");
        if (status === "failed" || status === "dead")
            counts[key].failed += 1;
        if (status === "done")
            counts[key].done += 1;
        if (status === "pending")
            counts[key].pending += 1;
        if (status === "running")
            counts[key].running += 1;
    }
    return {
        run,
        counts_by_job_type: counts,
        failures: failures !== null && failures !== void 0 ? failures : [],
    };
});
exports.getSyncRunDebug = getSyncRunDebug;
const inferLanesForRunMode = (mode) => {
    if (mode === "reconcile")
        return ["reconcile"];
    if (mode === "rebuild")
        return ["rebuild"];
    if (mode === "live")
        return ["live"];
    return ["reconcile", "rebuild"];
};
exports.inferLanesForRunMode = inferLanesForRunMode;
const normalizeDueAtForSync = (isoValue) => {
    if (!isoValue)
        return null;
    const parsed = new Date(isoValue);
    if (Number.isNaN(parsed.getTime()))
        return null;
    if ((0, googleCalendarApiService_1.isDateOnlyIso)(isoValue)) {
        parsed.setMilliseconds(777);
        return parsed.toISOString();
    }
    parsed.setMilliseconds(0);
    return parsed.toISOString();
};
exports.normalizeDueAtForSync = normalizeDueAtForSync;
