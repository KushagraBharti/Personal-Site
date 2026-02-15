import { randomBytes } from "crypto";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  completeSyncJob,
  computeRetryDelayInterval,
  enqueueSyncJob,
  failSyncJob,
  getSupabaseAdmin,
  claimSyncJobs,
} from "./calendarSyncQueueService";
import {
  deleteGoogleEvent,
  ensureTasksCalendar,
  fetchGoogleUserEmail,
  getValidGoogleAccessToken,
  googleEventToTaskDueAtIso,
  hashChannelToken,
  insertGoogleEvent,
  isDateOnlyIso,
  listGoogleEventsDelta,
  loadCalendarConnection,
  patchGoogleEvent,
  stopGoogleCalendarWatch,
  taskToGoogleEventPayload,
  upsertGoogleCalendarWatch,
} from "./googleCalendarApiService";
import { CalendarConnectionPublic, TrackerGoogleSyncJob, TrackerTaskRow } from "../../types/googleCalendar";
import { encryptToBase64 } from "./encryptionService";

const GOOGLE_WEBHOOK_URL = () => {
  const value = process.env.GOOGLE_WEBHOOK_URL;
  if (!value) throw new Error("GOOGLE_WEBHOOK_URL must be set");
  return value;
};

const nowIso = () => new Date().toISOString();

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

const shouldSyncTask = (task: TrackerTaskRow) => !task.is_completed && !!task.due_at;

