import { DateTime } from "luxon";
import { SupabaseClient } from "@supabase/supabase-js";
import { TrackerTaskRow } from "../../../types/googleCalendar";
import {
  RecurrenceType,
  RecurrenceUnit,
  ServiceFailure,
  ServiceResult,
  TaskCreateInput,
  TaskUpdateInput,
} from "./taskHubTypes";
import {
  cleanNullableString,
  cleanOptionalString,
  isValidIanaTimeZone,
  normalizeRecurrenceType,
  normalizeRecurrenceUnit,
  normalizeTaskDueTimeZone,
} from "./taskHubUtils";
import { deleteCalendarLinksForTasks } from "./taskCalendarCleanupService";
import { queueTaskDeleteForUser } from "../../calendar/services/taskCalendarSyncService";
import { getNextTaskSortOrder } from "./taskRecurrenceService";

type TaskPayload = {
  user_id: string;
  list_id: string;
  parent_task_id: string | null;
  title: string;
  details: string | null;
  due_at: string | null;
  due_timezone: string | null;
  is_completed: boolean;
  completed_at: string | null;
  recurrence_type: RecurrenceType;
  recurrence_interval: number | null;
  recurrence_unit: RecurrenceUnit;
  recurrence_ends_at: string | null;
  sort_order: number;
};

type TaskServiceFailure = ServiceFailure;

const hasOwn = (input: object, key: string) =>
  Object.prototype.hasOwnProperty.call(input, key);

const DATE_ONLY_MARKER_MS = 777;
const DATE_ONLY_INPUT_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const resolveDueAtTimeZone = (
  dueTimeZone: unknown,
  browserTimeZone: unknown,
  currentTimeZone?: string | null,
) => {
  for (const candidate of [dueTimeZone, currentTimeZone, browserTimeZone]) {
    if (typeof candidate === "string" && isValidIanaTimeZone(candidate)) {
      return candidate;
    }
  }
  return "UTC";
};

const normalizeDateOnlyDueAt = (
  value: string,
  timeZone: string,
): string | null => {
  let localDate: string | null = null;

  if (DATE_ONLY_INPUT_REGEX.test(value)) {
    localDate = value;
  } else {
    const parsed = DateTime.fromISO(value, { zone: "utc" });
    if (parsed.isValid && parsed.millisecond === DATE_ONLY_MARKER_MS) {
      localDate = parsed.setZone(timeZone).toISODate();
    }
  }

  if (!localDate) return null;

  const normalized = DateTime.fromISO(localDate, { zone: timeZone }).set({
    hour: 22,
    minute: 0,
    second: 0,
    millisecond: 0,
  });
  if (!normalized.isValid) return null;

  return normalized.toUTC().toISO({ suppressMilliseconds: false });
};

const normalizePositiveInteger = (value: unknown, fallback: number) => {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(1, Math.floor(parsed));
};

const normalizeDueAt = (
  value: unknown,
  options?: {
    dueTimeZone?: unknown;
    browserTimeZone?: unknown;
    currentTimeZone?: string | null;
  },
) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const dateOnlyDueAt = normalizeDateOnlyDueAt(
    trimmed,
    resolveDueAtTimeZone(
      options?.dueTimeZone,
      options?.browserTimeZone,
      options?.currentTimeZone,
    ),
  );

  return dateOnlyDueAt ?? trimmed;
};

