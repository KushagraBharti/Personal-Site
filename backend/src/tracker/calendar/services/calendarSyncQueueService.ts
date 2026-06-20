import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { CalendarSyncJobType, CalendarSyncLane, TrackerGoogleSyncJob } from "../../../types/googleCalendar";

const STALE_RUNNING_JOB_MS = 10 * 60 * 1000;

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
  const candidates = [
    ["SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY],
    ["SUPABASE_SECRET_KEY", process.env.SUPABASE_SECRET_KEY],
  ].filter((entry): entry is [string, string] => !!entry[1]);

  if (!url || candidates.length === 0) {
    throw new Error("SUPABASE_URL and (SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY) must be set");
  }

  // Prefer service-role JWTs for supabase-js, but tolerate newer sb_secret_* keys.
  // Vercel/Supabase integrations can leave stale anon keys beside newer variables.
  let selectedKey: string | null = null;
  let firstInvalidMessage = "";
  for (const [name, key] of candidates) {
    if (key.startsWith("sb_publishable_")) {
      firstInvalidMessage ||= `${name} is publishable/anon, expected a server key.`;
      continue;
    }

    if (!key.startsWith("eyJ")) {
      selectedKey = key;
      break;
    }

    const role = parseJwtRole(key);
    if (role && role !== "service_role") {
      firstInvalidMessage ||= `${name} JWT role is '${role}', expected 'service_role'.`;
      continue;
    }

    selectedKey = key;
    break;
  }

  if (!selectedKey) {
    throw new Error(
      firstInvalidMessage ||
        "Supabase server key is misconfigured. Use SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY, not a frontend key."
    );
  }

  return createClient(url, selectedKey, {
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

  if (!error) return true;
  if (error.code === "23505") return false;
  throw new Error(error.message);
};

const recoverStaleRunningJobs = async (
  supabaseAdmin: SupabaseClient,
  userId?: string,
  lanes?: CalendarSyncLane[],
) => {
  const staleBefore = new Date(Date.now() - STALE_RUNNING_JOB_MS).toISOString();
  let query = supabaseAdmin
    .from("tracker_google_sync_jobs")
    .update({
      status: "pending",
      locked_at: null,
      run_after: new Date().toISOString(),
    })
    .eq("status", "running")
    .lt("locked_at", staleBefore);

  if (userId) query = query.eq("user_id", userId);
  if (lanes?.length) query = query.in("lane", lanes);

  const { error } = await query;
  if (error) throw new Error(error.message);
};

export const claimSyncJobs = async (
  supabaseAdmin: SupabaseClient,
  batchSize = 25,
  userId?: string,
  lanes?: CalendarSyncLane[]
) => {
  await recoverStaleRunningJobs(supabaseAdmin, userId, lanes);

  const { data, error } = await supabaseAdmin.rpc("claim_sync_jobs", {
    batch_size: batchSize,
    p_user_id: userId ?? null,
    p_lanes: lanes?.length ? lanes : null,
  });
  if (!error) return (data ?? []) as TrackerGoogleSyncJob[];
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
