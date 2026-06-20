import { SupabaseClient } from "@supabase/supabase-js";
import { TrackerGoogleSyncJob, TrackerTaskRow } from "../../../types/googleCalendar";
import { processTaskDeleteJob } from "../../calendar/services/taskCalendarSyncService";
import {
  computeNextRecurringDueAt,
  isDateOnlyIso,
  isRecurringTask,
  resolveTaskTimeZone,
} from "../../calendar/services/taskCalendarEventUtils";

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

type TaskDeleteRow = {
  id: string;
  list_id: string;
  parent_task_id: string | null;
};

const collectTaskTreeForDelete = async (
  supabaseAdmin: SupabaseClient,
  userId: string,
  taskId: string
) => {
  const { data: rootTask, error: rootTaskError } = await supabaseAdmin
    .from("tracker_tasks")
    .select("id,list_id,parent_task_id")
    .eq("user_id", userId)
    .eq("id", taskId)
    .maybeSingle();
  if (rootTaskError) throw new Error(rootTaskError.message);
  if (!rootTask) return null;

  const rowsById = new Map<string, TaskDeleteRow>();
  rowsById.set(String(rootTask.id), {
    id: String(rootTask.id),
    list_id: String(rootTask.list_id),
    parent_task_id: rootTask.parent_task_id ? String(rootTask.parent_task_id) : null,
  });

  let frontier = [String(rootTask.id)];
  while (frontier.length > 0) {
    const { data: childRows, error: childRowsError } = await supabaseAdmin
      .from("tracker_tasks")
      .select("id,list_id,parent_task_id")
      .eq("user_id", userId)
      .in("parent_task_id", frontier);
    if (childRowsError) throw new Error(childRowsError.message);

    const nextFrontier: string[] = [];
    for (const row of childRows ?? []) {
      const id = String(row.id);
      if (rowsById.has(id)) continue;
      rowsById.set(id, {
        id,
        list_id: String(row.list_id),
        parent_task_id: row.parent_task_id ? String(row.parent_task_id) : null,
      });
      nextFrontier.push(id);
    }
    frontier = nextFrontier;
  }

  return Array.from(rowsById.values());
};