const normalizeRecurrenceCreateFields = (
  input: TaskCreateInput,
): ServiceResult<{
  recurrenceType: RecurrenceType;
  recurrenceInterval: number | null;
  recurrenceUnit: RecurrenceUnit;
  recurrenceEndsAt: string | null;
}> => {
  const recurrenceType =
    input.recurrence_type === undefined
      ? "none"
      : normalizeRecurrenceType(input.recurrence_type);
  if (!recurrenceType)
    return { ok: false, code: 400, error: "Invalid recurrence_type" };

  if (recurrenceType === "none") {
    return {
      ok: true,
      recurrenceType,
      recurrenceInterval: null,
      recurrenceUnit: null,
      recurrenceEndsAt: null,
    };
  }

  const recurrenceEndsAt = cleanNullableString(input.recurrence_ends_at);
  if (
    recurrenceEndsAt === undefined ||
    recurrenceEndsAt === null ||
    typeof recurrenceEndsAt === "string"
  ) {
    if (recurrenceType !== "custom") {
      return {
        ok: true,
        recurrenceType,
        recurrenceInterval: null,
        recurrenceUnit: null,
        recurrenceEndsAt: recurrenceEndsAt ?? null,
      };
    }

    const recurrenceInterval = normalizePositiveInteger(
      input.recurrence_interval,
      1,
    );
    if (!recurrenceInterval) {
      return { ok: false, code: 400, error: "Invalid recurrence_interval" };
    }
    const recurrenceUnit =
      input.recurrence_unit === undefined
        ? "day"
        : normalizeRecurrenceUnit(input.recurrence_unit);
    if (!recurrenceUnit)
      return { ok: false, code: 400, error: "Invalid recurrence_unit" };

    return {
      ok: true,
      recurrenceType,
      recurrenceInterval,
      recurrenceUnit,
      recurrenceEndsAt: recurrenceEndsAt ?? null,
    };
  }

  return { ok: false, code: 400, error: "Invalid recurrence_ends_at" };
};

