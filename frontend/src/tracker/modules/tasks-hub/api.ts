import {
  CalendarConnectionState,
  LivePumpResult,
  ListUpdateInput,
  SyncNowResult,
  SyncProgressResult,
  SortDirection,
  TaskCompletionResult,
  TaskList,
  TaskSortMode,
  TaskSortPreference,
  TaskUpdateInput,
  TrackerTask,
} from "./types";
import { getApiBaseUrl } from "../../../shared/lib/apiBaseUrl";

const API_BASE = getApiBaseUrl();

interface TrackerBootstrapResult {
  ok: boolean;
  lists: TaskList[];
  tasks: TrackerTask[];
  sort_preferences: TaskSortPreference[];
}

interface TaskListCreateInput {
  name: string;
  color_hex?: string;
}

interface TaskCreateInput {
  list_id: string;
  parent_task_id: string | null;
  title: string;
  details: string | null;
  due_at: string | null;
  due_timezone: string | null;
  recurrence_type: TrackerTask["recurrence_type"];
  recurrence_interval: number | null;
  recurrence_unit: TrackerTask["recurrence_unit"];
  recurrence_ends_at: string | null;
  browser_timezone: string;
}

interface TaskResult {
  ok: boolean;
  task: TrackerTask;
}

interface TaskListResult {
  ok: boolean;
  list: TaskList;
}

interface TaskReorderResult {
  ok: boolean;
  tasks: TrackerTask[];
}

interface TaskListReorderResult {
  ok: boolean;
  lists: TaskList[];
}

interface SortPreferenceResult {
  ok: boolean;
  sort_preference: TaskSortPreference;
}

const getAuthHeaders = (accessToken: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${accessToken}`,
});

const readJson = async <T>(
  res: Response,
  fallbackError: string,
): Promise<T> => {
  const body = await res.json().catch(() => ({}) as { error?: string });
  if (!res.ok) {
    const errorMessage =
      typeof body === "object" && body !== null && "error" in body
        ? String((body as { error?: unknown }).error || fallbackError)
        : fallbackError;
    throw new Error(errorMessage);
  }
  return body as T;
};

export const fetchTrackerBootstrap = async (
  accessToken: string,
  browserTimeZone: string,
): Promise<TrackerBootstrapResult> => {
  const res = await fetch(`${API_BASE}/api/private/tracker/bootstrap`, {
    method: "POST",
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify({
      browser_timezone: browserTimeZone,
    }),
  });
  return readJson<TrackerBootstrapResult>(res, "Failed to load tasks.");
};

export const createTaskList = async (
  accessToken: string,
  payload: TaskListCreateInput,
): Promise<TaskList> => {
  const res = await fetch(`${API_BASE}/api/private/lists`, {
    method: "POST",
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify(payload),
  });
  const result = await readJson<TaskListResult>(res, "Failed to create list.");
  return result.list;
};

export const updateTaskList = async (
  accessToken: string,
  listId: string,
  updates: ListUpdateInput,
): Promise<TaskList> => {
  const res = await fetch(
    `${API_BASE}/api/private/lists/${encodeURIComponent(listId)}`,
    {
      method: "PATCH",
      headers: getAuthHeaders(accessToken),
      body: JSON.stringify(updates),
    },
  );
  const result = await readJson<TaskListResult>(res, "Failed to update list.");
  return result.list;
};

export const reorderTaskLists = async (
  accessToken: string,
  orderedListIds: string[],
): Promise<TaskList[]> => {
  const res = await fetch(`${API_BASE}/api/private/lists/reorder`, {
    method: "PATCH",
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify({
      ordered_list_ids: orderedListIds,
    }),
  });
  const result = await readJson<TaskListReorderResult>(
    res,
    "Failed to persist list order.",
  );
  return result.lists;
};

export const deleteTaskListViaApi = async (
  accessToken: string,
  listId: string,
): Promise<{ ok: boolean }> => {
  const res = await fetch(
    `${API_BASE}/api/private/lists/${encodeURIComponent(listId)}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(accessToken),
    },
  );
  return readJson<{ ok: boolean }>(res, "Failed to delete list");
};

export const createTask = async (
  accessToken: string,
  payload: TaskCreateInput,
): Promise<TrackerTask> => {
  const res = await fetch(`${API_BASE}/api/private/tasks`, {
    method: "POST",
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify(payload),
  });
  const result = await readJson<TaskResult>(res, "Failed to create task.");
  return result.task;
};

export const updateTask = async (
  accessToken: string,
  taskId: string,
  updates: TaskUpdateInput & { browser_timezone?: string },
): Promise<TrackerTask> => {
  const res = await fetch(
    `${API_BASE}/api/private/tasks/${encodeURIComponent(taskId)}`,
    {
      method: "PATCH",
      headers: getAuthHeaders(accessToken),
      body: JSON.stringify(updates),
    },
  );
  const result = await readJson<TaskResult>(res, "Failed to save task.");
  return result.task;
};

