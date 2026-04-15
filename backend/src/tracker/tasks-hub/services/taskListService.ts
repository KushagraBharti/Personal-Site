import { SupabaseClient } from "@supabase/supabase-js";
import { TrackerGoogleSyncJob } from "../../../types/googleCalendar";
import { processTaskDeleteJob } from "../../calendar/services/taskCalendarSyncService";

const nowIso = () => new Date().toISOString();

const getRawErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message?: unknown }).message ?? "");
  }
  return String(error);
};

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

const buildSyntheticDeleteJob = (input: {
  userId: string;
  listId: string;
  taskId: string;
}): TrackerGoogleSyncJob => ({
  id: 0,
  user_id: input.userId,
  run_id: null,
  lane: "system",
  task_id: input.taskId,
  google_event_id: null,
  list_id: input.listId,
  job_type: "task_delete",
  source: "delete_task_list",
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

export const deleteTaskListForUser = async (
  supabaseAdmin: SupabaseClient,
  userId: string,
  listId: string
) => {
  const { data: listRow, error: listError } = await supabaseAdmin
    .from("tracker_task_lists")
    .select("id")
    .eq("user_id", userId)
    .eq("id", listId)
    .maybeSingle();
  if (listError) throw new Error(listError.message);
  if (!listRow) return { ok: false as const, code: 404, error: "List not found" };

  const { data: taskRows, error: taskRowsError } = await supabaseAdmin
    .from("tracker_tasks")
    .select("id")
    .eq("user_id", userId)
    .eq("list_id", listId);
  if (taskRowsError) throw new Error(taskRowsError.message);

  const taskIds = (taskRows ?? []).map((row: any) => String(row.id)).filter(Boolean);

  for (const taskId of taskIds) {
    try {
      await processTaskDeleteJob(
        supabaseAdmin,
        buildSyntheticDeleteJob({
          userId,
          listId,
          taskId,
        })
      );
    } catch {
      // Best effort: local delete should still succeed even if Google cleanup fails.
    }
  }

  const { error: jobUpdateError } = await supabaseAdmin
    .from("tracker_google_sync_jobs")
    .update({ list_id: null })
    .eq("user_id", userId)
    .eq("list_id", listId);
  if (jobUpdateError) throw new Error(jobUpdateError.message);

  const { error: listSyncSettingsError } = await supabaseAdmin
    .from("tracker_task_list_sync_settings")
    .delete()
    .eq("user_id", userId)
    .eq("list_id", listId);
  if (listSyncSettingsError) throw new Error(listSyncSettingsError.message);

  const { error: sortPrefError } = await supabaseAdmin
    .from("tracker_task_sort_preferences")
    .delete()
    .eq("user_id", userId)
    .eq("list_id", listId);
  if (sortPrefError) throw new Error(sortPrefError.message);

  if (taskIds.length > 0) {
    const { error: clearParentRefsError } = await supabaseAdmin
      .from("tracker_tasks")
      .update({ parent_task_id: null })
      .eq("user_id", userId)
      .in("parent_task_id", taskIds);
    if (clearParentRefsError) throw new Error(clearParentRefsError.message);

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

    const { error: taskDeleteError } = await supabaseAdmin
      .from("tracker_tasks")
      .delete()
      .eq("user_id", userId)
      .eq("list_id", listId);
    if (taskDeleteError) throw new Error(taskDeleteError.message);
  }

  const { error: listDeleteError } = await supabaseAdmin
    .from("tracker_task_lists")
    .delete()
    .eq("user_id", userId)
    .eq("id", listId);
  if (listDeleteError) throw new Error(listDeleteError.message);

  return { ok: true as const };
};