const fetchTaskForUser = async (
  supabaseAdmin: SupabaseClient,
  userId: string,
  taskId: string,
) => {
  const { data, error } = await supabaseAdmin
    .from("tracker_tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("id", taskId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as TrackerTaskRow | null) ?? null;
};

const assertListBelongsToUser = async (
  supabaseAdmin: SupabaseClient,
  userId: string,
  listId: string,
): Promise<TaskServiceFailure | null> => {
  const { data, error } = await supabaseAdmin
    .from("tracker_task_lists")
    .select("id")
    .eq("user_id", userId)
    .eq("id", listId)
    .eq("archived", false)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return { ok: false, code: 404, error: "List not found" };
  return null;
};

const assertParentBelongsToList = async (
  supabaseAdmin: SupabaseClient,
  userId: string,
  listId: string,
  parentTaskId: string | null,
  editedTaskId?: string,
): Promise<TaskServiceFailure | null> => {
  if (!parentTaskId) return null;
  if (parentTaskId === editedTaskId) {
    return { ok: false, code: 400, error: "Task cannot be its own parent" };
  }

  const parentTask = await fetchTaskForUser(
    supabaseAdmin,
    userId,
    parentTaskId,
  );
  if (!parentTask)
    return { ok: false, code: 404, error: "Parent task not found" };
  if (parentTask.list_id !== listId) {
    return {
      ok: false,
      code: 400,
      error: "Parent task must be in the same list",
    };
  }
  return null;
};

export const createTaskForUser = async (
  supabaseAdmin: SupabaseClient,
  userId: string,
  input: TaskCreateInput,
): Promise<ServiceResult<{ task: TrackerTaskRow }>> => {
  const listId = cleanOptionalString(input.list_id);
  if (!listId) return { ok: false, code: 400, error: "list_id is required" };

  const title = cleanOptionalString(input.title);
  if (!title) return { ok: false, code: 400, error: "Task title is required" };

  const listFailure = await assertListBelongsToUser(
    supabaseAdmin,
    userId,
    listId,
  );
  if (listFailure) return listFailure;

  const parentTaskId = cleanNullableString(input.parent_task_id, {
    trim: true,
  });
  if (
    parentTaskId === undefined ||
    typeof parentTaskId === "string" ||
    parentTaskId === null
  ) {
    const parentFailure = await assertParentBelongsToList(
      supabaseAdmin,
      userId,
      listId,
      parentTaskId ?? null,
    );
    if (parentFailure) return parentFailure;
  } else {
    return { ok: false, code: 400, error: "Invalid parent_task_id" };
  }

  const dueAt = normalizeDueAt(input.due_at, {
    dueTimeZone: input.due_timezone,
    browserTimeZone: input.browser_timezone,
  });
  if (dueAt === undefined) {
    return { ok: false, code: 400, error: "due_at is required" };
  }
  if (typeof dueAt !== "string" && dueAt !== null) {
    return { ok: false, code: 400, error: "Invalid due_at" };
  }

  const recurrenceFields = normalizeRecurrenceCreateFields(input);
  if (!recurrenceFields.ok) return recurrenceFields;
  if (recurrenceFields.recurrenceType !== "none" && !dueAt) {
    return {
      ok: false,
      code: 400,
      error: "Recurring tasks require a due date.",
    };
  }

  const detailsInput = cleanNullableString(input.details, { trim: true });
  const details = detailsInput ? detailsInput : null;
  const sortOrder = await getNextTaskSortOrder(
    supabaseAdmin,
    userId,
    listId,
    parentTaskId ?? null,
  );
  const payload: TaskPayload = {
    user_id: userId,
    list_id: listId,
    parent_task_id: parentTaskId ?? null,
    title,
    details,
    due_at: dueAt,
    due_timezone: normalizeTaskDueTimeZone(
      dueAt,
      input.due_timezone,
      input.browser_timezone,
    ),
    is_completed: false,
    completed_at: null,
    recurrence_type: recurrenceFields.recurrenceType,
    recurrence_interval: recurrenceFields.recurrenceInterval,
    recurrence_unit: recurrenceFields.recurrenceUnit,
    recurrence_ends_at: recurrenceFields.recurrenceEndsAt,
    sort_order: sortOrder,
  };

  const { data, error } = await supabaseAdmin
    .from("tracker_tasks")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  return { ok: true, task: data as TrackerTaskRow };
};

export const updateTaskForUser = async (
  supabaseAdmin: SupabaseClient,
  userId: string,
  taskId: string,
  input: TaskUpdateInput,
): Promise<ServiceResult<{ task: TrackerTaskRow }>> => {
  const currentTask = await fetchTaskForUser(supabaseAdmin, userId, taskId);
  if (!currentTask) return { ok: false, code: 404, error: "Task not found" };

  const payload: Record<string, unknown> = {};
  let nextListId = currentTask.list_id;
  if (hasOwn(input, "list_id")) {
    const listId = cleanOptionalString(input.list_id);
    if (!listId) return { ok: false, code: 400, error: "list_id is required" };
    const listFailure = await assertListBelongsToUser(
      supabaseAdmin,
      userId,
      listId,
    );
    if (listFailure) return listFailure;
    nextListId = listId;
    payload.list_id = listId;
  }

  let nextParentTaskId = currentTask.parent_task_id;
  if (hasOwn(input, "parent_task_id")) {
    const parentTaskId = cleanNullableString(input.parent_task_id, {
      trim: true,
    });
    if (
      !(
        parentTaskId === undefined ||
        typeof parentTaskId === "string" ||
        parentTaskId === null
      )
    ) {
      return { ok: false, code: 400, error: "Invalid parent_task_id" };
    }
    nextParentTaskId = parentTaskId ?? null;
    payload.parent_task_id = nextParentTaskId;
  }

  if (hasOwn(input, "list_id") || hasOwn(input, "parent_task_id")) {
    const parentFailure = await assertParentBelongsToList(
      supabaseAdmin,
      userId,
      nextListId,
      nextParentTaskId,
      taskId,
    );
    if (parentFailure) return parentFailure;
  }

  if (hasOwn(input, "title")) {
    const title = cleanOptionalString(input.title);
    if (!title)
      return { ok: false, code: 400, error: "Task title is required" };
    payload.title = title;
  }

  if (hasOwn(input, "details")) {
    const details = cleanNullableString(input.details, { trim: true });
    if (
      !(
        details === undefined ||
        details === null ||
        typeof details === "string"
      )
    ) {
      return { ok: false, code: 400, error: "Invalid details" };
    }
    payload.details = details ? details : null;
  }

  let nextDueAt = currentTask.due_at;
  if (hasOwn(input, "due_at")) {
    const dueAt = normalizeDueAt(input.due_at, {
      dueTimeZone: input.due_timezone,
      browserTimeZone: input.browser_timezone,
      currentTimeZone: currentTask.due_timezone,
    });
    if (!(typeof dueAt === "string" || dueAt === null)) {
      return { ok: false, code: 400, error: "Invalid due_at" };
    }
    nextDueAt = dueAt;
    payload.due_at = dueAt;
  }

  const recurrenceTouched =
    hasOwn(input, "recurrence_type") ||
    hasOwn(input, "recurrence_interval") ||
    hasOwn(input, "recurrence_unit") ||
    hasOwn(input, "recurrence_ends_at") ||
    hasOwn(input, "due_at");

  let nextRecurrenceType = currentTask.recurrence_type;
  if (hasOwn(input, "recurrence_type")) {
    const recurrenceType = normalizeRecurrenceType(input.recurrence_type);
    if (!recurrenceType)
      return { ok: false, code: 400, error: "Invalid recurrence_type" };
    nextRecurrenceType = recurrenceType;
    payload.recurrence_type = recurrenceType;
  }

  if (recurrenceTouched) {
    if (nextRecurrenceType !== "none" && !nextDueAt) {
      return {
        ok: false,
        code: 400,
        error: "Recurring tasks require a due date.",
      };
    }

    if (nextRecurrenceType === "none") {
      payload.recurrence_interval = null;
      payload.recurrence_unit = null;
      payload.recurrence_ends_at = null;
    } else if (nextRecurrenceType === "custom") {
      const recurrenceInterval = hasOwn(input, "recurrence_interval")
        ? normalizePositiveInteger(
            input.recurrence_interval,
            currentTask.recurrence_interval ?? 1,
          )
        : (currentTask.recurrence_interval ?? 1);
      if (!recurrenceInterval) {
        return { ok: false, code: 400, error: "Invalid recurrence_interval" };
      }

      const recurrenceUnit = hasOwn(input, "recurrence_unit")
        ? normalizeRecurrenceUnit(input.recurrence_unit)
        : (currentTask.recurrence_unit ?? "day");
      if (!recurrenceUnit)
        return { ok: false, code: 400, error: "Invalid recurrence_unit" };
      payload.recurrence_interval = recurrenceInterval;
      payload.recurrence_unit = recurrenceUnit;

      if (hasOwn(input, "recurrence_ends_at")) {
        const recurrenceEndsAt = cleanNullableString(input.recurrence_ends_at);
        if (
          !(
            recurrenceEndsAt === undefined ||
            recurrenceEndsAt === null ||
            typeof recurrenceEndsAt === "string"
          )
        ) {
          return { ok: false, code: 400, error: "Invalid recurrence_ends_at" };
        }
        payload.recurrence_ends_at = recurrenceEndsAt ?? null;
      }
    } else {
      payload.recurrence_interval = null;
      payload.recurrence_unit = null;
      if (hasOwn(input, "recurrence_ends_at")) {
        const recurrenceEndsAt = cleanNullableString(input.recurrence_ends_at);
        if (
          !(
            recurrenceEndsAt === undefined ||
            recurrenceEndsAt === null ||
            typeof recurrenceEndsAt === "string"
          )
        ) {
          return { ok: false, code: 400, error: "Invalid recurrence_ends_at" };
        }
        payload.recurrence_ends_at = recurrenceEndsAt ?? null;
      }
    }
  }

  if (
    hasOwn(input, "due_at") ||
    hasOwn(input, "due_timezone") ||
    recurrenceTouched
  ) {
    payload.due_timezone = normalizeTaskDueTimeZone(
      nextDueAt,
      input.due_timezone,
      input.browser_timezone,
      currentTask.due_timezone,
    );
  }

  if (Object.keys(payload).length === 0) return { ok: true, task: currentTask };

  const { data, error } = await supabaseAdmin
    .from("tracker_tasks")
    .update(payload)
    .eq("user_id", userId)
    .eq("id", taskId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  return { ok: true, task: data as TrackerTaskRow };
};

type TaskDeleteRow = {
  id: string;
  list_id: string;
  parent_task_id: string | null;
};

const collectTaskTreeForDelete = async (
  supabaseAdmin: SupabaseClient,
  userId: string,
  taskId: string,
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
    parent_task_id: rootTask.parent_task_id
      ? String(rootTask.parent_task_id)
      : null,
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

export const deleteTaskForUser = async (
  supabaseAdmin: SupabaseClient,
  userId: string,
  taskId: string,
) => {
  const taskRows = await collectTaskTreeForDelete(
    supabaseAdmin,
    userId,
    taskId,
  );
  if (!taskRows)
    return { ok: false as const, code: 404, error: "Task not found" };

  const taskIds = taskRows.map((row) => row.id);
  let calendarSyncWarning: string | null = null;

  for (const row of taskRows) {
    await queueTaskDeleteForUser(supabaseAdmin, userId, {
      listId: row.list_id,
      taskId: row.id,
      source: "api_task_delete",
    }).catch((error) => {
      calendarSyncWarning =
        "Task deleted, but calendar sync could not be queued.";
      console.error("Failed to enqueue live calendar task delete", error);
    });
  }

  await deleteCalendarLinksForTasks(supabaseAdmin, userId, taskIds);

  const { error: taskDeleteError } = await supabaseAdmin
    .from("tracker_tasks")
    .delete()
    .eq("user_id", userId)
    .in("id", taskIds);
  if (taskDeleteError) throw new Error(taskDeleteError.message);

  return { ok: true as const, calendarSyncWarning };
};

export const reorderTasksForUser = async (
  supabaseAdmin: SupabaseClient,
  userId: string,
  input: {
    list_id?: unknown;
    parent_task_id?: unknown;
    ordered_task_ids?: unknown;
  },
): Promise<ServiceResult<{ tasks: TrackerTaskRow[] }>> => {
  const listId = cleanOptionalString(input.list_id);
  if (!listId) return { ok: false, code: 400, error: "list_id is required" };

  const parentTaskId = cleanNullableString(input.parent_task_id, {
    trim: true,
  });
  if (
    !(
      parentTaskId === undefined ||
      parentTaskId === null ||
      typeof parentTaskId === "string"
    )
  ) {
    return { ok: false, code: 400, error: "Invalid parent_task_id" };
  }

  const orderedTaskIds = input.ordered_task_ids;
  if (
    !Array.isArray(orderedTaskIds) ||
    orderedTaskIds.some((id) => typeof id !== "string")
  ) {
    return {
      ok: false,
      code: 400,
      error: "ordered_task_ids must be an array of task ids",
    };
  }
  if (orderedTaskIds.length === 0)
    return { ok: false, code: 400, error: "ordered_task_ids is required" };
  const uniqueIds = new Set(orderedTaskIds);
  if (uniqueIds.size !== orderedTaskIds.length) {
    return {
      ok: false,
      code: 400,
      error: "ordered_task_ids must not contain duplicates",
    };
  }

  let siblingQuery = supabaseAdmin
    .from("tracker_tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("list_id", listId);
  siblingQuery = parentTaskId
    ? siblingQuery.eq("parent_task_id", parentTaskId)
    : siblingQuery.is("parent_task_id", null);
  const { data: siblingRows, error: siblingError } = await siblingQuery;
  if (siblingError) throw new Error(siblingError.message);

  const siblingById = new Map(
    ((siblingRows ?? []) as TrackerTaskRow[]).map((task) => [task.id, task]),
  );
  if (orderedTaskIds.some((taskId) => !siblingById.has(taskId))) {
    return {
      ok: false,
      code: 400,
      error: "ordered_task_ids contains an unknown task",
    };
  }
  if (orderedTaskIds.length !== siblingById.size) {
    return {
      ok: false,
      code: 400,
      error: "ordered_task_ids must include every sibling task",
    };
  }

  const updatedTasks: TrackerTaskRow[] = [];
  for (const [index, taskId] of orderedTaskIds.entries()) {
    const { data, error } = await supabaseAdmin
      .from("tracker_tasks")
      .update({ sort_order: index + 1 })
      .eq("user_id", userId)
      .eq("id", taskId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    updatedTasks.push(data as TrackerTaskRow);
  }

  return {
    ok: true,
    tasks: updatedTasks.sort(
      (left, right) => left.sort_order - right.sort_order,
    ),
  };
};
