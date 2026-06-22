import { DateTime } from "luxon";
import { SupabaseClient } from "@supabase/supabase-js";
import { TrackerTaskRow } from "../../types/googleCalendar";
import {
  isDateOnlyIso,
  isRecurringTask,
  isTaskOverdue,
  DATE_ONLY_MARKER_MS,
} from "../calendar/services/taskCalendarEventUtils";
import {
  drainCalendarSyncJobs,
  listUserSyncEnabledLists,
  queueManualSyncForUser,
  queueTaskUpsertForUser,
} from "../calendar/services/taskCalendarSyncService";
import {
  createTaskForUser,
  deleteTaskForUser,
  updateTaskForUser,
} from "../tasks-hub/services/taskMutationService";
import {
  fetchTaskListsForUser,
  fetchTasksForUser,
} from "../tasks-hub/services/taskReadService";
import { setTaskCompletionForUser } from "../tasks-hub/services/taskRecurrenceService";
import {
  isValidIanaTimeZone,
  normalizeListName,
} from "../tasks-hub/services/taskHubUtils";
import { TrackerTaskListRow } from "../tasks-hub/services/taskHubTypes";

const DEFAULT_TIME_ZONE = "America/Chicago";
const DATE_ONLY_INPUT_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const EXPLICIT_TIME_ZONE_REGEX = /(?:z|[+-]\d{2}:?\d{2})$/i;
const COMPLETED_TASK_DEFAULT_LIMIT = 10;
export const COMPLETED_TASK_MAX_LIMIT = 75;

export class TrackerMcpServiceError extends Error {
  constructor(
    message: string,
    public readonly code = 400,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "TrackerMcpServiceError";
  }
}

export interface TrackerMcpContext {
  supabaseAdmin: SupabaseClient;
  userId: string;
}

export interface TrackerMcpListReference {
  list_id?: string;
  list_name?: string;
}

export interface TrackerMcpTaskInput extends TrackerMcpListReference {
  title: string;
  details?: string | null;
  due_at?: string | null;
  due_timezone?: string | null;
  parent_task_id?: string | null;
  recurrence_type?: TrackerTaskRow["recurrence_type"];
  recurrence_interval?: number | null;
  recurrence_unit?: TrackerTaskRow["recurrence_unit"] | null;
  recurrence_ends_at?: string | null;
}

export interface TrackerMcpTaskUpdateInput extends TrackerMcpListReference {
  task_id: string;
  title?: string;
  details?: string | null;
  due_at?: string | null;
  due_timezone?: string | null;
  parent_task_id?: string | null;
  recurrence_type?: TrackerTaskRow["recurrence_type"];
  recurrence_interval?: number | null;
  recurrence_unit?: TrackerTaskRow["recurrence_unit"] | null;
  recurrence_ends_at?: string | null;
}

export interface TrackerMcpTaskDeleteInput {
  task_id: string;
  confirm_delete: boolean;
  confirm_delete_children?: boolean;
  expected_title?: string;
}

const hasOwn = (input: object, key: string) =>
  Object.prototype.hasOwnProperty.call(input, key);

const getDefaultTimeZone = () => {
  const configured =
    process.env.TRACKER_MCP_DEFAULT_TIMEZONE ||
    process.env.GOOGLE_EVENT_TIMEZONE ||
    DEFAULT_TIME_ZONE;
  return isValidIanaTimeZone(configured) ? configured : DEFAULT_TIME_ZONE;
};

const normalizeMcpTimeZone = (value: unknown) =>
  typeof value === "string" && isValidIanaTimeZone(value)
    ? value
    : getDefaultTimeZone();

