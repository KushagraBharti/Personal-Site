import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { CalendarSyncJobType, TrackerGoogleSyncJob } from "../../types/googleCalendar";

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
