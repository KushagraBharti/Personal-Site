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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeDueAtForSync = exports.queueManualSyncForUser = exports.getCalendarStatusForUser = exports.upsertListSyncSetting = exports.listUserSyncEnabledLists = exports.renewExpiringCalendarWatches = exports.disconnectGoogleCalendarForUser = exports.upsertGoogleConnectionFromOAuth = exports.queueFullBackfill = exports.processCalendarSyncJobs = exports.renewCalendarWatchForUser = void 0;
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
    if (apiErrMessage) {
        return apiErrMessage;
    }
    return generic;
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
const isMissingDueTimezoneColumnError = (error) => {
    const message = error instanceof Error
        ? error.message.toLowerCase()
        : typeof (error === null || error === void 0 ? void 0 : error.message) === "string"
            ? error.message.toLowerCase()
            : "";
    return message.includes("due_timezone") && message.includes("column");
};
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
const shouldSyncTask = (task) => !task.is_completed && !!task.due_at;
const processTaskUpsertJob = (supabaseAdmin, job) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    if (!job.task_id)
        return;
    const task = yield getTaskById(supabaseAdmin, job.user_id, job.task_id);
    if (!task)
        return;
    const listEnabled = yield isListSyncEnabled(supabaseAdmin, job.user_id, task.list_id);
    if (!listEnabled)
        return;
    const { accessToken, publicRow } = yield (0, googleCalendarApiService_1.getValidGoogleAccessToken)(supabaseAdmin, job.user_id);
    const calendarId = publicRow.selected_calendar_id;
    if (!calendarId)
        return;
    const existingLink = yield getLinkByTaskId(supabaseAdmin, job.user_id, task.id);
    if (!shouldSyncTask(task)) {
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
    if (existingLink &&
        existingLink.last_sync_source === "google" &&
        existingLink.last_synced_task_updated_at &&
        new Date(existingLink.last_synced_task_updated_at).getTime() >= new Date(task.updated_at).getTime()) {
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
            // If the linked Google event was deleted outside the app, recreate it and relink.
            if (!isGoogleNotFoundError(error)) {
                throw error;
            }
            const inserted = yield (0, googleCalendarApiService_1.insertGoogleEvent)(accessToken, calendarId, eventPayload);
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
    }
    const inserted = yield (0, googleCalendarApiService_1.insertGoogleEvent)(accessToken, calendarId, eventPayload);
    yield upsertLink(supabaseAdmin, {
        userId: job.user_id,
        taskId: task.id,
        calendarId,
        googleEventId: inserted.id,
        etag: (_e = inserted.etag) !== null && _e !== void 0 ? _e : null,
        googleUpdatedAt: (_f = inserted.updated) !== null && _f !== void 0 ? _f : nowIso(),
        lastSyncedTaskUpdatedAt: task.updated_at,
        lastSyncSource: "app",
        isDeleted: false,
    });
});
const processTaskDeleteJob = (supabaseAdmin, job) => __awaiter(void 0, void 0, void 0, function* () {
    if (!job.task_id)
        return;
    const link = yield getLinkByTaskId(supabaseAdmin, job.user_id, job.task_id);
    if (!link)
        return;
    const { accessToken } = yield (0, googleCalendarApiService_1.getValidGoogleAccessToken)(supabaseAdmin, job.user_id);
    try {
        yield (0, googleCalendarApiService_1.deleteGoogleEvent)(accessToken, link.calendar_id, link.google_event_id);
    }
    catch (_a) {
        // Best effort; mark as deleted anyway.
    }
    const { error } = yield supabaseAdmin
        .from("tracker_task_google_event_links")
        .update({ is_deleted: true, last_sync_source: "app", last_synced_task_updated_at: nowIso() })
        .eq("id", link.id);
    if (error)
        throw new Error(error.message);
});
const processFullBackfillJob = (supabaseAdmin, job) => __awaiter(void 0, void 0, void 0, function* () {
    const { data: enabledRows, error: enabledErr } = yield supabaseAdmin
        .from("tracker_task_list_sync_settings")
        .select("list_id")
        .eq("user_id", job.user_id)
        .eq("sync_enabled", true);
    if (enabledErr)
        throw new Error(enabledErr.message);
    const enabledListIds = (enabledRows !== null && enabledRows !== void 0 ? enabledRows : []).map((row) => row.list_id);
    if (enabledListIds.length === 0)
        return;
    let query = supabaseAdmin
        .from("tracker_tasks")
        .select("id, user_id, list_id, due_at, is_completed")
        .eq("user_id", job.user_id)
        .in("list_id", enabledListIds);
    if (job.list_id)
        query = query.eq("list_id", job.list_id);
    const { data: tasks, error: taskErr } = yield query;
    if (taskErr)
        throw new Error(taskErr.message);
    for (const row of tasks !== null && tasks !== void 0 ? tasks : []) {
        if (row.is_completed || !row.due_at)
            continue;
        yield (0, calendarSyncQueueService_1.enqueueSyncJob)(supabaseAdmin, {
            userId: job.user_id,
            taskId: row.id,
            listId: row.list_id,
            jobType: "task_upsert",
            priority: 60,
            payload: { source: "full_backfill" },
            dedupeKey: `backfill:${row.id}:${new Date().toISOString().slice(0, 16)}`,
        });
    }
    yield setConnectionHealth(supabaseAdmin, job.user_id, {
        last_full_sync_at: nowIso(),
        status: "connected",
        last_error: null,
    });
});
const processInboundDeltaJob = (supabaseAdmin, job) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    const { accessToken, publicRow, secretsRow } = yield (0, googleCalendarApiService_1.getValidGoogleAccessToken)(supabaseAdmin, job.user_id);
    const calendarId = publicRow.selected_calendar_id;
    if (!calendarId)
        return;
    let pageToken = null;
    let nextSyncToken = null;
    const syncToken = secretsRow.sync_token || null;
    do {
        let delta;
        try {
            delta = yield (0, googleCalendarApiService_1.listGoogleEventsDelta)({
                accessToken,
                calendarId,
                syncToken,
                pageToken,
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
                yield (0, calendarSyncQueueService_1.enqueueSyncJob)(supabaseAdmin, {
                    userId: job.user_id,
                    jobType: "inbound_delta",
                    priority: 80,
                    payload: { source: "sync_token_reset" },
                    dedupeKey: `inbound-reset:${job.user_id}:${new Date().toISOString().slice(0, 16)}`,
                });
                return;
            }
            throw err;
        }
        for (const event of (_b = delta.items) !== null && _b !== void 0 ? _b : []) {
            if (!(event === null || event === void 0 ? void 0 : event.id))
                continue;
            const linkByEvent = yield getLinkByEvent(supabaseAdmin, job.user_id, calendarId, event.id);
            const extTaskId = (_d = (_c = event === null || event === void 0 ? void 0 : event.extendedProperties) === null || _c === void 0 ? void 0 : _c.private) === null || _d === void 0 ? void 0 : _d.tracker_task_id;
            const taskId = (linkByEvent === null || linkByEvent === void 0 ? void 0 : linkByEvent.task_id) || extTaskId;
            if (!taskId)
                continue;
            const task = yield getTaskById(supabaseAdmin, job.user_id, taskId);
            if (!task)
                continue;
            const listEnabled = yield isListSyncEnabled(supabaseAdmin, job.user_id, task.list_id);
            if (!listEnabled)
                continue;
            if (event.status === "cancelled") {
                if (shouldSyncTask(task)) {
                    yield (0, calendarSyncQueueService_1.enqueueSyncJob)(supabaseAdmin, {
                        userId: job.user_id,
                        taskId: task.id,
                        listId: task.list_id,
                        jobType: "task_upsert",
                        priority: 70,
                        payload: { source: "google_cancelled" },
                        dedupeKey: `restore:${task.id}:${new Date().toISOString().slice(0, 16)}`,
                    });
                }
                continue;
            }
            const googleUpdatedMs = new Date(event.updated || event.created || 0).getTime();
            const taskUpdatedMs = new Date(task.updated_at).getTime();
            if (Number.isFinite(googleUpdatedMs) && googleUpdatedMs > taskUpdatedMs) {
                const nextDueAt = (0, googleCalendarApiService_1.googleEventToTaskDueAtIso)(event);
                const nextDueTimeZone = nextDueAt && !(0, googleCalendarApiService_1.isDateOnlyIso)(nextDueAt) ? (0, googleCalendarApiService_1.googleEventToTaskTimeZone)(event) : null;
                const updates = {
                    title: typeof event.summary === "string" && event.summary.trim() ? event.summary.trim() : task.title,
                    details: typeof event.description === "string" ? event.description : null,
                    due_at: nextDueAt,
                    due_timezone: nextDueTimeZone,
                };
                let updateAttempt = yield supabaseAdmin
                    .from("tracker_tasks")
                    .update(updates)
                    .eq("user_id", job.user_id)
                    .eq("id", task.id)
                    .select("id, updated_at")
                    .single();
                if (updateAttempt.error && isMissingDueTimezoneColumnError(updateAttempt.error)) {
                    const { due_timezone } = updates, fallbackUpdates = __rest(updates, ["due_timezone"]);
                    updateAttempt = yield supabaseAdmin
                        .from("tracker_tasks")
                        .update(fallbackUpdates)
                        .eq("user_id", job.user_id)
                        .eq("id", task.id)
                        .select("id, updated_at")
                        .single();
                }
                const updatedTask = updateAttempt.data;
                const updateErr = updateAttempt.error;
                if (updateErr || !updatedTask) {
                    throw new Error((updateErr === null || updateErr === void 0 ? void 0 : updateErr.message) || "Failed to apply Google update to task");
                }
                yield upsertLink(supabaseAdmin, {
                    userId: job.user_id,
                    taskId: task.id,
                    calendarId,
                    googleEventId: event.id,
                    etag: (_e = event.etag) !== null && _e !== void 0 ? _e : null,
                    googleUpdatedAt: (_f = event.updated) !== null && _f !== void 0 ? _f : null,
                    lastSyncedTaskUpdatedAt: updatedTask.updated_at,
                    lastSyncSource: "google",
                    isDeleted: false,
                });
            }
            else {
                yield (0, calendarSyncQueueService_1.enqueueSyncJob)(supabaseAdmin, {
                    userId: job.user_id,
                    taskId: task.id,
                    listId: task.list_id,
                    jobType: "task_upsert",
                    priority: 90,
                    payload: { source: "conflict_app_won" },
                    dedupeKey: `conflict:${task.id}:${new Date().toISOString().slice(0, 16)}`,
                });
            }
        }
        pageToken = (_g = delta.nextPageToken) !== null && _g !== void 0 ? _g : null;
        if (delta.nextSyncToken) {
            nextSyncToken = delta.nextSyncToken;
        }
    } while (pageToken);
    const { error: secretErr } = yield supabaseAdmin
        .from("tracker_google_calendar_connections_secrets")
        .update({
        sync_token: nextSyncToken !== null && nextSyncToken !== void 0 ? nextSyncToken : syncToken,
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
    if (job.job_type === "full_backfill")
        return processFullBackfillJob(supabaseAdmin, job);
    if (job.job_type === "inbound_delta")
        return processInboundDeltaJob(supabaseAdmin, job);
    if (job.job_type === "renew_watch")
        return processRenewWatchJob(supabaseAdmin, job);
});
const processCalendarSyncJobs = (input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const supabaseAdmin = (0, calendarSyncQueueService_1.getSupabaseAdmin)();
    const jobs = yield (0, calendarSyncQueueService_1.claimSyncJobs)(supabaseAdmin, (_a = input === null || input === void 0 ? void 0 : input.batchSize) !== null && _a !== void 0 ? _a : 25, input === null || input === void 0 ? void 0 : input.userId);
    const results = [];
    for (const job of jobs) {
        try {
            yield processOneJob(supabaseAdmin, job);
            yield (0, calendarSyncQueueService_1.completeSyncJob)(supabaseAdmin, job.id);
            yield setConnectionHealth(supabaseAdmin, job.user_id, {
                status: "connected",
                last_error: null,
            }).catch(() => { });
            results.push({ id: job.id, ok: true });
        }
        catch (error) {
            const message = formatSyncErrorMessage(error);
            const retryDelay = (0, calendarSyncQueueService_1.computeRetryDelayInterval)(job.attempt_count + 1);
            const authFatal = isAuthFatalSyncError(error);
            try {
                yield (0, calendarSyncQueueService_1.failSyncJob)(supabaseAdmin, job.id, message, retryDelay);
            }
            catch (_b) {
                // suppress
            }
            yield setConnectionHealth(supabaseAdmin, job.user_id, authFatal
                ? { status: "error", last_error: message }
                : { last_error: message }).catch(() => { });
            results.push({ id: job.id, ok: false, error: message });
        }
    }
    return results;
});
exports.processCalendarSyncJobs = processCalendarSyncJobs;
const queueFullBackfill = (supabaseAdmin, userId, listId) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, calendarSyncQueueService_1.enqueueSyncJob)(supabaseAdmin, {
        userId,
        listId: listId !== null && listId !== void 0 ? listId : null,
        jobType: "full_backfill",
        priority: 50,
        payload: { source: "manual_or_connect" },
        dedupeKey: `full_backfill:${userId}:${listId || "all"}:${new Date().toISOString().slice(0, 16)}`,
    });
});
exports.queueFullBackfill = queueFullBackfill;
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
    yield (0, exports.queueFullBackfill)(supabaseAdmin, userId);
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
    yield supabaseAdmin
        .from("tracker_task_google_event_links")
        .delete()
        .eq("user_id", userId);
});
exports.disconnectGoogleCalendarForUser = disconnectGoogleCalendarForUser;
const renewExpiringCalendarWatches = (input) => __awaiter(void 0, void 0, void 0, function* () {
    const supabaseAdmin = (0, calendarSyncQueueService_1.getSupabaseAdmin)();
    let query = supabaseAdmin
        .from("tracker_google_calendar_connections_secrets")
        .select("user_id, channel_expiration");
    if (input === null || input === void 0 ? void 0 : input.userId) {
        query = query.eq("user_id", input.userId);
    }
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
            yield setConnectionHealth(supabaseAdmin, userId, authFatal
                ? { status: "error", last_error: message }
                : { last_error: message }).catch(() => { });
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
    const canAutoRepairBinding = !!connectionRow &&
        !connectionRow.selected_calendar_id &&
        !!(secretsRow === null || secretsRow === void 0 ? void 0 : secretsRow.refresh_token_encrypted);
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
const queueManualSyncForUser = (supabaseAdmin, userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Queue fast-return manual sync work and let cron workers process it.
    yield (0, calendarSyncQueueService_1.enqueueSyncJob)(supabaseAdmin, {
        userId,
        jobType: "inbound_delta",
        priority: 70,
        payload: { source: "manual_sync_now" },
        dedupeKey: `manual-inbound:${userId}:${new Date().toISOString().slice(0, 16)}`,
    });
});
exports.queueManualSyncForUser = queueManualSyncForUser;
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