const normalizeMcpDueAt = (
  value: unknown,
  fieldName = "due_at",
  timeZone = getDefaultTimeZone(),
) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") {
    throw new TrackerMcpServiceError(`${fieldName} must be a string or null.`);
  }

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (DATE_ONLY_INPUT_REGEX.test(trimmed)) {
    const parsed = DateTime.fromISO(trimmed, { zone: timeZone }).set({
      hour: 22,
      minute: 0,
      second: 0,
      millisecond: 0,
    });
    if (!parsed.isValid) {
      throw new TrackerMcpServiceError(`${fieldName} is not a valid date.`);
    }
    return parsed.toUTC().toISO({ suppressMilliseconds: false });
  }

  const parsed = EXPLICIT_TIME_ZONE_REGEX.test(trimmed)
    ? DateTime.fromISO(trimmed, { setZone: true })
    : DateTime.fromISO(trimmed, { zone: timeZone });
  if (!parsed.isValid) {
    throw new TrackerMcpServiceError(
      `${fieldName} must be ISO 8601, YYYY-MM-DD, or null.`,
    );
  }
  return parsed.set({ millisecond: 0 }).toUTC().toISO({
    suppressMilliseconds: false,
  });
};

const safeTimestamp = (value: string | null | undefined) => {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const sortTasksForDisplay = (tasks: TrackerTaskRow[]) =>
  [...tasks].sort((left, right) => {
    const leftParent = left.parent_task_id ?? "";
    const rightParent = right.parent_task_id ?? "";
    if (leftParent !== rightParent) return leftParent.localeCompare(rightParent);
    if (left.sort_order !== right.sort_order) {
      return left.sort_order - right.sort_order;
    }
    return safeTimestamp(left.created_at) - safeTimestamp(right.created_at);
  });

const sortCompletedTasks = (tasks: TrackerTaskRow[]) =>
  [...tasks].sort(
    (left, right) =>
      safeTimestamp(right.completed_at ?? right.updated_at) -
      safeTimestamp(left.completed_at ?? left.updated_at),
  );

const compactRecord = <T extends Record<string, unknown>>(input: T) =>
  Object.fromEntries(
    Object.entries(input).filter(
      ([, value]) => value !== undefined && value !== null,
    ),
  ) as Partial<T>;

const optionalText = (value: string | null | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const serializeTask = (
  task: TrackerTaskRow,
  options: {
    includeListId?: boolean;
    includeCompletion?: boolean;
    includeCompletionState?: boolean;
  } = {},
) => {
  const recurring = isRecurringTask(task);
  return compactRecord({
    id: task.id,
    list_id: options.includeListId ? task.list_id : undefined,
    parent_task_id: task.parent_task_id,
    title: task.title,
    details: optionalText(task.details),
    due_at: task.due_at,
    due_timezone: task.due_at ? task.due_timezone : undefined,
    due_kind: task.due_at
      ? isDateOnlyIso(task.due_at)
        ? "date"
        : "date_time"
      : undefined,
    is_completed: options.includeCompletionState
      ? task.is_completed
      : undefined,
    completed_at: options.includeCompletion ? task.completed_at : undefined,
    recurrence_type: recurring ? task.recurrence_type : undefined,
    recurrence_interval: recurring ? task.recurrence_interval : undefined,
    recurrence_unit: recurring ? task.recurrence_unit : undefined,
    recurrence_ends_at: recurring ? task.recurrence_ends_at : undefined,
  });
};

const serializeList = (list: TrackerTaskListRow) =>
  compactRecord({
    id: list.id,
    name: list.name,
    color_hex: list.color_hex,
    sort_order: list.sort_order,
  });

const getVisibleTrackerData = async (context: TrackerMcpContext) => {
  const [lists, tasks, syncSettings] = await Promise.all([
    fetchTaskListsForUser(context.supabaseAdmin, context.userId),
    fetchTasksForUser(context.supabaseAdmin, context.userId),
    listUserSyncEnabledLists(context.supabaseAdmin, context.userId),
  ]);
  const syncEnabledListIds = new Set(
    syncSettings
      .filter((setting) => setting.sync_enabled)
      .map((setting) => setting.list_id),
  );
  const visibleLists = lists.filter((list) => syncEnabledListIds.has(list.id));
  const visibleListIds = new Set(visibleLists.map((list) => list.id));
  const visibleTasks = tasks.filter((task) => visibleListIds.has(task.list_id));

  return {
    visibleLists,
    visibleListIds,
    visibleTasks,
  };
};

const getCalendarConnectionSummary = async (context: TrackerMcpContext) => {
  const { data, error } = await context.supabaseAdmin
    .from("tracker_google_calendar_connections_public")
    .select("status,last_error")
    .eq("user_id", context.userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as
    | {
        status: string | null;
        last_error: string | null;
      }
    | null;
};

const resolveSingleVisibleList = async (
  context: TrackerMcpContext,
  reference: TrackerMcpListReference,
  options?: { required?: boolean },
) => {
  const { visibleLists } = await getVisibleTrackerData(context);
  const listId = reference.list_id?.trim();
  const listName = reference.list_name?.trim();

  if (listId && listName) {
    throw new TrackerMcpServiceError(
      "Provide either list_id or list_name, not both.",
      400,
      { visible_lists: visibleLists.map(serializeList) },
    );
  }
  if (!listId && !listName) {
    if (options?.required) {
      throw new TrackerMcpServiceError(
        "A calendar-synced list_id or exact list_name is required.",
        400,
        { visible_lists: visibleLists.map(serializeList) },
      );
    }
    return null;
  }

  if (listId) {
    const list = visibleLists.find((candidate) => candidate.id === listId);
    if (!list) {
      throw new TrackerMcpServiceError(
        "List not found in MCP-visible calendar-synced lists.",
        404,
        { visible_lists: visibleLists.map(serializeList) },
      );
    }
    return list;
  }

  const normalized = normalizeListName(listName ?? "");
  const matches = visibleLists.filter(
    (candidate) => normalizeListName(candidate.name) === normalized,
  );
  if (matches.length === 1) return matches[0];

  throw new TrackerMcpServiceError(
    matches.length > 1
      ? "List name is ambiguous. Use list_id."
      : "List not found in MCP-visible calendar-synced lists.",
    matches.length > 1 ? 400 : 404,
    { visible_lists: visibleLists.map(serializeList) },
  );
};

const getRequestedVisibleLists = async (
  context: TrackerMcpContext,
  reference: TrackerMcpListReference,
) => {
  const data = await getVisibleTrackerData(context);
  const selectedList = await resolveSingleVisibleList(context, reference);
  return {
    ...data,
    selectedLists: selectedList ? [selectedList] : data.visibleLists,
  };
};

const getVisibleTaskOrThrow = async (
  context: TrackerMcpContext,
  taskId: string,
) => {
  const data = await getVisibleTrackerData(context);
  const task = data.visibleTasks.find((candidate) => candidate.id === taskId);
  if (!task) {
    throw new TrackerMcpServiceError(
      "Task not found in MCP-visible calendar-synced lists.",
      404,
      { visible_lists: data.visibleLists.map(serializeList) },
    );
  }
  return { ...data, task };
};

const queueTaskUpsertBestEffort = async (
  context: TrackerMcpContext,
  task: Pick<TrackerTaskRow, "id" | "list_id" | "updated_at">,
  source: string,
) => {
  try {
    await queueTaskUpsertForUser(
      context.supabaseAdmin,
      context.userId,
      task,
      source,
    );
  } catch (error) {
    console.error("Failed to enqueue MCP calendar task sync", error);
    return;
  }
  await drainLiveSyncBestEffort(context);
};

const drainLiveSyncBestEffort = async (context: TrackerMcpContext) => {
  try {
    await drainCalendarSyncJobs({
      userId: context.userId,
      lanes: ["live"],
      batchSize: 10,
      maxJobs: 50,
      maxMs: 20_000,
    });
  } catch (error) {
    console.error("Failed to drain MCP live calendar sync", error);
  }
};

const getDueDay = (
  task: Pick<TrackerTaskRow, "due_at" | "due_timezone">,
  fallbackTimeZone: string,
) => {
  if (!task.due_at) return null;
  const parsed = DateTime.fromISO(task.due_at, { zone: "utc" });
  if (!parsed.isValid) return null;
  const zone = isValidIanaTimeZone(task.due_timezone)
    ? (task.due_timezone as string)
    : fallbackTimeZone;
  return parsed.setZone(zone).toISODate();
};

const summarizeTasksForList = (
  list: TrackerTaskListRow,
  tasks: TrackerTaskRow[],
  now: DateTime<true>,
  fallbackTimeZone: string,
) => {
  const listTasks = tasks.filter((task) => task.list_id === list.id);
  const activeTasks = listTasks.filter((task) => !task.is_completed);
  const completedTasks = listTasks.filter((task) => task.is_completed);
  let overdue = 0;
  let today = 0;
  let tomorrow = 0;
  let noDue = 0;
  let recurringActive = 0;

  for (const task of activeTasks) {
    if (!task.due_at) {
      noDue += 1;
    } else {
      const zone = isValidIanaTimeZone(task.due_timezone)
        ? (task.due_timezone as string)
        : fallbackTimeZone;
      const dueDay = getDueDay(task, fallbackTimeZone);
      const nowInZone = now.setZone(zone);
      if (dueDay && dueDay === nowInZone.toISODate()) today += 1;
      if (dueDay && dueDay === nowInZone.plus({ days: 1 }).toISODate()) {
        tomorrow += 1;
      }
      if (isTaskOverdue(task, now)) overdue += 1;
    }
    if (isRecurringTask(task)) recurringActive += 1;
  }

  return {
    ...serializeList(list),
    counts: {
      active: activeTasks.length,
      completed: completedTasks.length,
      total: listTasks.length,
      overdue,
      today,
      tomorrow,
      no_due: noDue,
      recurring_active: recurringActive,
    },
  };
};

export const getTrackerSnapshot = async (
  context: TrackerMcpContext,
  input?: { timezone?: string | null },
) => {
  const data = await getVisibleTrackerData(context);
  const fallbackTimeZone = normalizeMcpTimeZone(input?.timezone);
  const now = DateTime.utc();
  const lists = data.visibleLists.map((list) =>
    summarizeTasksForList(list, data.visibleTasks, now, fallbackTimeZone),
  );
  const totals = lists.reduce(
    (acc, item) => {
      Object.entries(item.counts).forEach(([key, value]) => {
        acc[key as keyof typeof acc] += value;
      });
      return acc;
    },
    {
      active: 0,
      completed: 0,
      total: 0,
      overdue: 0,
      today: 0,
      tomorrow: 0,
      no_due: 0,
      recurring_active: 0,
    },
  );

  const calendarStatus = await getCalendarConnectionSummary(context).catch(
    () => null,
  );

  return {
    timezone: fallbackTimeZone,
    calendar: calendarStatus
      ? compactRecord({
          connected: calendarStatus.status === "connected",
          status: calendarStatus.status,
          last_error: calendarStatus.last_error ?? null,
        })
      : null,
    totals,
    lists,
  };
};

export const listTasks = async (
  context: TrackerMcpContext,
  input: TrackerMcpListReference = {},
) => {
  const data = await getRequestedVisibleLists(context, input);
  return {
    lists: data.selectedLists.map((list) => {
      const activeTasks = sortTasksForDisplay(
        data.visibleTasks.filter(
          (task) => task.list_id === list.id && !task.is_completed,
        ),
      );
      return {
        ...serializeList(list),
        active_task_count: activeTasks.length,
        tasks: activeTasks.map((task) => serializeTask(task)),
      };
    }),
  };
};

export const listCompletedTasks = async (
  context: TrackerMcpContext,
  input: TrackerMcpListReference & { limit_per_list?: number } = {},
) => {
  const data = await getRequestedVisibleLists(context, input);
  const limitPerList = Math.max(
    1,
    Math.min(
      Number.isFinite(input.limit_per_list)
        ? Math.floor(input.limit_per_list as number)
        : COMPLETED_TASK_DEFAULT_LIMIT,
      COMPLETED_TASK_MAX_LIMIT,
    ),
  );

  return {
    limit_per_list: limitPerList,
    lists: data.selectedLists.map((list) => {
      const completedTasks = sortCompletedTasks(
        data.visibleTasks.filter(
          (task) => task.list_id === list.id && task.is_completed,
        ),
      );
      const tasks = completedTasks.slice(0, limitPerList);
      return {
        ...serializeList(list),
        completed_task_count: completedTasks.length,
        returned_task_count: tasks.length,
        tasks: tasks.map((task) =>
          serializeTask(task, { includeCompletion: true }),
        ),
      };
    }),
  };
};

export const createMcpTask = async (
  context: TrackerMcpContext,
  input: TrackerMcpTaskInput,
) => {
  const targetList = await resolveSingleVisibleList(context, input, {
    required: true,
  });
  if (!targetList) {
    throw new TrackerMcpServiceError("A visible list is required.");
  }

  const dueTimeZone = normalizeMcpTimeZone(input.due_timezone);
  const dueAt = normalizeMcpDueAt(input.due_at ?? null, "due_at", dueTimeZone);
  const taskDueTimeZone = dueAt ? dueTimeZone : null;
  const result = await createTaskForUser(context.supabaseAdmin, context.userId, {
    ...input,
    list_id: targetList.id,
    due_at: dueAt,
    due_timezone: taskDueTimeZone,
    browser_timezone: dueTimeZone,
  });
  if (!result.ok) {
    throw new TrackerMcpServiceError(result.error, result.code);
  }

  await queueTaskUpsertBestEffort(context, result.task, "mcp_task_create");
  return {
    task: serializeTask(result.task, {
      includeListId: true,
      includeCompletionState: true,
    }),
  };
};

export const updateMcpTask = async (
  context: TrackerMcpContext,
  input: TrackerMcpTaskUpdateInput,
) => {
  const current = await getVisibleTaskOrThrow(context, input.task_id);
  const payload: Record<string, unknown> = {};

  if (hasOwn(input, "list_id") || hasOwn(input, "list_name")) {
    const targetList = await resolveSingleVisibleList(context, input, {
      required: true,
    });
    payload.list_id = targetList?.id;
  }
  for (const field of [
    "title",
    "details",
    "parent_task_id",
    "recurrence_type",
    "recurrence_interval",
    "recurrence_unit",
    "recurrence_ends_at",
  ] as const) {
    if (hasOwn(input, field)) payload[field] = input[field];
  }
  const nextDueTimeZone = hasOwn(input, "due_timezone")
    ? normalizeMcpTimeZone(input.due_timezone)
    : normalizeMcpTimeZone(current.task.due_timezone);
  if (hasOwn(input, "due_at")) {
    payload.due_at = normalizeMcpDueAt(
      input.due_at,
      "due_at",
      nextDueTimeZone,
    );
  }
  if (hasOwn(input, "due_timezone")) {
    payload.due_timezone = nextDueTimeZone;
    payload.browser_timezone = payload.due_timezone;
  } else if (hasOwn(input, "due_at")) {
    payload.browser_timezone = nextDueTimeZone;
  }

  const result = await updateTaskForUser(
    context.supabaseAdmin,
    context.userId,
    input.task_id,
    payload,
  );
  if (!result.ok) {
    throw new TrackerMcpServiceError(result.error, result.code);
  }

  await getVisibleTaskOrThrow(context, result.task.id);
  await queueTaskUpsertBestEffort(context, result.task, "mcp_task_update");
  return {
    task: serializeTask(result.task, {
      includeListId: true,
      includeCompletion: true,
      includeCompletionState: true,
    }),
  };
};

export const completeMcpTask = async (
  context: TrackerMcpContext,
  taskId: string,
) => {
  await getVisibleTaskOrThrow(context, taskId);
  const result = await setTaskCompletionForUser(
    context.supabaseAdmin,
    context.userId,
    taskId,
    true,
  );
  if (!result.ok) {
    throw new TrackerMcpServiceError(result.error, result.code);
  }

  await queueTaskUpsertBestEffort(context, result.task, "mcp_task_completion");
  if (result.createdNextTask) {
    await queueTaskUpsertBestEffort(
      context,
      result.createdNextTask,
      "mcp_task_completion_next",
    );
  }

  return compactRecord({
    task: serializeTask(result.task, {
      includeListId: true,
      includeCompletion: true,
      includeCompletionState: true,
    }),
    created_next_task: result.createdNextTask
      ? serializeTask(result.createdNextTask, {
          includeListId: true,
          includeCompletionState: true,
        })
      : undefined,
  });
};

export const uncompleteMcpTask = async (
  context: TrackerMcpContext,
  taskId: string,
) => {
  await getVisibleTaskOrThrow(context, taskId);
  const result = await setTaskCompletionForUser(
    context.supabaseAdmin,
    context.userId,
    taskId,
    false,
  );
  if (!result.ok) {
    throw new TrackerMcpServiceError(result.error, result.code);
  }

  await queueTaskUpsertBestEffort(context, result.task, "mcp_task_uncomplete");
  return {
    task: serializeTask(result.task, {
      includeListId: true,
      includeCompletionState: true,
    }),
  };
};

const collectTaskSubtree = (tasks: TrackerTaskRow[], rootTaskId: string) => {
  const byParent = new Map<string | null, TrackerTaskRow[]>();
  for (const task of tasks) {
    const parentId = task.parent_task_id ?? null;
    byParent.set(parentId, [...(byParent.get(parentId) ?? []), task]);
  }

  const subtree: TrackerTaskRow[] = [];
  const queue = [rootTaskId];
  const seen = new Set<string>();
  while (queue.length > 0) {
    const taskId = queue.shift()!;
    if (seen.has(taskId)) continue;
    seen.add(taskId);
    const task = tasks.find((candidate) => candidate.id === taskId);
    if (task) subtree.push(task);
    for (const child of byParent.get(taskId) ?? []) {
      queue.push(child.id);
    }
  }
  return subtree;
};

export const deleteMcpTask = async (
  context: TrackerMcpContext,
  input: TrackerMcpTaskDeleteInput,
) => {
  if (!input.confirm_delete) {
    throw new TrackerMcpServiceError(
      "confirm_delete must be true to delete a task.",
      400,
    );
  }
  const data = await getVisibleTaskOrThrow(context, input.task_id);
  if (
    input.expected_title &&
    input.expected_title.trim() &&
    input.expected_title.trim() !== data.task.title
  ) {
    throw new TrackerMcpServiceError(
      "expected_title does not match the task title; delete refused.",
      409,
      { actual_title: data.task.title },
    );
  }

  const subtree = collectTaskSubtree(data.visibleTasks, input.task_id);
  if (subtree.length > 1 && !input.confirm_delete_children) {
    throw new TrackerMcpServiceError(
      "Task has subtasks. Set confirm_delete_children to true to delete the whole subtree.",
      400,
      {
        child_task_count: subtree.length - 1,
        child_task_ids: subtree.slice(1).map((task) => task.id),
      },
    );
  }

  const result = await deleteTaskForUser(
    context.supabaseAdmin,
    context.userId,
    input.task_id,
  );
  if (!result.ok) {
    throw new TrackerMcpServiceError(result.error, result.code);
  }
  await drainLiveSyncBestEffort(context);

  return {
    deleted_task_id: input.task_id,
    deleted_task_title: data.task.title,
    deleted_task_count: subtree.length,
    deleted_task_ids: subtree.map((task) => task.id),
  };
};

export const syncCalendarNow = async (context: TrackerMcpContext) => {
  if (process.env.CALENDAR_SYNC_ENABLED === "0") {
    throw new TrackerMcpServiceError("Calendar sync is disabled.", 503);
  }

  const runId = await queueManualSyncForUser(
    context.supabaseAdmin,
    context.userId,
  );
  const drain = await drainCalendarSyncJobs({
    userId: context.userId,
    batchSize: 10,
    maxJobs: 120,
    maxMs: 20_000,
    lanes: ["reconcile"],
  });
  return {
    run_id: runId,
    queued: true,
    processed: drain.processed,
    failed: drain.failed,
    exhausted: drain.exhausted,
  };
};
