import { SupabaseClient } from "@supabase/supabase-js";
import { TrackerTaskRow } from "../../../types/googleCalendar";
import {
  computeNextRecurringDueAt,
  isDateOnlyIso,
  isRecurringTask,
  resolveTaskTimeZone,
} from "../../calendar/services/taskCalendarEventUtils";
import { getRawErrorMessage, nowIso } from "./taskHubUtils";

export const getNextTaskSortOrder = async (
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

export const createNextRecurringTaskForCompletion = async (
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
