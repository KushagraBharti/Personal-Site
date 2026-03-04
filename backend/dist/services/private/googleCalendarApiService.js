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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchGoogleUserEmail = exports.listGoogleEventsDelta = exports.deleteGoogleEvent = exports.patchGoogleEvent = exports.insertGoogleEvent = exports.stopGoogleCalendarWatch = exports.upsertGoogleCalendarWatch = exports.ensureTasksCalendar = exports.updateGoogleCalendarSummary = exports.getGoogleCalendar = exports.createGoogleCalendar = exports.listGoogleCalendars = exports.getValidGoogleAccessToken = exports.loadCalendarConnection = exports.hashChannelToken = exports.taskToGoogleEventPayload = exports.googleEventToTaskDueAtIso = exports.isDateOnlyIso = exports.TRACKER_TASKS_CALENDAR_SUMMARY = void 0;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = require("crypto");
const encryptionService_1 = require("./encryptionService");
const GOOGLE_CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3";
const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const DATE_ONLY_MARKER_MS = 777;
const DEFAULT_TIMED_EVENT_DURATION_MS = 30 * 60 * 1000;
exports.TRACKER_TASKS_CALENDAR_SUMMARY = "Tracker Tasks";
const LEGACY_TASKS_CALENDAR_SUMMARY = "Tasks";
const requiredEnv = (key) => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`${key} must be set`);
    }
    return value;
};
const toIsoUtcNoMs = (d) => d.toISOString().replace(/\.\d{3}Z$/, "Z");
const buildRRule = (task) => {
    var _a, _b;
    if (task.recurrence_type === "none")
        return undefined;
    const parts = [];
    if (task.recurrence_type === "daily") {
        parts.push("FREQ=DAILY");
    }
    else if (task.recurrence_type === "weekly") {
        parts.push("FREQ=WEEKLY");
    }
    else if (task.recurrence_type === "biweekly") {
        parts.push("FREQ=WEEKLY", "INTERVAL=2");
    }
    else {
        const interval = Math.max((_a = task.recurrence_interval) !== null && _a !== void 0 ? _a : 1, 1);
        const unit = (_b = task.recurrence_unit) !== null && _b !== void 0 ? _b : "day";
        if (unit === "day")
            parts.push("FREQ=DAILY");
        if (unit === "week")
            parts.push("FREQ=WEEKLY");
        if (unit === "month")
            parts.push("FREQ=MONTHLY");
        parts.push(`INTERVAL=${interval}`);
    }
    if (task.recurrence_ends_at) {
        const end = new Date(task.recurrence_ends_at);
        if (!Number.isNaN(end.getTime())) {
            parts.push(`UNTIL=${toIsoUtcNoMs(end).replace(/[-:]/g, "")}`);
        }
    }
    return parts.length ? [`RRULE:${parts.join(";")}`] : undefined;
};
const dueAtToDatePart = (isoString) => {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime()))
        return null;
    return d.toISOString().slice(0, 10);
};
const isDateOnlyIso = (isoString) => {
    if (!isoString)
        return false;
    const parsed = new Date(isoString);
    if (Number.isNaN(parsed.getTime()))
        return false;
    return parsed.getMilliseconds() === DATE_ONLY_MARKER_MS;
};
exports.isDateOnlyIso = isDateOnlyIso;
const googleEventToTaskDueAtIso = (event) => {
    const start = event === null || event === void 0 ? void 0 : event.start;
    if (!start)
        return null;
    if (start.date) {
        const parsed = new Date(`${start.date}T12:00:00.000Z`);
        if (Number.isNaN(parsed.getTime()))
            return null;
        parsed.setMilliseconds(DATE_ONLY_MARKER_MS);
        return parsed.toISOString();
    }
    if (start.dateTime) {
        const parsed = new Date(start.dateTime);
        if (Number.isNaN(parsed.getTime()))
            return null;
        parsed.setMilliseconds(0);
        return parsed.toISOString();
    }
    return null;
};
exports.googleEventToTaskDueAtIso = googleEventToTaskDueAtIso;
const taskToGoogleEventPayload = (task) => {
    const payload = {
        summary: task.title,
        description: task.details || "",
        extendedProperties: {
            private: {
                tracker_task_id: task.id,
                tracker_user_id: task.user_id,
                tracker_parent_task_id: task.parent_task_id || "",
            },
        },
    };
    if (task.due_at) {
        if ((0, exports.isDateOnlyIso)(task.due_at)) {
            const datePart = dueAtToDatePart(task.due_at);
            if (datePart) {
                const nextDay = new Date(`${datePart}T00:00:00.000Z`);
                nextDay.setUTCDate(nextDay.getUTCDate() + 1);
                payload.start = { date: datePart };
                payload.end = { date: nextDay.toISOString().slice(0, 10) };
            }
        }
        else {
            const start = new Date(task.due_at);
            if (!Number.isNaN(start.getTime())) {
                const end = new Date(start.getTime() + DEFAULT_TIMED_EVENT_DURATION_MS);
                payload.start = { dateTime: start.toISOString() };
                payload.end = { dateTime: end.toISOString() };
            }
        }
    }
    const recurrence = buildRRule(task);
    if (recurrence) {
        payload.recurrence = recurrence;
    }
    return payload;
};
exports.taskToGoogleEventPayload = taskToGoogleEventPayload;
const authedRequest = (accessToken, config) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield axios_1.default.request(Object.assign(Object.assign({}, config), { headers: Object.assign(Object.assign({}, (config.headers || {})), { Authorization: `Bearer ${accessToken}` }) }));
    return response.data;
});
const hashChannelToken = (rawToken) => (0, crypto_1.createHash)("sha256").update(rawToken).digest("hex");
exports.hashChannelToken = hashChannelToken;
const loadCalendarConnection = (supabaseAdmin, userId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const [{ data: publicRow }, { data: secretsRow }] = yield Promise.all([
        supabaseAdmin
            .from("tracker_google_calendar_connections_public")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle(),
        supabaseAdmin
            .from("tracker_google_calendar_connections_secrets")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle(),
    ]);
    return {
        publicRow: (_a = publicRow) !== null && _a !== void 0 ? _a : null,
        secretsRow: (_b = secretsRow) !== null && _b !== void 0 ? _b : null,
    };
});
exports.loadCalendarConnection = loadCalendarConnection;
const refreshGoogleAccessToken = (refreshToken) => __awaiter(void 0, void 0, void 0, function* () {
    const payload = new URLSearchParams({
        client_id: requiredEnv("GOOGLE_CLIENT_ID"),
        client_secret: requiredEnv("GOOGLE_CLIENT_SECRET"),
        grant_type: "refresh_token",
        refresh_token: refreshToken,
    });
    const response = yield axios_1.default.post(GOOGLE_OAUTH_TOKEN_URL, payload.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    const data = response.data;
    if (!data.access_token) {
        throw new Error("Google token refresh returned no access token");
    }
    return data;
});
const getValidGoogleAccessToken = (supabaseAdmin, userId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { publicRow, secretsRow } = yield (0, exports.loadCalendarConnection)(supabaseAdmin, userId);
    if (!publicRow || !secretsRow) {
        throw new Error("Google Calendar connection not found");
    }
    let cachedToken = null;
    if (secretsRow.access_token_encrypted) {
        try {
            cachedToken = (0, encryptionService_1.decryptFromBase64)(secretsRow.access_token_encrypted);
        }
        catch (_b) {
            cachedToken = null;
        }
    }
    const expiresAtMs = secretsRow.access_token_expires_at
        ? new Date(secretsRow.access_token_expires_at).getTime()
        : 0;
    const now = Date.now();
    if (cachedToken && expiresAtMs > now + 60000) {
        return { accessToken: cachedToken, publicRow, secretsRow };
    }
    const refreshToken = (0, encryptionService_1.decryptFromBase64)(secretsRow.refresh_token_encrypted);
    const refreshed = yield refreshGoogleAccessToken(refreshToken);
    const expiresAt = new Date(Date.now() + ((_a = refreshed.expires_in) !== null && _a !== void 0 ? _a : 3600) * 1000).toISOString();
    const { data: nextSecrets, error: updateError } = yield supabaseAdmin
        .from("tracker_google_calendar_connections_secrets")
        .update({
        access_token_encrypted: (0, encryptionService_1.encryptToBase64)(refreshed.access_token),
        access_token_expires_at: expiresAt,
    })
        .eq("id", secretsRow.id)
        .select("*")
        .single();
    if (updateError || !nextSecrets) {
        throw new Error((updateError === null || updateError === void 0 ? void 0 : updateError.message) || "Failed to persist Google access token");
    }
    return {
        accessToken: refreshed.access_token,
        publicRow,
        secretsRow: nextSecrets,
    };
});
exports.getValidGoogleAccessToken = getValidGoogleAccessToken;
const listGoogleCalendars = (accessToken) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const data = yield authedRequest(accessToken, {
        method: "GET",
        url: `${GOOGLE_CALENDAR_API_BASE}/users/me/calendarList`,
        params: { maxResults: 250 },
    });
    return (_a = data.items) !== null && _a !== void 0 ? _a : [];
});
exports.listGoogleCalendars = listGoogleCalendars;
const createGoogleCalendar = (accessToken, summary) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const data = yield authedRequest(accessToken, {
        method: "POST",
        url: `${GOOGLE_CALENDAR_API_BASE}/calendars`,
        data: { summary },
    });
    return { id: data.id, summary: (_a = data.summary) !== null && _a !== void 0 ? _a : summary };
});
exports.createGoogleCalendar = createGoogleCalendar;
const getGoogleCalendar = (accessToken, calendarId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const data = yield authedRequest(accessToken, {
        method: "GET",
        url: `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}`,
    });
    return { id: data.id || calendarId, summary: (_a = data.summary) !== null && _a !== void 0 ? _a : null };
});
exports.getGoogleCalendar = getGoogleCalendar;
const updateGoogleCalendarSummary = (accessToken, calendarId, summary) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const data = yield authedRequest(accessToken, {
        method: "PATCH",
        url: `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}`,
        data: { summary },
    });
    return { id: data.id || calendarId, summary: (_a = data.summary) !== null && _a !== void 0 ? _a : summary };
});
exports.updateGoogleCalendarSummary = updateGoogleCalendarSummary;
const normalizeCalendarSummary = (summary) => (summary || "").trim().toLowerCase();
const ensureTasksCalendar = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { accessToken, preferredCalendarId } = params;
    const calendars = yield (0, exports.listGoogleCalendars)(accessToken);
    const ensureCanonicalSummary = (calendar) => __awaiter(void 0, void 0, void 0, function* () {
        if (normalizeCalendarSummary(calendar.summary) ===
            normalizeCalendarSummary(exports.TRACKER_TASKS_CALENDAR_SUMMARY)) {
            return {
                id: calendar.id,
                summary: calendar.summary || exports.TRACKER_TASKS_CALENDAR_SUMMARY,
            };
        }
        try {
            return yield (0, exports.updateGoogleCalendarSummary)(accessToken, calendar.id, exports.TRACKER_TASKS_CALENDAR_SUMMARY);
        }
        catch (_a) {
            return {
                id: calendar.id,
                summary: calendar.summary || exports.TRACKER_TASKS_CALENDAR_SUMMARY,
            };
        }
    });
    if (preferredCalendarId) {
        const preferredFromList = calendars.find((item) => item.id === preferredCalendarId);
        if (preferredFromList) {
            return ensureCanonicalSummary({
                id: preferredFromList.id,
                summary: preferredFromList.summary || null,
            });
        }
        try {
            const preferredCalendar = yield (0, exports.getGoogleCalendar)(accessToken, preferredCalendarId);
            return ensureCanonicalSummary(preferredCalendar);
        }
        catch (_a) {
            // If the previously saved calendar is gone or inaccessible, continue fallback resolution.
        }
    }
    const canonicalCalendar = calendars.find((item) => normalizeCalendarSummary(item.summary) ===
        normalizeCalendarSummary(exports.TRACKER_TASKS_CALENDAR_SUMMARY));
    if (canonicalCalendar) {
        return {
            id: canonicalCalendar.id,
            summary: canonicalCalendar.summary || exports.TRACKER_TASKS_CALENDAR_SUMMARY,
        };
    }
    const legacyCalendar = calendars.find((item) => normalizeCalendarSummary(item.summary) ===
        normalizeCalendarSummary(LEGACY_TASKS_CALENDAR_SUMMARY));
    if (legacyCalendar) {
        return ensureCanonicalSummary({
            id: legacyCalendar.id,
            summary: legacyCalendar.summary || LEGACY_TASKS_CALENDAR_SUMMARY,
        });
    }
    return (0, exports.createGoogleCalendar)(accessToken, exports.TRACKER_TASKS_CALENDAR_SUMMARY);
});
exports.ensureTasksCalendar = ensureTasksCalendar;
const upsertGoogleCalendarWatch = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const channelId = (0, crypto_1.randomUUID)();
    const data = yield authedRequest(params.accessToken, {
        method: "POST",
        url: `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(params.calendarId)}/events/watch`,
        data: {
            id: channelId,
            type: "web_hook",
            address: params.webhookUrl,
            token: params.rawChannelToken,
            params: { ttl: "604800" }, // 7 days
        },
    });
    return {
        channelId: data.id || channelId,
        resourceId: data.resourceId,
        expiration: data.expiration ? new Date(Number(data.expiration)).toISOString() : null,
    };
});
exports.upsertGoogleCalendarWatch = upsertGoogleCalendarWatch;
const stopGoogleCalendarWatch = (accessToken, channelId, resourceId) => __awaiter(void 0, void 0, void 0, function* () {
    yield authedRequest(accessToken, {
        method: "POST",
        url: `${GOOGLE_CALENDAR_API_BASE}/channels/stop`,
        data: {
            id: channelId,
            resourceId,
        },
    });
});
exports.stopGoogleCalendarWatch = stopGoogleCalendarWatch;
const insertGoogleEvent = (accessToken, calendarId, eventBody) => __awaiter(void 0, void 0, void 0, function* () {
    return authedRequest(accessToken, {
        method: "POST",
        url: `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`,
        params: { sendUpdates: "none" },
        data: eventBody,
    });
});
exports.insertGoogleEvent = insertGoogleEvent;
const patchGoogleEvent = (accessToken, calendarId, eventId, eventBody) => __awaiter(void 0, void 0, void 0, function* () {
    return authedRequest(accessToken, {
        method: "PATCH",
        url: `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
        params: { sendUpdates: "none" },
        data: eventBody,
    });
});
exports.patchGoogleEvent = patchGoogleEvent;
const deleteGoogleEvent = (accessToken, calendarId, eventId) => __awaiter(void 0, void 0, void 0, function* () {
    yield authedRequest(accessToken, {
        method: "DELETE",
        url: `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
        params: { sendUpdates: "none" },
    });
});
exports.deleteGoogleEvent = deleteGoogleEvent;
const listGoogleEventsDelta = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const query = {
        singleEvents: "false",
        showDeleted: "true",
        maxResults: "2500",
    };
    if (params.syncToken)
        query.syncToken = params.syncToken;
    if (params.pageToken)
        query.pageToken = params.pageToken;
    if (params.timeMin)
        query.timeMin = params.timeMin;
    return authedRequest(params.accessToken, {
        method: "GET",
        url: `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(params.calendarId)}/events`,
        params: query,
    });
});
exports.listGoogleEventsDelta = listGoogleEventsDelta;
const fetchGoogleUserEmail = (accessToken) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield authedRequest(accessToken, {
        method: "GET",
        url: "https://www.googleapis.com/oauth2/v2/userinfo",
    });
    return data.email || null;
});
exports.fetchGoogleUserEmail = fetchGoogleUserEmail;