const deleteCalendarLinksForTasks = async (
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

const getNextTaskSortOrder = async (
  supabaseAdmin: SupabaseClient,
  userId: string,
  listId: string,
  parentTaskId: string | null
) => {
  let query = supabaseAdmin
    .from("tracker_tasks")
    .select("sort_order")
    .eq("user_id", userId)
    .eq("list_id", listId);

  query = parentTaskId ? query.eq("parent_task_id", parentTaskId) : query.is("parent_task_id", null);

  const { data, error } = await query.order("sort_order", { ascending: false }).limit(1);
  if (error) throw new Error(error.message);

  const currentMax = Number((data?.[0] as { sort_order?: unknown } | undefined)?.sort_order);
  return Number.isFinite(currentMax) ? currentMax + 1 : 1;
};

const applyNullableFilter = (
  query: any,
  column: string,
  value: string | number | boolean | null
) => (value === null ? query.is(column, null) : query.eq(column, value));

const findExistingNextRecurringTask = async (
  supabaseAdmin: SupabaseClient,
  userId: string,
  sourceTask: TrackerTaskRow,
  nextDueAt: string,
  nextDueTimezone: string | null
) => {
  let query = supabaseAdmin
    .from("tracker_tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("list_id", sourceTask.list_id)
    .eq("title", sourceTask.title)
    .eq("due_at", nextDueAt)
    .eq("is_completed", false)
    .eq("recurrence_type", sourceTask.recurrence_type);

  query = applyNullableFilter(query, "parent_task_id", sourceTask.parent_task_id);
  query = applyNullableFilter(query, "details", sourceTask.details);
  query = applyNullableFilter(query, "due_timezone", nextDueTimezone);
  query = applyNullableFilter(query, "recurrence_interval", sourceTask.recurrence_interval);
  query = applyNullableFilter(query, "recurrence_unit", sourceTask.recurrence_unit);
  query = applyNullableFilter(query, "recurrence_ends_at", sourceTask.recurrence_ends_at);

  const { data, error } = await query.order("sort_order", { ascending: true }).limit(1);
  if (error) throw new Error(error.message);
  return ((data?.[0] as TrackerTaskRow | undefined) ?? null);
};

const createNextRecurringTaskForCompletion = async (
  supabaseAdmin: SupabaseClient,
  userId: string,
  sourceTask: TrackerTaskRow
) => {
  if (!isRecurringTask(sourceTask)) return null;

  const nextDueAt = computeNextRecurringDueAt(sourceTask);
  if (!nextDueAt) return null;

  const nextDueTimezone = isDateOnlyIso(nextDueAt)
    ? null
    : resolveTaskTimeZone(sourceTask.due_timezone);
  const existingNextTask = await findExistingNextRecurringTask(
    supabaseAdmin,
    userId,
    sourceTask,
    nextDueAt,
    nextDueTimezone
  );
  if (existingNextTask) return null;

  const sortOrder = await getNextTaskSortOrder(
    supabaseAdmin,
    userId,
    sourceTask.list_id,
    sourceTask.parent_task_id
  );
  const { data: nextTaskRow, error: nextTaskError } = await supabaseAdmin
    .from("tracker_tasks")
    .insert({
      user_id: userId,
      list_id: sourceTask.list_id,
      parent_task_id: sourceTask.parent_task_id,
      title: sourceTask.title,
      details: sourceTask.details,
      due_at: nextDueAt,
      due_timezone: nextDueTimezone,
      is_completed: false,
      completed_at: null,
      recurrence_type: sourceTask.recurrence_type,
      recurrence_interval: sourceTask.recurrence_interval,
      recurrence_unit: sourceTask.recurrence_unit,
      recurrence_ends_at: sourceTask.recurrence_ends_at,
      sort_order: sortOrder,
    })
    .select("*")
    .single();
  if (nextTaskError) throw new Error(nextTaskError.message);
  return (nextTaskRow as TrackerTaskRow | null) ?? null;
};

export const setTaskCompletionForUser = async (
  supabaseAdmin: SupabaseClient,
  userId: string,
  taskId: string,
  isCompleted: boolean
) => {
  const { data: existingTaskRow, error: existingTaskError } = await supabaseAdmin
    .from("tracker_tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("id", taskId)
    .maybeSingle();
  if (existingTaskError) throw new Error(existingTaskError.message);
  if (!existingTaskRow) return { ok: false as const, code: 404, error: "Task not found" };

  const existingTask = existingTaskRow as TrackerTaskRow;
  const wasCompleted = existingTask.is_completed;
  const completedAt = isCompleted ? nowIso() : null;

  const { data: updatedTaskRow, error: updateError } = await supabaseAdmin
    .from("tracker_tasks")
    .update({
      is_completed: isCompleted,
      completed_at: completedAt,
    })
    .eq("user_id", userId)
    .eq("id", taskId)
    .select("*")
    .single();
  if (updateError) throw new Error(updateError.message);

  let createdNextTask: TrackerTaskRow | null = null;
  if (isCompleted && !wasCompleted && isRecurringTask(existingTask)) {
    createdNextTask = await createNextRecurringTaskForCompletion(
      supabaseAdmin,
      userId,
      existingTask
    );
  }

  return {
    ok: true as const,
    task: updatedTaskRow as TrackerTaskRow,
    createdNextTask,
  };
};

export const reconcileCompletedRecurringTasks = async (
  supabaseAdmin: SupabaseClient,
  input?: { userId?: string; limit?: number }
) => {
  const limit = Math.max(1, Math.min(input?.limit ?? 25, 100));
  let query = supabaseAdmin
    .from("tracker_tasks")
    .select("*")
    .eq("is_completed", true)
    .neq("recurrence_type", "none")
    .not("due_at", "is", null);

  if (input?.userId) query = query.eq("user_id", input.userId);

  const { data: taskRows, error } = await query
    .order("completed_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) throw new Error(error.message);

  const results: Array<{
    task_id: string;
    ok: boolean;
    created: boolean;
    created_next_task_id: string | null;
    error?: string;
  }> = [];

  for (const taskRow of (taskRows ?? []) as TrackerTaskRow[]) {
    try {
      const createdNextTask = await createNextRecurringTaskForCompletion(
        supabaseAdmin,
        taskRow.user_id,
        taskRow
      );
      results.push({
        task_id: taskRow.id,
        ok: true,
        created: !!createdNextTask,
        created_next_task_id: createdNextTask?.id ?? null,
      });
    } catch (error) {
      results.push({
        task_id: taskRow.id,
        ok: false,
        created: false,
        created_next_task_id: null,
        error: getRawErrorMessage(error),
      });
    }
  }

  const failed = results.filter((item) => !item.ok).length;
  return {
    ok: failed === 0,
    checked: results.length,
    created: results.filter((item) => item.created).length,
    failed,
    results,
  };
};

export const deleteTaskForUser = async (
  supabaseAdmin: SupabaseClient,
  userId: string,
  taskId: string
) => {
  const taskRows = await collectTaskTreeForDelete(supabaseAdmin, userId, taskId);
  if (!taskRows) return { ok: false as const, code: 404, error: "Task not found" };

  const taskIds = taskRows.map((row) => row.id);

  for (const row of taskRows) {
    try {
      await processTaskDeleteJob(
        supabaseAdmin,
        buildSyntheticDeleteJob({
          userId,
          listId: row.list_id,
          taskId: row.id,
          source: "delete_task",
        })
      );
    } catch {
      // Best effort: local delete should still succeed even if Google cleanup fails.
    }
  }

  await deleteCalendarLinksForTasks(supabaseAdmin, userId, taskIds);

  const { error: taskDeleteError } = await supabaseAdmin
    .from("tracker_tasks")
    .delete()
    .eq("user_id", userId)
    .in("id", taskIds);
  if (taskDeleteError) throw new Error(taskDeleteError.message);

  return { ok: true as const };
};

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

    await deleteCalendarLinksForTasks(supabaseAdmin, userId, taskIds);

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
