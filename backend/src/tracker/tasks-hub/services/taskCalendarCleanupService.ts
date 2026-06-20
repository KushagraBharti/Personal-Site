import { SupabaseClient } from "@supabase/supabase-js";
import { TrackerGoogleSyncJob } from "../../../types/googleCalendar";
import { processTaskDeleteJob } from "../../calendar/services/taskCalendarSyncService";
import { getRawErrorMessage, nowIso } from "./taskHubUtils";

const isMissingProjectionSchemaError = (error: unknown) => {
  const message = getRawErrorMessage(error).toLowerCase();
  if (!message.includes("tracker_task_google_projection_event_links")) return false;
  return (
    message.includes("schema cache") ||
    message.includes("does not exist") ||
    message.includes("relation") ||
    message.includes("not found")
  );
};

export const buildSyntheticDeleteJob = (input: {
  userId: string;
  listId: string;
  taskId: string;
  source?: string;
}): TrackerGoogleSyncJob => ({
  id: 0,
  user_id: input.userId,
  run_id: null,
  lane: "system",
  task_id: input.taskId,
  google_event_id: null,
  list_id: input.listId,
  job_type: "task_delete",
  source: input.source ?? "delete_task_list",
  dedupe_key: null,
  priority: 0,
  payload: {},
  status: "pending",
  attempt_count: 0,
  max_attempts: 1,
  run_after: nowIso(),
  last_error: null,
  locked_at: null,
  created_at: nowIso(),
  updated_at: nowIso(),
});

export const deleteCalendarLinksForTasks = async (
  supabaseAdmin: SupabaseClient,
  userId: string,
  taskIds: string[]
) => {
  if (taskIds.length === 0) return;

  try {
    const { error: projectionLinkError } = await supabaseAdmin
      .from("tracker_task_google_projection_event_links")
      .delete()
      .eq("user_id", userId)
      .in("task_id", taskIds);
    if (projectionLinkError) throw new Error(projectionLinkError.message);
  } catch (error) {
    if (!isMissingProjectionSchemaError(error)) throw error;
  }

  const { error: primaryLinkError } = await supabaseAdmin
    .from("tracker_task_google_event_links")
    .delete()
    .eq("user_id", userId)
    .in("task_id", taskIds);
  if (primaryLinkError) throw new Error(primaryLinkError.message);
};

export const processBestEffortTaskDeleteCleanup = async (
  supabaseAdmin: SupabaseClient,
  input: {
    userId: string;
    listId: string;
    taskId: string;
    source?: string;
  }
) => {
  try {
    await processTaskDeleteJob(
      supabaseAdmin,
      buildSyntheticDeleteJob({
        userId: input.userId,
        listId: input.listId,
        taskId: input.taskId,
        source: input.source,
      })
    );
  } catch {
    // Local deletes should not fail if Google cleanup is temporarily unavailable.
  }
};
