import axios, { AxiosRequestConfig } from "axios";
import { createHash, randomUUID } from "crypto";
import { SupabaseClient } from "@supabase/supabase-js";
import { decryptFromBase64, encryptToBase64 } from "./encryptionService";
import { CalendarConnectionPublic, CalendarConnectionSecrets, TrackerTaskRow } from "../../types/googleCalendar";

const GOOGLE_CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3";
const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const DATE_ONLY_MARKER_MS = 777;
const DEFAULT_TIMED_EVENT_DURATION_MS = 30 * 60 * 1000;
const GOOGLE_EVENT_TIMEZONE = process.env.GOOGLE_EVENT_TIMEZONE || "UTC";
const GOOGLE_API_TIMEOUT_MS = Number(process.env.GOOGLE_API_TIMEOUT_MS || 4500);
export const TRACKER_TASKS_CALENDAR_SUMMARY = "Tracker Tasks";
const LEGACY_TASKS_CALENDAR_SUMMARY = "Tasks";

const requiredEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} must be set`);
  }
  return value;
};

const toIsoUtcNoMs = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, "Z");

const isValidIanaTimeZone = (timeZone: string | null | undefined) => {
  if (!timeZone) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
};

const resolveEventTimeZone = (taskTimeZone: string | null | undefined) => {
  if (isValidIanaTimeZone(taskTimeZone)) return taskTimeZone as string;
  if (isValidIanaTimeZone(GOOGLE_EVENT_TIMEZONE)) return GOOGLE_EVENT_TIMEZONE;
  return "UTC";
};

const buildRRule = (task: TrackerTaskRow): string[] | undefined => {
  if (task.recurrence_type === "none") return undefined;

  const parts: string[] = [];
  if (task.recurrence_type === "daily") {
    parts.push("FREQ=DAILY");
  } else if (task.recurrence_type === "weekly") {
    parts.push("FREQ=WEEKLY");
  } else if (task.recurrence_type === "biweekly") {
    parts.push("FREQ=WEEKLY", "INTERVAL=2");
  } else {
    const interval = Math.max(task.recurrence_interval ?? 1, 1);
    const unit = task.recurrence_unit ?? "day";
    if (unit === "day") parts.push("FREQ=DAILY");
    if (unit === "week") parts.push("FREQ=WEEKLY");
    if (unit === "month") parts.push("FREQ=MONTHLY");
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

const dueAtToDatePart = (isoString: string) => {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
};

export const isDateOnlyIso = (isoString: string | null | undefined) => {
  if (!isoString) return false;
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.getMilliseconds() === DATE_ONLY_MARKER_MS;
};

export const googleEventToTaskDueAtIso = (event: any): string | null => {
  const start = event?.start;
  if (!start) return null;
  if (start.date) {
    const parsed = new Date(`${start.date}T12:00:00.000Z`);
    if (Number.isNaN(parsed.getTime())) return null;
    parsed.setMilliseconds(DATE_ONLY_MARKER_MS);
    return parsed.toISOString();
  }
  if (start.dateTime) {
    const parsed = new Date(start.dateTime);
    if (Number.isNaN(parsed.getTime())) return null;
    parsed.setMilliseconds(0);
    return parsed.toISOString();
  }
  return null;
};

export const googleEventToTaskTimeZone = (event: any): string | null => {
  const startTimeZone =
    typeof event?.start?.timeZone === "string" ? event.start.timeZone.trim() : "";
  const endTimeZone =
    typeof event?.end?.timeZone === "string" ? event.end.timeZone.trim() : "";
  const candidate = startTimeZone || endTimeZone || "";
  return isValidIanaTimeZone(candidate) ? candidate : null;
};

export const taskToGoogleEventPayload = (task: TrackerTaskRow) => {
  const payload: Record<string, unknown> = {
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

  const eventTimeZone = resolveEventTimeZone(task.due_timezone);

  if (task.due_at) {
    if (isDateOnlyIso(task.due_at)) {
      const datePart = dueAtToDatePart(task.due_at);
      if (datePart) {
        const nextDay = new Date(`${datePart}T00:00:00.000Z`);
        nextDay.setUTCDate(nextDay.getUTCDate() + 1);
        payload.start = { date: datePart };
        payload.end = { date: nextDay.toISOString().slice(0, 10) };
      }
    } else {
      const start = new Date(task.due_at);
      if (!Number.isNaN(start.getTime())) {
        const end = new Date(start.getTime() + DEFAULT_TIMED_EVENT_DURATION_MS);
        payload.start = { dateTime: start.toISOString(), timeZone: eventTimeZone };
        payload.end = { dateTime: end.toISOString(), timeZone: eventTimeZone };
      }
    }
  }

  const recurrence = buildRRule(task);
  if (recurrence) {
    payload.recurrence = recurrence;
  }

  return payload;
};

export const taskIdToDeterministicGoogleEventId = (taskId: string) => {
  const digest = createHash("sha1").update(taskId).digest("hex");
  return `trk${digest}`;
};

const authedRequest = async <T = any>(accessToken: string, config: AxiosRequestConfig) => {
  const response = await axios.request<T>({
    ...config,
    timeout: GOOGLE_API_TIMEOUT_MS,
    headers: {
      ...(config.headers || {}),
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data;
};

export const hashChannelToken = (rawToken: string) =>
  createHash("sha256").update(rawToken).digest("hex");

export const loadCalendarConnection = async (
  supabaseAdmin: SupabaseClient,
  userId: string
): Promise<{ publicRow: CalendarConnectionPublic | null; secretsRow: CalendarConnectionSecrets | null }> => {
  const [{ data: publicRow }, { data: secretsRow }] = await Promise.all([
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
    publicRow: (publicRow as CalendarConnectionPublic | null) ?? null,
    secretsRow: (secretsRow as CalendarConnectionSecrets | null) ?? null,
  };
};

const refreshGoogleAccessToken = async (refreshToken: string) => {
  const payload = new URLSearchParams({
    client_id: requiredEnv("GOOGLE_CLIENT_ID"),
    client_secret: requiredEnv("GOOGLE_CLIENT_SECRET"),
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const response = await axios.post(GOOGLE_OAUTH_TOKEN_URL, payload.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    timeout: GOOGLE_API_TIMEOUT_MS,
  });

  const data = response.data as {
    access_token: string;
    expires_in?: number;
    token_type?: string;
  };

  if (!data.access_token) {
    throw new Error("Google token refresh returned no access token");
  }

  return data;
};

export const getValidGoogleAccessToken = async (supabaseAdmin: SupabaseClient, userId: string) => {
  const { publicRow, secretsRow } = await loadCalendarConnection(supabaseAdmin, userId);
  if (!publicRow || !secretsRow) {
    throw new Error("Google Calendar connection not found");
  }

  let cachedToken: string | null = null;
  if (secretsRow.access_token_encrypted) {
    try {
      cachedToken = decryptFromBase64(secretsRow.access_token_encrypted);
    } catch {
      cachedToken = null;
    }
  }

  const expiresAtMs = secretsRow.access_token_expires_at
    ? new Date(secretsRow.access_token_expires_at).getTime()
    : 0;
  const now = Date.now();
  if (cachedToken && expiresAtMs > now + 60_000) {
    return { accessToken: cachedToken, publicRow, secretsRow };
  }

  const refreshToken = decryptFromBase64(secretsRow.refresh_token_encrypted);
  const refreshed = await refreshGoogleAccessToken(refreshToken);
  const expiresAt = new Date(Date.now() + (refreshed.expires_in ?? 3600) * 1000).toISOString();

  const { data: nextSecrets, error: updateError } = await supabaseAdmin
    .from("tracker_google_calendar_connections_secrets")
    .update({
      access_token_encrypted: encryptToBase64(refreshed.access_token),
      access_token_expires_at: expiresAt,
    })
    .eq("id", secretsRow.id)
    .select("*")
    .single();

  if (updateError || !nextSecrets) {
    throw new Error(updateError?.message || "Failed to persist Google access token");
  }

  return {
    accessToken: refreshed.access_token,
    publicRow,
    secretsRow: nextSecrets as CalendarConnectionSecrets,
  };
};

export const listGoogleCalendars = async (accessToken: string) => {
  const data = await authedRequest<{ items?: Array<{ id: string; summary?: string; primary?: boolean }> }>(
    accessToken,
    {
      method: "GET",
      url: `${GOOGLE_CALENDAR_API_BASE}/users/me/calendarList`,
      params: { maxResults: 250 },
    }
  );
  return data.items ?? [];
};

export const createGoogleCalendar = async (accessToken: string, summary: string) => {
  const data = await authedRequest<{ id: string; summary?: string }>(accessToken, {
    method: "POST",
    url: `${GOOGLE_CALENDAR_API_BASE}/calendars`,
    data: { summary },
  });
  return { id: data.id, summary: data.summary ?? summary };
};

export const getGoogleCalendar = async (accessToken: string, calendarId: string) => {
  const data = await authedRequest<{ id: string; summary?: string }>(accessToken, {
    method: "GET",
    url: `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}`,
  });
  return { id: data.id || calendarId, summary: data.summary ?? null };
};

export const updateGoogleCalendarSummary = async (
  accessToken: string,
  calendarId: string,
  summary: string
) => {
  const data = await authedRequest<{ id: string; summary?: string }>(accessToken, {
    method: "PATCH",
    url: `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}`,
    data: { summary },
  });
  return { id: data.id || calendarId, summary: data.summary ?? summary };
};

const normalizeCalendarSummary = (summary: string | null | undefined) =>
  (summary || "").trim().toLowerCase();

export const ensureTasksCalendar = async (params: {
  accessToken: string;
  preferredCalendarId?: string | null;
}) => {
  const { accessToken, preferredCalendarId } = params;
  const calendars = await listGoogleCalendars(accessToken);

  const ensureCanonicalSummary = async (calendar: { id: string; summary?: string | null }) => {
    if (
      normalizeCalendarSummary(calendar.summary) ===
      normalizeCalendarSummary(TRACKER_TASKS_CALENDAR_SUMMARY)
    ) {
      return {
        id: calendar.id,
        summary: calendar.summary || TRACKER_TASKS_CALENDAR_SUMMARY,
      };
    }

    try {
      return await updateGoogleCalendarSummary(
        accessToken,
        calendar.id,
        TRACKER_TASKS_CALENDAR_SUMMARY
      );
    } catch {
      return {
        id: calendar.id,
        summary: calendar.summary || TRACKER_TASKS_CALENDAR_SUMMARY,
      };
    }
  };

  if (preferredCalendarId) {
    const preferredFromList = calendars.find((item) => item.id === preferredCalendarId);
    if (preferredFromList) {
      return ensureCanonicalSummary({
        id: preferredFromList.id,
        summary: preferredFromList.summary || null,
      });
    }

    try {
      const preferredCalendar = await getGoogleCalendar(accessToken, preferredCalendarId);
      return ensureCanonicalSummary(preferredCalendar);
    } catch {
      // If the previously saved calendar is gone or inaccessible, continue fallback resolution.
    }
  }

  const canonicalCalendar = calendars.find(
    (item) =>
      normalizeCalendarSummary(item.summary) ===
      normalizeCalendarSummary(TRACKER_TASKS_CALENDAR_SUMMARY)
  );
  if (canonicalCalendar) {
    return {
      id: canonicalCalendar.id,
      summary: canonicalCalendar.summary || TRACKER_TASKS_CALENDAR_SUMMARY,
    };
  }

  const legacyCalendar = calendars.find(
    (item) =>
      normalizeCalendarSummary(item.summary) ===
      normalizeCalendarSummary(LEGACY_TASKS_CALENDAR_SUMMARY)
  );
  if (legacyCalendar) {
    return ensureCanonicalSummary({
      id: legacyCalendar.id,
      summary: legacyCalendar.summary || LEGACY_TASKS_CALENDAR_SUMMARY,
    });
  }

  return createGoogleCalendar(accessToken, TRACKER_TASKS_CALENDAR_SUMMARY);
};

export const upsertGoogleCalendarWatch = async (params: {
  accessToken: string;
  calendarId: string;
  webhookUrl: string;
  rawChannelToken: string;
}) => {
  const channelId = randomUUID();
  const data = await authedRequest<{
    id: string;
    resourceId: string;
    expiration?: string;
  }>(params.accessToken, {
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
};

export const stopGoogleCalendarWatch = async (
  accessToken: string,
  channelId: string,
  resourceId: string
) => {
  await authedRequest(accessToken, {
    method: "POST",
    url: `${GOOGLE_CALENDAR_API_BASE}/channels/stop`,
    data: {
      id: channelId,
      resourceId,
    },
  });
};

export const insertGoogleEvent = async (accessToken: string, calendarId: string, eventBody: Record<string, unknown>) => {
  return authedRequest<any>(accessToken, {
    method: "POST",
    url: `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`,
    params: { sendUpdates: "none" },
    data: eventBody,
  });
};

export const patchGoogleEvent = async (
  accessToken: string,
  calendarId: string,
  eventId: string,
  eventBody: Record<string, unknown>
) => {
  return authedRequest<any>(accessToken, {
    method: "PATCH",
    url: `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    params: { sendUpdates: "none" },
    data: eventBody,
  });
};