const processTaskUpsertJob = async (supabaseAdmin: SupabaseClient, job: TrackerGoogleSyncJob) => {
  if (!job.task_id) return;
  const task = await getTaskById(supabaseAdmin, job.user_id, job.task_id);
  if (!task) return;

  const listEnabled = await isListSyncEnabled(supabaseAdmin, job.user_id, task.list_id);
  if (!listEnabled) return;

  const { accessToken, publicRow } = await getValidGoogleAccessToken(supabaseAdmin, job.user_id);
  const calendarId = publicRow.selected_calendar_id;
  if (!calendarId) return;

  const existingLink = await getLinkByTaskId(supabaseAdmin, job.user_id, task.id);
  if (!shouldSyncTask(task)) {
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

  if (
    existingLink &&
    existingLink.last_sync_source === "google" &&
    existingLink.last_synced_task_updated_at &&
    new Date(existingLink.last_synced_task_updated_at).getTime() >= new Date(task.updated_at).getTime()
  ) {
    return;
  }

  const eventPayload = taskToGoogleEventPayload(task);
  if (!eventPayload.start) return;

  if (existingLink && !existingLink.is_deleted) {
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
  }

  const inserted = await insertGoogleEvent(accessToken, calendarId, eventPayload);
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
};

const processTaskDeleteJob = async (supabaseAdmin: SupabaseClient, job: TrackerGoogleSyncJob) => {
  if (!job.task_id) return;
  const link = await getLinkByTaskId(supabaseAdmin, job.user_id, job.task_id);
  if (!link) return;

  const { accessToken } = await getValidGoogleAccessToken(supabaseAdmin, job.user_id);
  try {
    await deleteGoogleEvent(accessToken, link.calendar_id, link.google_event_id);
  } catch {
    // Best effort; mark as deleted anyway.
  }

  const { error } = await supabaseAdmin
    .from("tracker_task_google_event_links")
    .update({ is_deleted: true, last_sync_source: "app", last_synced_task_updated_at: nowIso() })
    .eq("id", link.id);
  if (error) throw new Error(error.message);
};

const processFullBackfillJob = async (supabaseAdmin: SupabaseClient, job: TrackerGoogleSyncJob) => {
  const { data: enabledRows, error: enabledErr } = await supabaseAdmin
    .from("tracker_task_list_sync_settings")
    .select("list_id")
    .eq("user_id", job.user_id)
    .eq("sync_enabled", true);
  if (enabledErr) throw new Error(enabledErr.message);

  const enabledListIds = (enabledRows ?? []).map((row: any) => row.list_id as string);
  if (enabledListIds.length === 0) return;

  let query = supabaseAdmin
    .from("tracker_tasks")
    .select("id, user_id, list_id, due_at, is_completed")
    .eq("user_id", job.user_id)
    .in("list_id", enabledListIds);

  if (job.list_id) query = query.eq("list_id", job.list_id);
  const { data: tasks, error: taskErr } = await query;
  if (taskErr) throw new Error(taskErr.message);

  for (const row of tasks ?? []) {
    if (row.is_completed || !row.due_at) continue;
    await enqueueSyncJob(supabaseAdmin, {
      userId: job.user_id,
      taskId: row.id,
      listId: row.list_id,
      jobType: "task_upsert",
      priority: 60,
      payload: { source: "full_backfill" },
      dedupeKey: `backfill:${row.id}:${new Date().toISOString().slice(0, 16)}`,
    });
  }

  await setConnectionHealth(supabaseAdmin, job.user_id, {
    last_full_sync_at: nowIso(),
    status: "connected",
    last_error: null,
  });
};

const processInboundDeltaJob = async (supabaseAdmin: SupabaseClient, job: TrackerGoogleSyncJob) => {
  const { accessToken, publicRow, secretsRow } = await getValidGoogleAccessToken(supabaseAdmin, job.user_id);
  const calendarId = publicRow.selected_calendar_id;
  if (!calendarId) return;

  let pageToken: string | null = null;
  let nextSyncToken: string | null = null;
  const syncToken = secretsRow.sync_token || null;

  do {
    let delta;
    try {
      delta = await listGoogleEventsDelta({
        accessToken,
        calendarId,
        syncToken,
        pageToken,
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
        await enqueueSyncJob(supabaseAdmin, {
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

    for (const event of delta.items ?? []) {
      if (!event?.id) continue;
      const linkByEvent = await getLinkByEvent(supabaseAdmin, job.user_id, calendarId, event.id);
      const extTaskId = event?.extendedProperties?.private?.tracker_task_id as string | undefined;
      const taskId = linkByEvent?.task_id || extTaskId;
      if (!taskId) continue;

      const task = await getTaskById(supabaseAdmin, job.user_id, taskId);
      if (!task) continue;

      const listEnabled = await isListSyncEnabled(supabaseAdmin, job.user_id, task.list_id);
      if (!listEnabled) continue;

      if (event.status === "cancelled") {
        if (shouldSyncTask(task)) {
          await enqueueSyncJob(supabaseAdmin, {
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
        const updates = {
          title: typeof event.summary === "string" && event.summary.trim() ? event.summary.trim() : task.title,
          details: typeof event.description === "string" ? event.description : null,
          due_at: googleEventToTaskDueAtIso(event),
        };

        const { data: updatedTask, error: updateErr } = await supabaseAdmin
          .from("tracker_tasks")
          .update(updates)
          .eq("user_id", job.user_id)
          .eq("id", task.id)
          .select("id, updated_at")
          .single();
        if (updateErr || !updatedTask) {
          throw new Error(updateErr?.message || "Failed to apply Google update to task");
        }

        await upsertLink(supabaseAdmin, {
          userId: job.user_id,
          taskId: task.id,
          calendarId,
          googleEventId: event.id,
          etag: event.etag ?? null,
          googleUpdatedAt: event.updated ?? null,
          lastSyncedTaskUpdatedAt: updatedTask.updated_at,
          lastSyncSource: "google",
          isDeleted: false,
        });
      } else {
        await enqueueSyncJob(supabaseAdmin, {
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

    pageToken = delta.nextPageToken ?? null;
    if (delta.nextSyncToken) {
      nextSyncToken = delta.nextSyncToken;
    }
  } while (pageToken);

  const { error: secretErr } = await supabaseAdmin
    .from("tracker_google_calendar_connections_secrets")
    .update({
      sync_token: nextSyncToken ?? syncToken,
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
  if (job.job_type === "full_backfill") return processFullBackfillJob(supabaseAdmin, job);
  if (job.job_type === "inbound_delta") return processInboundDeltaJob(supabaseAdmin, job);
  if (job.job_type === "renew_watch") return processRenewWatchJob(supabaseAdmin, job);
};

export const processCalendarSyncJobs = async (input?: { userId?: string; batchSize?: number }) => {
  const supabaseAdmin = getSupabaseAdmin();
  const jobs = await claimSyncJobs(supabaseAdmin, input?.batchSize ?? 25, input?.userId);

  const results: Array<{ id: number; ok: boolean; error?: string }> = [];
  for (const job of jobs) {
    try {
      await processOneJob(supabaseAdmin, job);
      await completeSyncJob(supabaseAdmin, job.id);
      results.push({ id: job.id, ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const retryDelay = computeRetryDelayInterval(job.attempt_count + 1);
      try {
        await failSyncJob(supabaseAdmin, job.id, message, retryDelay);
      } catch {
        // suppress
      }
      await setConnectionHealth(supabaseAdmin, job.user_id, {
        status: "error",
        last_error: message,
      }).catch(() => {});
      results.push({ id: job.id, ok: false, error: message });
    }
  }

  return results;
};

export const queueFullBackfill = async (supabaseAdmin: SupabaseClient, userId: string, listId?: string) => {
  await enqueueSyncJob(supabaseAdmin, {
    userId,
    listId: listId ?? null,
    jobType: "full_backfill",
    priority: 50,
    payload: { source: "manual_or_connect" },
    dedupeKey: `full_backfill:${userId}:${listId || "all"}:${new Date().toISOString().slice(0, 16)}`,
  });
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
  const tasksCalendar = await ensureTasksCalendar(params.accessToken);
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
  await queueFullBackfill(supabaseAdmin, userId);

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

  await supabaseAdmin
    .from("tracker_task_google_event_links")
    .delete()
    .eq("user_id", userId);
};

export const renewExpiringCalendarWatches = async (input?: { userId?: string }) => {
  const supabaseAdmin = getSupabaseAdmin();
  let query = supabaseAdmin
    .from("tracker_google_calendar_connections_secrets")
    .select("user_id, channel_expiration");
  if (input?.userId) {
    query = query.eq("user_id", input.userId);
  }

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
      results.push({ userId, ok: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await setConnectionHealth(supabaseAdmin, userId, {
        status: "error",
        last_error: message,
      }).catch(() => {});
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

  return {
    connected: !!publicRow && publicRow.status === "connected" && !!publicRow.selected_calendar_id,
    connection: publicRow,
    watch_expires_at: secretsRow?.channel_expiration || null,
    list_sync_settings: listSettings,
  };
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
