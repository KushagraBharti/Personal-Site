
import { randomBytes } from "crypto";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  claimSyncJobs,
  completeSyncJob,
  computeRetryDelayInterval,
  enqueueSyncJob,
  failSyncJob,
  getSupabaseAdmin,
} from "./calendarSyncQueueService";
import {
  deleteGoogleEvent,
  ensureTasksCalendar,
  fetchGoogleUserEmail,
  getValidGoogleAccessToken,
  hashChannelToken,
  insertGoogleEvent,
  isDateOnlyIso,
  listGoogleEventsDelta,
  listGoogleEventsPage,
  loadCalendarConnection,
  patchGoogleEvent,
  stopGoogleCalendarWatch,
  taskIdToDeterministicGoogleEventId,
  taskToGoogleEventPayload,
  upsertGoogleCalendarWatch,
} from "./googleCalendarApiService";
import {
  CalendarConnectionPublic,
  CalendarSyncLane,
  CalendarSyncRunMode,
  TrackerGoogleSyncJob,
  TrackerGoogleSyncRun,
  TrackerTaskRow,
} from "../../types/googleCalendar";
import { encryptToBase64 } from "./encryptionService";

const GOOGLE_WEBHOOK_URL = () => {
  const value = process.env.GOOGLE_WEBHOOK_URL;
  if (!value) throw new Error("GOOGLE_WEBHOOK_URL must be set");
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

const createRunId = (mode: CalendarSyncRunMode) =>
  `${mode}_run_${Date.now()}_${randomBytes(5).toString("hex")}`;

const getJobStringPayload = (job: TrackerGoogleSyncJob, key: string) => {
  const raw = (job.payload as Record<string, unknown> | null | undefined)?.[key];
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
};

const getJobRunId = (job: TrackerGoogleSyncJob) => job.run_id || getJobStringPayload(job, "run_id");

const withRunPayload = (base: Record<string, unknown>, runId: string | null) =>
  runId ? { ...base, run_id: runId } : base;

const formatSyncErrorMessage = (error: unknown) => {
  const err = error as any;
  const status = err?.response?.status;
  const tokenErr = err?.response?.data?.error;
  const tokenErrDescription = err?.response?.data?.error_description;
  const apiErrMessage =
    typeof err?.response?.data?.error?.message === "string"
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
  if (apiErrMessage) return apiErrMessage;
  return generic;
};

const getSyncErrorCode = (error: unknown): string | null => {
  const err = error as any;
  const status = err?.response?.status;
  if (typeof status === "number") return String(status);
  const code = err?.code;
  return typeof code === "string" && code.trim() ? code : null;
};

const logSyncJobLifecycle = (input: {
  runId: string | null;
  jobId: number;
  lane: CalendarSyncLane;
  jobType: string;
  taskId: string | null;
  googleEventId: string | null;
  attemptCount: number;
  durationMs: number;
  result: "ok" | "failed";
  errorCode?: string | null;
  errorMessage?: string | null;
}) => {
  console.info(
    "[calendar_sync_job]",
    JSON.stringify({
      run_id: input.runId,
      job_id: input.jobId,
      lane: input.lane,
      job_type: input.jobType,
      task_id: input.taskId,
      google_event_id: input.googleEventId,
      attempt_count: input.attemptCount,
      duration_ms: input.durationMs,
      result: input.result,
      error_code: input.errorCode ?? null,
      error_message: input.errorMessage ?? null,
    })
  );
};

const isAuthFatalSyncError = (error: unknown) => {
  const err = error as any;
  const status = err?.response?.status;
  const googleErrorCode = err?.response?.data?.error;
  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : typeof err?.message === "string"
        ? err.message.toLowerCase()
        : "";

  if (status === 401 || status === 403) return true;
  if (
    status === 400 &&
    typeof googleErrorCode === "string" &&
    ["invalid_grant", "invalid_client", "invalid_request", "unauthorized_client"].includes(
      googleErrorCode
    )
  ) {
    return true;
  }

  return (
    message.includes("no google refresh token available") ||
    message.includes("google calendar connection not found") ||
    message.includes("invalid grant")
  );
};

const isGoogleNotFoundError = (error: unknown) => {
  const err = error as any;
  return err?.response?.status === 404;
};

const isGoogleConflictError = (error: unknown) => {
  const err = error as any;
  return err?.response?.status === 409;
};

const getScopedSyncEnabledListIds = async (supabaseAdmin: SupabaseClient, userId: string) => {
  const { data, error } = await supabaseAdmin
    .from("tracker_task_list_sync_settings")
    .select("list_id")
    .eq("user_id", userId)
    .eq("sync_enabled", true);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => String(row.list_id));
};

const isListSyncEnabled = async (supabaseAdmin: SupabaseClient, userId: string, listId: string) => {
  const { data } = await supabaseAdmin
    .from("tracker_task_list_sync_settings")
    .select("sync_enabled")
    .eq("user_id", userId)
    .eq("list_id", listId)
    .maybeSingle();
  return !!data?.sync_enabled;
};

