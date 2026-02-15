import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { CalendarSyncJobType, TrackerGoogleSyncJob } from "../../types/googleCalendar";

export const getSupabaseAdmin = (): SupabaseClient => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
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
    taskId?: string | null;
    listId?: string | null;
    jobType: CalendarSyncJobType;
    priority?: number;
    payload?: Record<string, unknown>;
    dedupeKey?: string;
  }
) => {
  const payload = { ...(input.payload || {}) } as Record<string, unknown>;
  if (input.dedupeKey) {
    payload.dedupe_key = input.dedupeKey;
  }

  const { error } = await supabaseAdmin.from("tracker_google_sync_jobs").insert({
    user_id: input.userId,
    task_id: input.taskId ?? null,
    list_id: input.listId ?? null,
    job_type: input.jobType,
    priority: input.priority ?? 100,
    payload,
    status: "pending",
  });

  // Deduped inserts will violate unique index by design; ignore.
  if (error && error.code !== "23505") {
    throw new Error(error.message);
  }
};

export const claimSyncJobs = async (supabaseAdmin: SupabaseClient, batchSize = 25, userId?: string) => {
  const { data, error } = await supabaseAdmin.rpc("claim_sync_jobs", {
    batch_size: batchSize,
    p_user_id: userId ?? null,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as TrackerGoogleSyncJob[];
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
