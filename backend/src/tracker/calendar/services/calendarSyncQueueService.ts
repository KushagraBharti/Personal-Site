import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { CalendarSyncJobType, CalendarSyncLane, TrackerGoogleSyncJob } from "../../../types/googleCalendar";

const getSupabaseErrorMessage = (error: { message?: string } | null | undefined) =>
  typeof error?.message === "string" ? error.message : "";

const isLegacyQueueSchemaError = (error: { code?: string; message?: string } | null | undefined) => {
  const message = getSupabaseErrorMessage(error).toLowerCase();
  const code = error?.code || "";
  if (code === "42703" || code === "42883" || code === "42P01") return true;
  return (
    message.includes("column") ||
    message.includes("run_id") ||
    message.includes("lane") ||
    message.includes("dedupe_key") ||
    message.includes("google_event_id") ||
    message.includes("source") ||
    message.includes("p_lanes") ||
    message.includes("function claim_sync_jobs") ||
    message.includes("tracker_google_sync_runs") ||
    message.includes("tracker_google_sync_jobs_job_type_check")
  );
};

const toLegacyJobType = (jobType: CalendarSyncJobType): CalendarSyncJobType => {
  if (jobType === "reconcile_app_page") return "full_backfill";
  return jobType;
};

const parseJwtRole = (jwt: string): string | null => {
  const parts = jwt.split(".");
  if (parts.length < 2) return null;
  try {
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
    const payloadJson = Buffer.from(padded, "base64").toString("utf8");
    const payload = JSON.parse(payloadJson) as { role?: string };
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
};

export const getSupabaseAdmin = (): SupabaseClient => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and (SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY) must be set");
  }
  // Supabase supports both newer sb_secret_* keys and legacy JWT service_role keys.
  // Reject clearly invalid frontend keys and JWT anon keys to avoid silent RLS failures.
  const looksLikePublishable = key.startsWith("sb_publishable_");
  if (looksLikePublishable) {
    throw new Error(
      "Supabase server key is misconfigured. Use SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY), not a publishable/anon key."
    );
  }
  if (key.startsWith("eyJ")) {
    const role = parseJwtRole(key);
    if (role && role !== "service_role") {
      throw new Error(
        `Supabase JWT key role is '${role}', expected 'service_role'. Set SUPABASE_SERVICE_ROLE_KEY to the service role key.`
      );
    }
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
};

export const enqueueSyncJob = async (
  supabaseAdmin: SupabaseClient,
  input: {
    userId: string;
    runId?: string | null;
    lane?: CalendarSyncLane;
    taskId?: string | null;
    googleEventId?: string | null;
    listId?: string | null;
    jobType: CalendarSyncJobType;
    source?: string | null;
    priority?: number;
    payload?: Record<string, unknown>;
    dedupeKey?: string;
  }
) => {
  const payload = { ...(input.payload || {}) } as Record<string, unknown>;
  const nextRow = {
    user_id: input.userId,
    run_id: input.runId ?? null,
    lane: input.lane ?? "system",
    task_id: input.taskId ?? null,
    google_event_id: input.googleEventId ?? null,
    list_id: input.listId ?? null,
    job_type: input.jobType,
    source: input.source ?? null,
    dedupe_key: input.dedupeKey ?? null,
    priority: input.priority ?? 100,
    payload,
    status: "pending",
  };

  const { error } = await supabaseAdmin.from("tracker_google_sync_jobs").insert(nextRow);

  if (!error) return;

  if (error.code === "23505") return;

  if (isLegacyQueueSchemaError(error)) {
    const { error: legacyError } = await supabaseAdmin.from("tracker_google_sync_jobs").insert({
      user_id: input.userId,
      task_id: input.taskId ?? null,
      list_id: input.listId ?? null,
      job_type: toLegacyJobType(input.jobType),
      priority: input.priority ?? 100,
      payload,
      status: "pending",
    });

    if (!legacyError || legacyError.code === "23505") {
      return;
    }

    throw new Error(legacyError.message);
  }

  throw new Error(error.message);
};

export const claimSyncJobs = async (
  supabaseAdmin: SupabaseClient,
  batchSize = 25,
  userId?: string,
  lanes?: CalendarSyncLane[]
) => {
  const { data, error } = await supabaseAdmin.rpc("claim_sync_jobs", {
    batch_size: batchSize,
    p_user_id: userId ?? null,
    p_lanes: lanes?.length ? lanes : null,
  });
  if (!error) return (data ?? []) as TrackerGoogleSyncJob[];

  if (isLegacyQueueSchemaError(error)) {
    const legacy = await supabaseAdmin.rpc("claim_sync_jobs", {
      batch_size: batchSize,
      p_user_id: userId ?? null,
    });
    if (legacy.error) throw new Error(legacy.error.message);
    return (legacy.data ?? []) as TrackerGoogleSyncJob[];
  }

  throw new Error(error.message);
};

export const completeSyncJob = async (supabaseAdmin: SupabaseClient, jobId: number) => {
  const { error } = await supabaseAdmin.rpc("complete_sync_job", { job_id: jobId });
  if (error) throw new Error(error.message);
};

export const failSyncJob = async (
  supabaseAdmin: SupabaseClient,
  jobId: number,
  err: string,
  retryDelay: string
) => {
  const { error } = await supabaseAdmin.rpc("fail_sync_job", {
    job_id: jobId,
    err,
    retry_delay: retryDelay,
  });
  if (error) throw new Error(error.message);
};

export const computeRetryDelayInterval = (attemptCount: number) => {
  const seconds = Math.min(Math.pow(2, Math.max(attemptCount, 0)) * 15, 6 * 60 * 60);
  return `${Math.round(seconds)} seconds`;
};