export const deleteGoogleEvent = async (accessToken: string, calendarId: string, eventId: string) => {
  await authedRequest(accessToken, {
    method: "DELETE",
    url: `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    params: { sendUpdates: "none" },
  });
};

export const listGoogleEventsDelta = async (params: {
  accessToken: string;
  calendarId: string;
  syncToken?: string | null;
  pageToken?: string | null;
  maxResults?: number;
  timeMin?: string;
}) => {
  const query: Record<string, string> = {
    singleEvents: "false",
    showDeleted: "true",
    maxResults: String(Math.max(1, Math.min(params.maxResults ?? 500, 2500))),
  };
  if (params.syncToken) query.syncToken = params.syncToken;
  if (params.pageToken) query.pageToken = params.pageToken;
  if (params.timeMin) query.timeMin = params.timeMin;

  return authedRequest<{
    items?: any[];
    nextPageToken?: string;
    nextSyncToken?: string;
  }>(params.accessToken, {
    method: "GET",
    url: `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(params.calendarId)}/events`,
    params: query,
  });
};

export const listGoogleEventsPage = async (params: {
  accessToken: string;
  calendarId: string;
  pageToken?: string | null;
  maxResults?: number;
}) => {
  const query: Record<string, string> = {
    singleEvents: "false",
    showDeleted: "false",
    maxResults: String(Math.max(1, Math.min(params.maxResults ?? 250, 2500))),
  };
  if (params.pageToken) query.pageToken = params.pageToken;

  return authedRequest<{
    items?: any[];
    nextPageToken?: string;
  }>(params.accessToken, {
    method: "GET",
    url: `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(params.calendarId)}/events`,
    params: query,
  });
};

export const fetchGoogleUserEmail = async (accessToken: string) => {
  const data = await authedRequest<{ email?: string }>(accessToken, {
    method: "GET",
    url: "https://www.googleapis.com/oauth2/v2/userinfo",
  });
  return data.email || null;
};