const getTaskById = async (supabaseAdmin: SupabaseClient, userId: string, taskId: string) => {
  const { data } = await supabaseAdmin
    .from("tracker_tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("id", taskId)
    .maybeSingle();
  return (data as TrackerTaskRow | null) ?? null;
};

const getLinkByTaskId = async (supabaseAdmin: SupabaseClient, userId: string, taskId: string) => {
  const { data } = await supabaseAdmin
    .from("tracker_task_google_event_links")
    .select("*")
    .eq("user_id", userId)
    .eq("task_id", taskId)
    .maybeSingle();
  return data as any | null;
};

const getLinkByEvent = async (
  supabaseAdmin: SupabaseClient,
  userId: string,
  calendarId: string,
  googleEventId: string
) => {
  const { data } = await supabaseAdmin
    .from("tracker_task_google_event_links")
    .select("*")
    .eq("user_id", userId)
    .eq("calendar_id", calendarId)
    .eq("google_event_id", googleEventId)
    .maybeSingle();
  return data as any | null;
};

const upsertLink = async (
  supabaseAdmin: SupabaseClient,
  input: {
    userId: string;
    taskId: string;
    calendarId: string;
    googleEventId: string;
    etag?: string | null;
    googleUpdatedAt?: string | null;
    lastSyncedTaskUpdatedAt?: string | null;
    lastSyncSource?: "app" | "google" | "system";
    isDeleted?: boolean;
  }
) => {
  const { error } = await supabaseAdmin.from("tracker_task_google_event_links").upsert(
    {
      user_id: input.userId,
      task_id: input.taskId,
      calendar_id: input.calendarId,
      google_event_id: input.googleEventId,
      google_event_etag: input.etag ?? null,
      google_event_updated_at: input.googleUpdatedAt ?? null,
      last_synced_task_updated_at: input.lastSyncedTaskUpdatedAt ?? null,
      last_sync_source: input.lastSyncSource ?? "system",
      is_deleted: input.isDeleted ?? false,
    },
    { onConflict: "task_id" }
  );
  if (error) throw new Error(error.message);
};

const setConnectionHealth = async (
  supabaseAdmin: SupabaseClient,
  userId: string,
  values: Partial<Pick<CalendarConnectionPublic, "status" | "last_error" | "last_full_sync_at" | "last_incremental_sync_at">>
) => {
  const { error } = await supabaseAdmin
    .from("tracker_google_calendar_connections_public")
    .update(values)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
};

const shouldSyncTask = (task: TrackerTaskRow, listEnabled: boolean) =>
  listEnabled && !task.is_completed && !!task.due_at;
const createSyncRun = async (supabaseAdmin: SupabaseClient, userId: string, mode: CalendarSyncRunMode) => {
  const runId = createRunId(mode);
  const { error } = await supabaseAdmin.from("tracker_google_sync_runs").insert({
    id: runId,
    user_id: userId,
    mode,
    status: "queued",
    started_at: nowIso(),
    queued_jobs: 0,
    processed_jobs: 0,
    failed_jobs: 0,
  });
  if (error) throw new Error(error.message);
  return runId;
};

const getSyncRunById = async (supabaseAdmin: SupabaseClient, userId: string, runId: string) => {
  const { data, error } = await supabaseAdmin
    .from("tracker_google_sync_runs")
    .select("*")
    .eq("id", runId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as TrackerGoogleSyncRun | null) ?? null;
};

const countRunJobs = async (
  supabaseAdmin: SupabaseClient,
  runId: string,
  statuses?: Array<"pending" | "running" | "done" | "failed" | "dead">
) => {
  let query = supabaseAdmin
    .from("tracker_google_sync_jobs")
    .select("id", { count: "exact", head: true })
    .eq("run_id", runId);
  if (statuses && statuses.length > 0) query = query.in("status", statuses);
  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
};

const refreshSyncRunState = async (supabaseAdmin: SupabaseClient, runId: string) => {
  const [total, pending, running, doneCount, failedCount] = await Promise.all([
    countRunJobs(supabaseAdmin, runId),
    countRunJobs(supabaseAdmin, runId, ["pending"]),
    countRunJobs(supabaseAdmin, runId, ["running"]),
    countRunJobs(supabaseAdmin, runId, ["done"]),
    countRunJobs(supabaseAdmin, runId, ["failed", "dead"]),
  ]);

  const finished = total > 0 && pending === 0 && running === 0;
  const status = finished ? (failedCount > 0 ? "failed" : "done") : "running";

  const { error } = await supabaseAdmin
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
  if (error) throw new Error(error.message);
};

const enqueueTaskUpsert = async (input: {
  supabaseAdmin: SupabaseClient;
  userId: string;
  taskId: string;
  listId: string;
  lane: CalendarSyncLane;
  runId?: string | null;
  priority: number;
  source: string;
  dedupeKey: string;
}) => {
  await enqueueSyncJob(input.supabaseAdmin, {
    userId: input.userId,
    runId: input.runId ?? null,
    lane: input.lane,
    taskId: input.taskId,
    listId: input.listId,
    jobType: "task_upsert",
    source: input.source,
    priority: input.priority,
    payload: withRunPayload({ source: input.source }, input.runId ?? null),
    dedupeKey: input.dedupeKey,
  });
};

const enqueueTaskDelete = async (input: {
  supabaseAdmin: SupabaseClient;
  userId: string;
  lane: CalendarSyncLane;
  runId?: string | null;
  taskId?: string | null;
  listId?: string | null;
  googleEventId: string;
  calendarId?: string | null;
  source: string;
  dedupeKey: string;
  priority: number;
}) => {
  await enqueueSyncJob(input.supabaseAdmin, {
    userId: input.userId,
    runId: input.runId ?? null,
    lane: input.lane,
    taskId: input.taskId ?? null,
    listId: input.listId ?? null,
    googleEventId: input.googleEventId,
    jobType: "task_delete",
    source: input.source,
    priority: input.priority,
    payload: withRunPayload(
      {
        source: input.source,
        google_event_id: input.googleEventId,
        calendar_id: input.calendarId ?? null,
      },
      input.runId ?? null
    ),
    dedupeKey: input.dedupeKey,
  });
};

const processTaskUpsertJob = async (supabaseAdmin: SupabaseClient, job: TrackerGoogleSyncJob) => {
  if (!job.task_id) return;
  const task = await getTaskById(supabaseAdmin, job.user_id, job.task_id);
  if (!task) return;

  const listEnabled = await isListSyncEnabled(supabaseAdmin, job.user_id, task.list_id);
  const { accessToken, publicRow } = await getValidGoogleAccessToken(supabaseAdmin, job.user_id);
  const calendarId = publicRow.selected_calendar_id;
  if (!calendarId) return;

  const existingLink = await getLinkByTaskId(supabaseAdmin, job.user_id, task.id);

  if (!shouldSyncTask(task, listEnabled)) {
    if (existingLink && !existingLink.is_deleted) {
      try {
        await deleteGoogleEvent(accessToken, existingLink.calendar_id, existingLink.google_event_id);
      } catch {
        // best effort
      }
      await upsertLink(supabaseAdmin, {
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

  const eventPayload = taskToGoogleEventPayload(task);
  if (!eventPayload.start) return;

  if (existingLink && !existingLink.is_deleted) {
    try {
      const patched = await patchGoogleEvent(
        accessToken,
        existingLink.calendar_id,
        existingLink.google_event_id,
        eventPayload
      );
      await upsertLink(supabaseAdmin, {
        userId: job.user_id,
        taskId: task.id,
        calendarId: existingLink.calendar_id,
        googleEventId: existingLink.google_event_id,
        etag: patched.etag ?? null,
        googleUpdatedAt: patched.updated ?? nowIso(),
        lastSyncedTaskUpdatedAt: task.updated_at,
        lastSyncSource: "app",
        isDeleted: false,
      });
      return;
    } catch (error) {
      if (!isGoogleNotFoundError(error)) throw error;
    }
  }

  const deterministicEventId = taskIdToDeterministicGoogleEventId(task.id);
  try {
    const inserted = await insertGoogleEvent(accessToken, calendarId, {
      ...eventPayload,
      id: deterministicEventId,
    });
    await upsertLink(supabaseAdmin, {
      userId: job.user_id,
      taskId: task.id,
      calendarId,
      googleEventId: inserted.id,
      etag: inserted.etag ?? null,
      googleUpdatedAt: inserted.updated ?? nowIso(),
      lastSyncedTaskUpdatedAt: task.updated_at,
      lastSyncSource: "app",
      isDeleted: false,
    });
    return;
  } catch (error) {
    if (!isGoogleConflictError(error)) throw error;
  }

  const patched = await patchGoogleEvent(accessToken, calendarId, deterministicEventId, eventPayload);
  await upsertLink(supabaseAdmin, {
    userId: job.user_id,
    taskId: task.id,
    calendarId,
    googleEventId: deterministicEventId,
    etag: patched.etag ?? null,
    googleUpdatedAt: patched.updated ?? nowIso(),
    lastSyncedTaskUpdatedAt: task.updated_at,
    lastSyncSource: "app",
    isDeleted: false,
  });
};

const processTaskDeleteJob = async (supabaseAdmin: SupabaseClient, job: TrackerGoogleSyncJob) => {
  const payloadEventId = getJobStringPayload(job, "google_event_id");
  const payloadCalendarId = getJobStringPayload(job, "calendar_id");
  let googleEventId = job.google_event_id || payloadEventId || null;
  let calendarId = payloadCalendarId || null;
  let link: any | null = null;

  if (job.task_id) {
    link = await getLinkByTaskId(supabaseAdmin, job.user_id, job.task_id);
    if (!googleEventId && link?.google_event_id) googleEventId = String(link.google_event_id);
    if (!calendarId && link?.calendar_id) calendarId = String(link.calendar_id);
  }

  if (!googleEventId) return;

  const { accessToken, publicRow } = await getValidGoogleAccessToken(supabaseAdmin, job.user_id);
  if (!calendarId) calendarId = publicRow.selected_calendar_id;
  if (!calendarId) return;

  try {
    await deleteGoogleEvent(accessToken, calendarId, googleEventId);
  } catch (error) {
    if (!isGoogleNotFoundError(error)) throw error;
  }

  if (!link && job.task_id) {
    link = await getLinkByTaskId(supabaseAdmin, job.user_id, job.task_id);
  }
  if (!link) {
    link = await getLinkByEvent(supabaseAdmin, job.user_id, calendarId, googleEventId);
  }

  if (link?.id) {
    const { error } = await supabaseAdmin
      .from("tracker_task_google_event_links")
      .update({
        is_deleted: true,
        last_sync_source: "app",
        last_synced_task_updated_at: nowIso(),
      })
      .eq("id", link.id);
    if (error) throw new Error(error.message);
  }
};
const processReconcileAppPageJob = async (supabaseAdmin: SupabaseClient, job: TrackerGoogleSyncJob) => {
  const runId = getJobRunId(job);
  const cursorAfter = getJobStringPayload(job, "cursor_after");
  const listIdFromPayload = getJobStringPayload(job, "list_id");
  const listId = job.list_id || listIdFromPayload || null;

  const enabledListIds = await getScopedSyncEnabledListIds(supabaseAdmin, job.user_id);
  if (enabledListIds.length === 0) return;

  let query = supabaseAdmin
    .from("tracker_tasks")
    .select("id,list_id,updated_at,due_at,is_completed")
    .eq("user_id", job.user_id)
    .in("list_id", enabledListIds)
    .eq("is_completed", false)
    .not("due_at", "is", null)
    .order("id", { ascending: true })
    .limit(RECONCILE_APP_PAGE_SIZE);

  if (listId) query = query.eq("list_id", listId);
  if (cursorAfter) query = query.gt("id", cursorAfter);

  const { data: rows, error } = await query;
  if (error) throw new Error(error.message);

  const page = rows ?? [];
  for (const row of page) {
    await enqueueTaskUpsert({
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
    await enqueueSyncJob(supabaseAdmin, {
      userId: job.user_id,
      runId,
      lane: job.lane,
      listId,
      jobType: "reconcile_app_page",
      source: "reconcile_app_page_cont",
      priority: PRIORITY_RECONCILE_APP,
      payload: withRunPayload(
        {
          source: "reconcile_app_page_cont",
          cursor_after: lastTaskId,
          list_id: listId,
        },
        runId
      ),
      dedupeKey: `reconcile:app-page:${runId || "system"}:${listId || "all"}:${lastTaskId}`,
    });
  }
};

const processReconcileGooglePageJob = async (supabaseAdmin: SupabaseClient, job: TrackerGoogleSyncJob) => {
  const runId = getJobRunId(job);
  const pageToken = getJobStringPayload(job, "page_token");

  const { accessToken, publicRow } = await getValidGoogleAccessToken(supabaseAdmin, job.user_id);
  const calendarId = publicRow.selected_calendar_id;
  if (!calendarId) return;

  const page = await listGoogleEventsPage({
    accessToken,
    calendarId,
    pageToken,
    maxResults: RECONCILE_GOOGLE_PAGE_SIZE,
  });

  const events = (page.items ?? []).filter((event) => !!event?.id);
  const referencedTaskIds = Array.from(
    new Set(
      events
        .map((event) => event?.extendedProperties?.private?.tracker_task_id)
        .filter((id) => typeof id === "string" && id.trim()) as string[]
    )
  );

  const enabledListIds = new Set(await getScopedSyncEnabledListIds(supabaseAdmin, job.user_id));
  const scopedTasksById = new Map<string, TrackerTaskRow>();

  if (referencedTaskIds.length > 0) {
    const { data: tasks, error } = await supabaseAdmin
      .from("tracker_tasks")
      .select("*")
      .eq("user_id", job.user_id)
      .in("id", referencedTaskIds);
    if (error) throw new Error(error.message);

    for (const task of tasks ?? []) {
      const typed = task as TrackerTaskRow;
      if (!enabledListIds.has(typed.list_id)) continue;
      if (typed.is_completed || !typed.due_at) continue;
      scopedTasksById.set(typed.id, typed);
    }
  }

  for (const event of events) {
    const googleEventId = String(event.id);
    const taskIdRaw = event?.extendedProperties?.private?.tracker_task_id;
    const trackerTaskId = typeof taskIdRaw === "string" && taskIdRaw.trim() ? taskIdRaw.trim() : null;

    if (!trackerTaskId) {
      await enqueueTaskDelete({
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
      await enqueueTaskDelete({
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

    await upsertLink(supabaseAdmin, {
      userId: job.user_id,
      taskId: scopedTask.id,
      calendarId,
      googleEventId,
      etag: event.etag ?? null,
      googleUpdatedAt: event.updated ?? null,
      lastSyncedTaskUpdatedAt: scopedTask.updated_at,
      lastSyncSource: "system",
      isDeleted: false,
    });

    await enqueueTaskUpsert({
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
    await enqueueSyncJob(supabaseAdmin, {
      userId: job.user_id,
      runId,
      lane: job.lane,
      jobType: "reconcile_google_page",
      source: "reconcile_google_page_cont",
      priority: PRIORITY_RECONCILE_GOOGLE,
      payload: withRunPayload(
        {
          source: "reconcile_google_page_cont",
          page_token: page.nextPageToken,
        },
        runId
      ),
      dedupeKey: `reconcile:google-page:${runId || "system"}:${page.nextPageToken}`,
    });
  }
};

const processHardResetClearPageJob = async (supabaseAdmin: SupabaseClient, job: TrackerGoogleSyncJob) => {
  const runId = getJobRunId(job);
  if (!runId) throw new Error("Hard reset clear job missing run_id");

  const { accessToken, publicRow } = await getValidGoogleAccessToken(supabaseAdmin, job.user_id);
  const calendarId = publicRow.selected_calendar_id;
  if (!calendarId) return;

  const page = await listGoogleEventsPage({
    accessToken,
    calendarId,
    maxResults: HARD_RESET_CLEAR_PAGE_SIZE,
  });

  const events = (page.items ?? []).filter((event) => !!event?.id);

  if (events.length === 0) {
    await enqueueSyncJob(supabaseAdmin, {
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

  const eventIds: string[] = [];
  for (const event of events) {
    const eventId = String(event.id);
    eventIds.push(eventId);
    try {
      await deleteGoogleEvent(accessToken, calendarId, eventId);
    } catch (error) {
      if (!isGoogleNotFoundError(error)) throw error;
    }
  }

  if (eventIds.length > 0) {
    await supabaseAdmin
      .from("tracker_task_google_event_links")
      .update({ is_deleted: true, last_sync_source: "system" })
      .eq("user_id", job.user_id)
      .eq("calendar_id", calendarId)
      .in("google_event_id", eventIds);
  }

  await enqueueSyncJob(supabaseAdmin, {
    userId: job.user_id,
    runId,
    lane: "rebuild",
    jobType: "hard_reset_clear_page",
    source: "rebuild_clear_cont",
    priority: PRIORITY_REBUILD_CLEAR,
    payload: withRunPayload({ source: "rebuild_clear_cont" }, runId),
    dedupeKey: `rebuild:clear:${runId}:${randomBytes(4).toString("hex")}`,
  });
};

const processInboundDeltaJob = async (supabaseAdmin: SupabaseClient, job: TrackerGoogleSyncJob) => {
  const { accessToken, publicRow, secretsRow } = await getValidGoogleAccessToken(supabaseAdmin, job.user_id);
  const calendarId = publicRow.selected_calendar_id;
  if (!calendarId) return;

  const pageToken = getJobStringPayload(job, "page_token");
  const syncTokenFromPayload = getJobStringPayload(job, "sync_token");
  const syncToken = syncTokenFromPayload || secretsRow.sync_token || null;

  let delta;
  try {
    delta = await listGoogleEventsDelta({
      accessToken,
      calendarId,
      syncToken,
      pageToken,
      maxResults: INBOUND_DELTA_PAGE_SIZE,
      timeMin: syncToken ? undefined : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (err: any) {
    const status = err?.response?.status;
    if (status === 410 && syncToken) {
      const { error } = await supabaseAdmin
        .from("tracker_google_calendar_connections_secrets")
        .update({ sync_token: null })
        .eq("id", secretsRow.id);
      if (error) throw new Error(error.message);
      return;
    }
    throw err;
  }

  const enabledListIds = new Set(await getScopedSyncEnabledListIds(supabaseAdmin, job.user_id));

  for (const event of delta.items ?? []) {
    if (!event?.id || event.status !== "cancelled") continue;
    const taskIdRaw = event?.extendedProperties?.private?.tracker_task_id;
    const taskId = typeof taskIdRaw === "string" && taskIdRaw.trim() ? taskIdRaw.trim() : null;
    if (!taskId) continue;

    const task = await getTaskById(supabaseAdmin, job.user_id, taskId);
    if (!task) continue;
    if (!enabledListIds.has(task.list_id)) continue;
    if (task.is_completed || !task.due_at) continue;

    await enqueueTaskUpsert({
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
    await enqueueSyncJob(supabaseAdmin, {
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

  const { error: secretErr } = await supabaseAdmin
    .from("tracker_google_calendar_connections_secrets")
    .update({
      sync_token: delta.nextSyncToken ?? syncToken,
    })
    .eq("id", secretsRow.id);
  if (secretErr) throw new Error(secretErr.message);

  await setConnectionHealth(supabaseAdmin, job.user_id, {
    last_incremental_sync_at: nowIso(),
    status: "connected",
    last_error: null,
  });
};

const renewWatchForUser = async (supabaseAdmin: SupabaseClient, userId: string) => {
  const { accessToken, publicRow, secretsRow } = await getValidGoogleAccessToken(supabaseAdmin, userId);
  const calendarId = publicRow.selected_calendar_id;
  if (!calendarId) return;

  if (secretsRow.channel_id && secretsRow.channel_resource_id) {
    try {
      await stopGoogleCalendarWatch(accessToken, secretsRow.channel_id, secretsRow.channel_resource_id);
    } catch {
      // best effort
    }
  }

  const rawChannelToken = randomBytes(32).toString("hex");
  const watch = await upsertGoogleCalendarWatch({
    accessToken,
    calendarId,
    webhookUrl: GOOGLE_WEBHOOK_URL(),
    rawChannelToken,
  });

  const { error } = await supabaseAdmin
    .from("tracker_google_calendar_connections_secrets")
    .update({
      channel_id: watch.channelId,
      channel_resource_id: watch.resourceId,
      channel_token_hash: hashChannelToken(rawChannelToken),
      channel_expiration: watch.expiration,
    })
    .eq("id", secretsRow.id);
  if (error) throw new Error(error.message);
};
export const renewCalendarWatchForUser = async (supabaseAdmin: SupabaseClient, userId: string) => {
  await renewWatchForUser(supabaseAdmin, userId);
};

const processRenewWatchJob = async (supabaseAdmin: SupabaseClient, job: TrackerGoogleSyncJob) => {
  await renewWatchForUser(supabaseAdmin, job.user_id);
};

const processOneJob = async (supabaseAdmin: SupabaseClient, job: TrackerGoogleSyncJob) => {
  if (job.job_type === "task_upsert") return processTaskUpsertJob(supabaseAdmin, job);
  if (job.job_type === "task_delete") return processTaskDeleteJob(supabaseAdmin, job);
  if (job.job_type === "reconcile_app_page") return processReconcileAppPageJob(supabaseAdmin, job);
  if (job.job_type === "reconcile_google_page") return processReconcileGooglePageJob(supabaseAdmin, job);
  if (job.job_type === "hard_reset_clear_page") return processHardResetClearPageJob(supabaseAdmin, job);

  // Legacy compatibility while old jobs drain.
  if (job.job_type === "full_backfill") return processReconcileAppPageJob(supabaseAdmin, job);
  if (job.job_type === "inbound_delta") return processInboundDeltaJob(supabaseAdmin, job);

  if (job.job_type === "renew_watch") return processRenewWatchJob(supabaseAdmin, job);
};

export const processCalendarSyncJobs = async (input?: {
  userId?: string;
  batchSize?: number;
  lanes?: CalendarSyncLane[];
}) => {
  const supabaseAdmin = getSupabaseAdmin();
  const jobs = await claimSyncJobs(
    supabaseAdmin,
    input?.batchSize ?? 25,
    input?.userId,
    input?.lanes
  );

  const touchedRunIds = new Set<string>();
  const results: Array<{ id: number; ok: boolean; error?: string; lane: CalendarSyncLane }> = [];

  for (const job of jobs) {
    const runId = getJobRunId(job);
    const startedAt = Date.now();
    try {
      await processOneJob(supabaseAdmin, job);
      await completeSyncJob(supabaseAdmin, job.id);
      await setConnectionHealth(supabaseAdmin, job.user_id, {
        status: "connected",
        last_error: null,
      }).catch(() => {});
      if (runId) touchedRunIds.add(runId);
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
    } catch (error) {
      const message = formatSyncErrorMessage(error);
      const errorCode = getSyncErrorCode(error);
      const retryDelay = computeRetryDelayInterval(job.attempt_count + 1);
      const authFatal = isAuthFatalSyncError(error);
      try {
        await failSyncJob(supabaseAdmin, job.id, message, retryDelay);
      } catch {
        // suppress
      }
      await setConnectionHealth(
        supabaseAdmin,
        job.user_id,
        authFatal ? { status: "error", last_error: message } : { last_error: message }
      ).catch(() => {});
      if (runId) {
        touchedRunIds.add(runId);
        try {
          await supabaseAdmin
            .from("tracker_google_sync_runs")
            .update({ last_error: message, updated_at: nowIso() })
            .eq("id", runId);
        } catch {
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
    await refreshSyncRunState(supabaseAdmin, runId).catch(() => {});
  }

  return results;
};

export const queueFullBackfill = async (
  supabaseAdmin: SupabaseClient,
  userId: string,
  listId?: string,
  options?: { runId?: string | null; source?: string }
) => {
  const runId = options?.runId?.trim() || null;
  const source = options?.source || "manual_or_connect";
  await enqueueSyncJob(supabaseAdmin, {
    userId,
    runId,
    lane: runId ? "reconcile" : "system",
    listId: listId ?? null,
    jobType: "reconcile_app_page",
    source,
    priority: PRIORITY_RECONCILE_APP,
    payload: withRunPayload({ source, list_id: listId ?? null }, runId),
    dedupeKey: runId
      ? `reconcile:app-seed:${runId}:${listId || "all"}`
      : `system:app-seed:${userId}:${listId || "all"}`,
  });
};

export const queueReconcileRunForUser = async (supabaseAdmin: SupabaseClient, userId: string) => {
  const runId = await createSyncRun(supabaseAdmin, userId, "reconcile");

  await enqueueSyncJob(supabaseAdmin, {
    userId,
    runId,
    lane: "reconcile",
    jobType: "reconcile_app_page",
    source: "manual_sync_now",
    priority: PRIORITY_RECONCILE_APP,
    payload: withRunPayload({ source: "manual_sync_now" }, runId),
    dedupeKey: `reconcile:app-seed:${runId}`,
  });

  await enqueueSyncJob(supabaseAdmin, {
    userId,
    runId,
    lane: "reconcile",
    jobType: "reconcile_google_page",
    source: "manual_sync_now",
    priority: PRIORITY_RECONCILE_GOOGLE,
    payload: withRunPayload({ source: "manual_sync_now" }, runId),
    dedupeKey: `reconcile:google-seed:${runId}`,
  });

  await refreshSyncRunState(supabaseAdmin, runId).catch(() => {});
  return runId;
};

export const queueRebuildRunForUser = async (supabaseAdmin: SupabaseClient, userId: string) => {
  const runId = await createSyncRun(supabaseAdmin, userId, "rebuild");

  await enqueueSyncJob(supabaseAdmin, {
    userId,
    runId,
    lane: "rebuild",
    jobType: "hard_reset_clear_page",
    source: "manual_rebuild",
    priority: PRIORITY_REBUILD_CLEAR,
    payload: withRunPayload({ source: "manual_rebuild" }, runId),
    dedupeKey: `rebuild:clear-seed:${runId}`,
  });

  await refreshSyncRunState(supabaseAdmin, runId).catch(() => {});
  return runId;
};

export const queueManualSyncForUser = async (supabaseAdmin: SupabaseClient, userId: string) => {
  return queueReconcileRunForUser(supabaseAdmin, userId);
};

export const queueLivePumpForUser = async (supabaseAdmin: SupabaseClient, userId: string) => {
  const results = await processCalendarSyncJobs({
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
};
export const upsertGoogleConnectionFromOAuth = async (params: {
  supabaseAdmin: SupabaseClient;
  userId: string;
  accessToken: string;
  refreshToken?: string;
  expiresInSeconds: number;
}) => {
  const { supabaseAdmin, userId } = params;
  const existing = await loadCalendarConnection(supabaseAdmin, userId);
  const tasksCalendar = await ensureTasksCalendar({
    accessToken: params.accessToken,
    preferredCalendarId: existing.publicRow?.selected_calendar_id || null,
  });
  const googleEmail = await fetchGoogleUserEmail(params.accessToken);

  const existingRefreshEncrypted = existing.secretsRow?.refresh_token_encrypted || null;
  const refreshTokenEncrypted = params.refreshToken
    ? encryptToBase64(params.refreshToken)
    : existingRefreshEncrypted;
  if (!refreshTokenEncrypted) {
    throw new Error("No Google refresh token available. Reconnect with consent.");
  }

  const expiresAtIso = new Date(Date.now() + params.expiresInSeconds * 1000).toISOString();

  const { data: connectionPublic, error: publicErr } = await supabaseAdmin
    .from("tracker_google_calendar_connections_public")
    .upsert(
      {
        user_id: userId,
        status: "connected",
        google_email: googleEmail,
        selected_calendar_id: tasksCalendar.id,
        selected_calendar_summary: tasksCalendar.summary,
        last_error: null,
      },
      { onConflict: "user_id" }
    )
    .select("*")
    .single();
  if (publicErr || !connectionPublic) {
    throw new Error(publicErr?.message || "Failed to persist Google connection");
  }

  const { data: secrets, error: secErr } = await supabaseAdmin
    .from("tracker_google_calendar_connections_secrets")
    .upsert(
      {
        user_id: userId,
        connection_public_id: connectionPublic.id,
        refresh_token_encrypted: refreshTokenEncrypted,
        access_token_encrypted: encryptToBase64(params.accessToken),
        access_token_expires_at: expiresAtIso,
      },
      { onConflict: "user_id" }
    )
    .select("*")
    .single();
  if (secErr || !secrets) {
    throw new Error(secErr?.message || "Failed to persist Google connection secrets");
  }

  await renewWatchForUser(supabaseAdmin, userId);
  await queueFullBackfill(supabaseAdmin, userId, undefined, { source: "oauth_connect_seed" });

  return {
    connectionPublic: connectionPublic as CalendarConnectionPublic,
    calendar: tasksCalendar,
  };
};

export const disconnectGoogleCalendarForUser = async (supabaseAdmin: SupabaseClient, userId: string) => {
  const { publicRow, secretsRow } = await loadCalendarConnection(supabaseAdmin, userId);
  if (!publicRow || !secretsRow) return;

  try {
    if (secretsRow.channel_id && secretsRow.channel_resource_id) {
      const { accessToken } = await getValidGoogleAccessToken(supabaseAdmin, userId);
      await stopGoogleCalendarWatch(accessToken, secretsRow.channel_id, secretsRow.channel_resource_id);
    }
  } catch {
    // best effort
  }

  await supabaseAdmin
    .from("tracker_google_calendar_connections_public")
    .update({
      status: "disconnected",
      selected_calendar_id: null,
      selected_calendar_summary: null,
      last_error: null,
    })
    .eq("user_id", userId);

  await supabaseAdmin
    .from("tracker_google_calendar_connections_secrets")
    .delete()
    .eq("user_id", userId);

  await supabaseAdmin.from("tracker_task_google_event_links").delete().eq("user_id", userId);
};

export const renewExpiringCalendarWatches = async (input?: { userId?: string }) => {
  const supabaseAdmin = getSupabaseAdmin();
  let query = supabaseAdmin
    .from("tracker_google_calendar_connections_secrets")
    .select("user_id, channel_expiration");
  if (input?.userId) query = query.eq("user_id", input.userId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const horizon = Date.now() + 24 * 60 * 60 * 1000;
  const usersToRenew = (data ?? [])
    .filter((row: any) => !row.channel_expiration || new Date(row.channel_expiration).getTime() < horizon)
    .map((row: any) => row.user_id as string);

  const results: Array<{ userId: string; ok: boolean; error?: string }> = [];
  for (const userId of usersToRenew) {
    try {
      await renewWatchForUser(supabaseAdmin, userId);
      await setConnectionHealth(supabaseAdmin, userId, {
        status: "connected",
        last_error: null,
      }).catch(() => {});
      results.push({ userId, ok: true });
    } catch (err) {
      const message = formatSyncErrorMessage(err);
      const authFatal = isAuthFatalSyncError(err);
      await setConnectionHealth(
        supabaseAdmin,
        userId,
        authFatal ? { status: "error", last_error: message } : { last_error: message }
      ).catch(() => {});
      results.push({ userId, ok: false, error: message });
    }
  }
  return results;
};

export const listUserSyncEnabledLists = async (supabaseAdmin: SupabaseClient, userId: string) => {
  const { data, error } = await supabaseAdmin
    .from("tracker_task_list_sync_settings")
    .select("list_id, sync_enabled")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return (data ?? []) as Array<{ list_id: string; sync_enabled: boolean }>;
};

export const upsertListSyncSetting = async (
  supabaseAdmin: SupabaseClient,
  userId: string,
  listId: string,
  syncEnabled: boolean
) => {
  const { error } = await supabaseAdmin
    .from("tracker_task_list_sync_settings")
    .upsert(
      {
        user_id: userId,
        list_id: listId,
        sync_enabled: syncEnabled,
      },
      { onConflict: "user_id,list_id" }
    );
  if (error) throw new Error(error.message);
};

export const getCalendarStatusForUser = async (supabaseAdmin: SupabaseClient, userId: string) => {
  const { publicRow, secretsRow } = await loadCalendarConnection(supabaseAdmin, userId);
  const listSettings = await listUserSyncEnabledLists(supabaseAdmin, userId).catch(() => []);

  let connectionRow = publicRow;
  const canAutoRepairBinding =
    !!connectionRow && !connectionRow.selected_calendar_id && !!secretsRow?.refresh_token_encrypted;

  if (canAutoRepairBinding) {
    try {
      const { accessToken } = await getValidGoogleAccessToken(supabaseAdmin, userId);
      const repairedCalendar = await ensureTasksCalendar({
        accessToken,
        preferredCalendarId: null,
      });

      const { data: repairedRow, error: repairedErr } = await supabaseAdmin
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
        connectionRow = repairedRow as CalendarConnectionPublic;
      }
    } catch (error) {
      const message = formatSyncErrorMessage(error);
      await setConnectionHealth(supabaseAdmin, userId, { last_error: message }).catch(() => {});
    }
  }

  return {
    connected: !!connectionRow && !!secretsRow?.refresh_token_encrypted,
    connection: connectionRow,
    watch_expires_at: secretsRow?.channel_expiration || null,
    list_sync_settings: listSettings,
  };
};

export const getSyncProgressForRun = async (
  supabaseAdmin: SupabaseClient,
  userId: string,
  runId: string
) => {
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
      failures: [] as Array<{ id: number; error: string }>,
    };
  }

  const run = await getSyncRunById(supabaseAdmin, userId, normalizedRunId);
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
      failures: [] as Array<{ id: number; error: string }>,
    };
  }

  await refreshSyncRunState(supabaseAdmin, normalizedRunId).catch(() => {});
  const [total, pending, running, failuresRes, updatedRun] = await Promise.all([
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

  const failedRows = (failuresRes.data ?? []) as Array<{ id: number; last_error: string | null }>;
  const processed = updatedRun?.processed_jobs ?? run.processed_jobs;
  const failed = updatedRun?.failed_jobs ?? run.failed_jobs;

  return {
    run_id: normalizedRunId,
    mode: updatedRun?.mode ?? run.mode,
    status: updatedRun?.status ?? run.status,
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
};

export const getSyncRunDebug = async (
  supabaseAdmin: SupabaseClient,
  userId: string,
  runId: string
) => {
  const normalizedRunId = runId.trim();
  const run = await getSyncRunById(supabaseAdmin, userId, normalizedRunId);
  if (!run) return null;

  const [{ data: rows }, { data: failures }] = await Promise.all([
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

  const counts: Record<string, { total: number; failed: number; done: number; pending: number; running: number }> = {};
  for (const row of rows ?? []) {
    const key = String((row as any).job_type || "unknown");
    if (!counts[key]) counts[key] = { total: 0, failed: 0, done: 0, pending: 0, running: 0 };
    counts[key].total += 1;
    const status = String((row as any).status || "");
    if (status === "failed" || status === "dead") counts[key].failed += 1;
    if (status === "done") counts[key].done += 1;
    if (status === "pending") counts[key].pending += 1;
    if (status === "running") counts[key].running += 1;
  }

  return {
    run,
    counts_by_job_type: counts,
    failures: failures ?? [],
  };
};

export const inferLanesForRunMode = (mode: string | null | undefined): CalendarSyncLane[] => {
  if (mode === "reconcile") return ["reconcile"];
  if (mode === "rebuild") return ["rebuild"];
  if (mode === "live") return ["live"];
  return ["reconcile", "rebuild"];
};

export const normalizeDueAtForSync = (isoValue: string | null) => {
  if (!isoValue) return null;
  const parsed = new Date(isoValue);
  if (Number.isNaN(parsed.getTime())) return null;
  if (isDateOnlyIso(isoValue)) {
    parsed.setMilliseconds(777);
    return parsed.toISOString();
  }
  parsed.setMilliseconds(0);
  return parsed.toISOString();
};