export const reorderTasksViaApi = async (
  accessToken: string,
  listId: string,
  parentTaskId: string | null,
  orderedTaskIds: string[],
): Promise<TrackerTask[]> => {
  const res = await fetch(`${API_BASE}/api/private/tasks/reorder`, {
    method: "PATCH",
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify({
      list_id: listId,
      parent_task_id: parentTaskId,
      ordered_task_ids: orderedTaskIds,
    }),
  });
  const result = await readJson<TaskReorderResult>(
    res,
    "Failed to persist custom order.",
  );
  return result.tasks;
};

export const deleteTaskViaApi = async (
  accessToken: string,
  taskId: string,
): Promise<{ ok: boolean }> => {
  const res = await fetch(
    `${API_BASE}/api/private/tasks/${encodeURIComponent(taskId)}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(accessToken),
    },
  );
  return readJson<{ ok: boolean }>(res, "Failed to delete task");
};

export const setTaskCompletionViaApi = async (
  accessToken: string,
  taskId: string,
  isCompleted: boolean,
): Promise<TaskCompletionResult> => {
  const res = await fetch(
    `${API_BASE}/api/private/tasks/${encodeURIComponent(taskId)}/completion`,
    {
      method: "PATCH",
      headers: getAuthHeaders(accessToken),
      body: JSON.stringify({
        is_completed: isCompleted,
      }),
    },
  );
  return readJson<TaskCompletionResult>(res, "Failed to update task status");
};

export const upsertSortPreference = async (
  accessToken: string,
  listId: string,
  sortMode: TaskSortMode,
  sortDirection: SortDirection,
): Promise<TaskSortPreference> => {
  const res = await fetch(
    `${API_BASE}/api/private/task-sort-preferences/${encodeURIComponent(listId)}`,
    {
      method: "PUT",
      headers: getAuthHeaders(accessToken),
      body: JSON.stringify({
        sort_mode: sortMode,
        sort_direction: sortDirection,
      }),
    },
  );
  const result = await readJson<SortPreferenceResult>(
    res,
    "Failed to save sort preference.",
  );
  return result.sort_preference;
};

export const getCalendarStatus = async (
  accessToken: string,
): Promise<CalendarConnectionState> => {
  const res = await fetch(`${API_BASE}/api/private/calendar/status`, {
    method: "GET",
    headers: getAuthHeaders(accessToken),
  });
  return readJson<CalendarConnectionState>(
    res,
    "Failed to fetch calendar status",
  );
};

export const getGoogleConnectUrl = async (
  accessToken: string,
): Promise<{ url: string }> => {
  const res = await fetch(
    `${API_BASE}/api/private/calendar/google/connect-url`,
    {
      method: "POST",
      headers: getAuthHeaders(accessToken),
    },
  );
  return readJson<{ url: string }>(
    res,
    "Failed to generate Google connect URL",
  );
};

export const disconnectCalendar = async (
  accessToken: string,
): Promise<{ ok: boolean }> => {
  const res = await fetch(`${API_BASE}/api/private/calendar/disconnect`, {
    method: "POST",
    headers: getAuthHeaders(accessToken),
  });
  return readJson<{ ok: boolean }>(res, "Failed to disconnect calendar");
};

export const setListSync = async (
  accessToken: string,
  listId: string,
  syncEnabled: boolean,
): Promise<{
  ok: boolean;
  run_id?: string;
  queued_cleanup?: boolean;
  cleanup_job_count?: number;
}> => {
  const res = await fetch(`${API_BASE}/api/private/calendar/list-sync`, {
    method: "POST",
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify({
      list_id: listId,
      sync_enabled: syncEnabled,
    }),
  });
  return readJson<{
    ok: boolean;
    run_id?: string;
    queued_cleanup?: boolean;
    cleanup_job_count?: number;
  }>(res, "Failed to update list sync setting");
};

export const triggerCalendarSyncNow = async (
  accessToken: string,
): Promise<SyncNowResult> => {
  const res = await fetch(`${API_BASE}/api/private/calendar/sync-now`, {
    method: "POST",
    headers: getAuthHeaders(accessToken),
  });
  return readJson<SyncNowResult>(res, "Failed to sync calendar");
};

export const triggerCalendarLivePump = async (
  accessToken: string,
): Promise<LivePumpResult> => {
  const res = await fetch(`${API_BASE}/api/private/calendar/live-pump`, {
    method: "POST",
    headers: getAuthHeaders(accessToken),
  });
  return readJson<LivePumpResult>(res, "Failed to process live sync");
};

export const triggerCalendarRebuild = async (
  accessToken: string,
): Promise<SyncNowResult> => {
  const res = await fetch(`${API_BASE}/api/private/calendar/rebuild`, {
    method: "POST",
    headers: getAuthHeaders(accessToken),
  });
  return readJson<SyncNowResult>(res, "Failed to start rebuild");
};

export const getCalendarSyncProgress = async (
  accessToken: string,
  runId: string,
): Promise<SyncProgressResult> => {
  const res = await fetch(
    `${API_BASE}/api/private/calendar/sync-progress?run_id=${encodeURIComponent(runId)}`,
    {
      method: "GET",
      headers: getAuthHeaders(accessToken),
    },
  );
  return readJson<SyncProgressResult>(res, "Failed to fetch sync progress");
};
