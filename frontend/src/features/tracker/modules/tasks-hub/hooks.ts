import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createTask,
  createTaskList,
  disconnectCalendar,
  deleteTask,
  deleteTaskList,
  fetchSortPreferences,
  fetchTaskLists,
  fetchTasks,
  getCalendarStatus,
  getGoogleConnectUrl,
  setListSync,
  triggerCalendarSyncNow,
  updateTask,
  updateTaskList,
  upsertSortPreference,
} from "./api";
import {
  CalendarConnectionState,
  RecurrenceType,
  SortDirection,
  TaskDraft,
  TaskList,
  TaskSortMode,
  TaskSortPreference,
  TrackerTask,
  TaskUpdateInput,
} from "./types";
import { useTrackerContext } from "../../shared/hooks/useTrackerContext";

const ALL_LISTS_KEY = "all";
const DEFAULT_LIST_NAME = "General";
const DEFAULT_SORT_MODE: TaskSortMode = "custom";
const DEFAULT_SORT_DIRECTION: SortDirection = "asc";
const LIST_COLOR_POOL = [
  "#00FFFF",
  "#BFFF00",
  "#FF6B9D",
  "#FFE600",
  "#B388FF",
  "#FF9500",
  "#0066FF",
];

const toIsoOrNull = (dateTimeLocal: string): string | null => {
  const trimmed = dateTimeLocal.trim();
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
};

const computeNextDueAt = (task: TrackerTask): string | null => {
  const base = task.due_at ? new Date(task.due_at) : new Date();
  if (Number.isNaN(base.getTime())) return null;

  const recurrence = task.recurrence_type;
  if (recurrence === "none") return null;

  const next = new Date(base);

  if (recurrence === "daily") {
    next.setDate(next.getDate() + 1);
  } else if (recurrence === "weekly") {
    next.setDate(next.getDate() + 7);
  } else if (recurrence === "biweekly") {
    next.setDate(next.getDate() + 14);
  } else {
    const interval = Math.max(task.recurrence_interval ?? 1, 1);
    const unit = task.recurrence_unit ?? "day";
    if (unit === "month") {
      next.setMonth(next.getMonth() + interval);
    } else if (unit === "week") {
      next.setDate(next.getDate() + interval * 7);
    } else {
      next.setDate(next.getDate() + interval);
    }
  }

  if (task.recurrence_ends_at) {
    const end = new Date(task.recurrence_ends_at);
    if (!Number.isNaN(end.getTime()) && next > end) {
      return null;
    }
  }

  return next.toISOString();
};

const isRecurring = (recurrenceType: RecurrenceType) => recurrenceType !== "none";

const buildTaskDraft = (listId: string, parentTaskId: string | null = null): TaskDraft => ({
  list_id: listId,
  parent_task_id: parentTaskId,
  title: "",
  details: "",
  due_at: "",
  recurrence_type: "none",
  recurrence_interval: 1,
  recurrence_unit: "week",
  recurrence_ends_at: "",
});

const normalizeListName = (name: string) => name.trim().replace(/\s+/g, " ").toLocaleLowerCase();
const pickAutoListColor = (existingColors: string[]) => {
  const existing = new Set(existingColors.map((color) => color.toLocaleLowerCase()));
  const available = LIST_COLOR_POOL.filter((color) => !existing.has(color.toLocaleLowerCase()));
  const palette = available.length > 0 ? available : LIST_COLOR_POOL;
  return palette[Math.floor(Math.random() * palette.length)];
};

export const useTasksHubModule = () => {
  const { supabase, userId, session, startLoading, stopLoading } = useTrackerContext();

  const [lists, setLists] = useState<TaskList[]>([]);
  const [tasks, setTasks] = useState<TrackerTask[]>([]);
  const [sortPreferences, setSortPreferences] = useState<TaskSortPreference[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>(ALL_LISTS_KEY);
  const [showCompleted, setShowCompleted] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [calendarState, setCalendarState] = useState<CalendarConnectionState | null>(null);
  const [calendarBusy, setCalendarBusy] = useState(false);
  const [calendarSyncResult, setCalendarSyncResult] = useState<{ processed: number; failed: number } | null>(null);
  const syncTimerRef = useRef<number | null>(null);

  const runWithLoading = useCallback(
    async <T>(fn: () => Promise<T>) => {
      startLoading();
      try {
        return await fn();
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading]
  );

  const fetchAll = useCallback(async () => {
    if (!userId) return;

    await runWithLoading(async () => {
      const [listResult, taskResult, prefResult] = await Promise.all([
        fetchTaskLists(supabase, userId),
        fetchTasks(supabase, userId),
        fetchSortPreferences(supabase, userId),
      ]);

      if (listResult.error || taskResult.error || prefResult.error) {
        const firstError = listResult.error || taskResult.error || prefResult.error;
        setErrorMessage(firstError?.message || "Failed to load tasks.");
        return;
      }

      let nextLists = listResult.data;
      if (nextLists.length === 0) {
        const seeded = await createTaskList(supabase, {
          user_id: userId,
          name: DEFAULT_LIST_NAME,
          color_hex: pickAutoListColor([]),
          sort_order: 1,
          archived: false,
        });

        if (seeded.error || !seeded.data) {
          setErrorMessage(seeded.error?.message || "Failed to initialize your first task list.");
          return;
        }

        nextLists = [seeded.data];
      }

      setLists(nextLists);
      setTasks(taskResult.data);
      setSortPreferences(prefResult.data);
      setErrorMessage("");
    });
  }, [runWithLoading, supabase, userId]);

  useEffect(() => {
    if (!userId) return;
    fetchAll();
  }, [userId, fetchAll]);

  const loadCalendarStatus = useCallback(async () => {
    if (!session?.access_token) {
      setCalendarState(null);
      return null;
    }
    try {
      const status = await getCalendarStatus(session.access_token);
      setCalendarState(status);
      return status;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load calendar status";
      setErrorMessage(message);
      return null;
    }
  }, [session?.access_token]);

  useEffect(() => {
    if (!session?.access_token) return;
    loadCalendarStatus();
  }, [session?.access_token, loadCalendarStatus]);

  useEffect(() => {
    if (selectedListId === ALL_LISTS_KEY) return;

    const listStillExists = lists.some((list) => list.id === selectedListId);
    if (!listStillExists) {
      setSelectedListId(ALL_LISTS_KEY);
    }
  }, [lists, selectedListId]);

  const listIds = useMemo(() => new Set(lists.map((list) => list.id)), [lists]);

  const tasksForKnownLists = useMemo(
    () => tasks.filter((task) => listIds.has(task.list_id)),
    [tasks, listIds]
  );

  const tasksByParent = useMemo(() => {
    const grouped: Record<string, TrackerTask[]> = {};

    tasksForKnownLists.forEach((task) => {
      if (!task.parent_task_id) return;
      const bucket = grouped[task.parent_task_id] || [];
      bucket.push(task);
      grouped[task.parent_task_id] = bucket;
    });

    return grouped;
  }, [tasksForKnownLists]);

  const rootTasksByList = useMemo(() => {
    const grouped: Record<string, TrackerTask[]> = {};

    lists.forEach((list) => {
      const roots = tasksForKnownLists.filter(
        (task) => task.list_id === list.id && !task.parent_task_id
      );
      grouped[list.id] = roots;
    });

    return grouped;
  }, [lists, tasksForKnownLists]);

  const countsByList = useMemo(() => {
    const counts: Record<string, { total: number; open: number; completed: number }> = {};

    lists.forEach((list) => {
      const listTasks = tasksForKnownLists.filter((task) => task.list_id === list.id);
      const completed = listTasks.filter((task) => task.is_completed).length;
      counts[list.id] = {
        total: listTasks.length,
        completed,
        open: listTasks.length - completed,
      };
    });

    return counts;
  }, [lists, tasksForKnownLists]);

  const totalOpenCount = useMemo(
    () => Object.values(countsByList).reduce((sum, item) => sum + item.open, 0),
    [countsByList]
  );

  const totalCompletedCount = useMemo(
    () => Object.values(countsByList).reduce((sum, item) => sum + item.completed, 0),
    [countsByList]
  );

  const totalTaskCount = useMemo(
    () => Object.values(countsByList).reduce((sum, item) => sum + item.total, 0),
    [countsByList]
  );

  const getNextListSortOrder = useCallback(() => {
    if (lists.length === 0) return 1;
    return Math.max(...lists.map((list) => list.sort_order)) + 1;
  }, [lists]);

  const getNextTaskSortOrder = useCallback(
    (listId: string, parentTaskId: string | null) => {
      const siblings = tasksForKnownLists.filter(
        (task) => task.list_id === listId && task.parent_task_id === parentTaskId
      );
      if (siblings.length === 0) return 1;
      return Math.max(...siblings.map((task) => task.sort_order)) + 1;
    },
    [tasksForKnownLists]
  );

  const createList = useCallback(
    async (name: string, colorHex?: string) => {
      const cleanedName = name.trim();
      if (!cleanedName) return null;

      const existingListName = lists.find(
        (list) => normalizeListName(list.name) === normalizeListName(cleanedName)
      );
      if (existingListName) {
        setErrorMessage(`List "${existingListName.name}" already exists.`);
        return null;
      }

      setIsSaving(true);
      const assignedColor = colorHex || pickAutoListColor(lists.map((list) => list.color_hex));
      const result = await createTaskList(supabase, {
        user_id: userId,
        name: cleanedName,
        color_hex: assignedColor,
        sort_order: getNextListSortOrder(),
        archived: false,
      });
      setIsSaving(false);

      if (result.error || !result.data) {
        if (result.error?.code === "23505") {
          setErrorMessage(`List "${cleanedName}" already exists.`);
        } else {
          setErrorMessage(result.error?.message || "Failed to create list.");
        }
        return null;
      }

      setLists((prev) => [...prev, result.data as TaskList]);
      setSelectedListId(result.data.id);
      setErrorMessage("");
      return result.data;
    },
    [getNextListSortOrder, lists, supabase, userId]
  );

  const saveList = useCallback(
    async (listId: string, updates: { name?: string; color_hex?: string }) => {
      const payload: { name?: string; color_hex?: string } = {};
      if (typeof updates.name === "string") {
        const cleanedName = updates.name.trim();
        if (!cleanedName) return false;

        const duplicate = lists.find(
          (list) =>
            list.id !== listId &&
            normalizeListName(list.name) === normalizeListName(cleanedName)
        );
        if (duplicate) {
          setErrorMessage(`List "${duplicate.name}" already exists.`);
          return false;
        }

        payload.name = cleanedName;
      }
      if (typeof updates.color_hex === "string") {
        payload.color_hex = updates.color_hex;
      }

      if (Object.keys(payload).length === 0) return true;

      const result = await updateTaskList(supabase, userId, listId, payload);
      if (result.error || !result.data) {
        if (result.error?.code === "23505") {
          setErrorMessage("Another list already has that name.");
        } else {
          setErrorMessage(result.error?.message || "Failed to update list.");
        }
        return false;
      }

      setLists((prev) => prev.map((list) => (list.id === listId ? result.data as TaskList : list)));
      setErrorMessage("");
      return true;
    },
    [lists, supabase, userId]
  );

  const removeList = useCallback(
    async (listId: string) => {
      const result = await deleteTaskList(supabase, userId, listId);
      if (result.error) {
        setErrorMessage(result.error.message || "Failed to delete list.");
        return false;
      }

      setLists((prev) => prev.filter((list) => list.id !== listId));
      setTasks((prev) => prev.filter((task) => task.list_id !== listId));
      setSortPreferences((prev) => prev.filter((pref) => pref.list_id !== listId));
      if (selectedListId === listId) {
        setSelectedListId(ALL_LISTS_KEY);
      }
      setErrorMessage("");
      return true;
    },
    [selectedListId, supabase, userId]
  );

  const scheduleCalendarSync = useCallback(
    (immediate = false) => {
      if (!session?.access_token || !calendarState?.connected) return;
      if (syncTimerRef.current) {
        window.clearTimeout(syncTimerRef.current);
      }
      const delayMs = immediate ? 0 : 800;
      syncTimerRef.current = window.setTimeout(async () => {
        try {
          const result = await triggerCalendarSyncNow(session.access_token);
          setCalendarSyncResult({ processed: result.processed, failed: result.failed });
          await loadCalendarStatus();
        } catch (err) {
          const message = err instanceof Error ? err.message : "Calendar sync failed";
          setErrorMessage(message);
        } finally {
          syncTimerRef.current = null;
        }
      }, delayMs);
    },
    [calendarState?.connected, loadCalendarStatus, session?.access_token]
  );

  const createTaskFromDraft = useCallback(
    async (draft: TaskDraft) => {
      const cleanedTitle = draft.title.trim();
      if (!cleanedTitle) return null;

      const recurrenceType = draft.recurrence_type;
      const interval = recurrenceType === "custom" ? Math.max(draft.recurrence_interval || 1, 1) : null;
      const unit = recurrenceType === "custom" ? draft.recurrence_unit : null;

      const result = await createTask(supabase, {
        user_id: userId,
        list_id: draft.list_id,
        parent_task_id: draft.parent_task_id,
        title: cleanedTitle,
        details: draft.details.trim() || null,
        due_at: toIsoOrNull(draft.due_at),
        is_completed: false,
        completed_at: null,
        recurrence_type: recurrenceType,
        recurrence_interval: interval,
        recurrence_unit: unit,
        recurrence_ends_at: toIsoOrNull(draft.recurrence_ends_at),
        sort_order: getNextTaskSortOrder(draft.list_id, draft.parent_task_id),
      });

      if (result.error || !result.data) {
        setErrorMessage(result.error?.message || "Failed to create task.");
        return null;
      }

      setTasks((prev) => [...prev, result.data as TrackerTask]);
      setErrorMessage("");
      scheduleCalendarSync();
      return result.data;
    },
    [getNextTaskSortOrder, scheduleCalendarSync, supabase, userId]
  );

  const saveTask = useCallback(
    async (taskId: string, updates: TaskUpdateInput) => {
      const payload: TaskUpdateInput = { ...updates };
      if (typeof payload.title === "string") {
        const cleaned = payload.title.trim();
        if (!cleaned) return false;
        payload.title = cleaned;
      }

      const result = await updateTask(supabase, userId, taskId, payload);
      if (result.error || !result.data) {
        setErrorMessage(result.error?.message || "Failed to save task.");
        return false;
      }

      setTasks((prev) => prev.map((task) => (task.id === taskId ? (result.data as TrackerTask) : task)));
      setErrorMessage("");
      scheduleCalendarSync();
      return true;
    },
    [scheduleCalendarSync, supabase, userId]
  );

  const removeTask = useCallback(
    async (taskId: string) => {
      const result = await deleteTask(supabase, userId, taskId);
      if (result.error) {
        setErrorMessage(result.error.message || "Failed to delete task.");
        return false;
      }

      setTasks((prev) => prev.filter((task) => task.id !== taskId && task.parent_task_id !== taskId));
      setErrorMessage("");
      scheduleCalendarSync();
      return true;
    },
    [scheduleCalendarSync, supabase, userId]
  );

  const toggleTaskCompletion = useCallback(
    async (task: TrackerTask) => {
      const nextCompleted = !task.is_completed;
      const completionTimestamp = nextCompleted ? new Date().toISOString() : null;

      const result = await updateTask(supabase, userId, task.id, {
        is_completed: nextCompleted,
        completed_at: completionTimestamp,
      });

      if (result.error || !result.data) {
        setErrorMessage(result.error?.message || "Failed to update task status.");
        return false;
      }

      const updatedTask = result.data as TrackerTask;
      setTasks((prev) => prev.map((current) => (current.id === task.id ? updatedTask : current)));

      if (nextCompleted && isRecurring(task.recurrence_type)) {
        const nextDueAt = computeNextDueAt(task);
        if (nextDueAt) {
          const nextResult = await createTask(supabase, {
            user_id: userId,
            list_id: task.list_id,
            parent_task_id: task.parent_task_id,
            title: task.title,
            details: task.details,
            due_at: nextDueAt,
            is_completed: false,
            completed_at: null,
            recurrence_type: task.recurrence_type,
            recurrence_interval: task.recurrence_interval,
            recurrence_unit: task.recurrence_unit,
            recurrence_ends_at: task.recurrence_ends_at,
            sort_order: getNextTaskSortOrder(task.list_id, task.parent_task_id),
          });

          if (!nextResult.error && nextResult.data) {
            setTasks((prev) => [...prev, nextResult.data as TrackerTask]);
          }
        }
      }

      setErrorMessage("");
      scheduleCalendarSync();
      return true;
    },
    [getNextTaskSortOrder, scheduleCalendarSync, supabase, userId]
  );

  const reorderTasks = useCallback(
    async (listId: string, orderedTaskIds: string[], parentTaskId: string | null) => {
      if (orderedTaskIds.length <= 1) return true;

      const orderMap = new Map(orderedTaskIds.map((taskId, index) => [taskId, index + 1]));
      const previous = tasks;

      setTasks((prev) =>
        prev.map((task) => {
          if (task.list_id !== listId || task.parent_task_id !== parentTaskId) return task;
          const nextOrder = orderMap.get(task.id);
          return typeof nextOrder === "number" ? { ...task, sort_order: nextOrder } : task;
        })
      );

      const updates = orderedTaskIds.map((taskId, index) =>
        updateTask(supabase, userId, taskId, { sort_order: index + 1 })
      );

      const results = await Promise.all(updates);
      const failed = results.find((result) => result.error);
      if (failed?.error) {
        setTasks(previous);
        setErrorMessage(failed.error.message || "Failed to persist custom order.");
        return false;
      }

      setErrorMessage("");
      scheduleCalendarSync();
      return true;
    },
    [scheduleCalendarSync, supabase, tasks, userId]
  );

  const reorderLists = useCallback(
    async (orderedListIds: string[]) => {
      if (orderedListIds.length <= 1) return true;

      const orderMap = new Map(orderedListIds.map((listId, index) => [listId, index + 1]));
      const previous = lists;

      setLists((prev) =>
        prev.map((list) => {
          const nextOrder = orderMap.get(list.id);
          return typeof nextOrder === "number" ? { ...list, sort_order: nextOrder } : list;
        })
      );

      const updates = orderedListIds.map((listId, index) =>
        updateTaskList(supabase, userId, listId, { sort_order: index + 1 })
      );

      const results = await Promise.all(updates);
      const failed = results.find((result) => result.error);
      if (failed?.error) {
        setLists(previous);
        setErrorMessage(failed.error.message || "Failed to persist list order.");
        return false;
      }

      setErrorMessage("");
      return true;
    },
    [lists, supabase, userId]
  );

  const getSortForList = useCallback(
    (listId: string): { mode: TaskSortMode; direction: SortDirection } => {
      const pref = sortPreferences.find((item) => item.list_id === listId);
      return {
        mode: pref?.sort_mode ?? DEFAULT_SORT_MODE,
        direction: pref?.sort_direction ?? DEFAULT_SORT_DIRECTION,
      };
    },
    [sortPreferences]
  );

  const setSortForList = useCallback(
    async (listId: string, mode: TaskSortMode, direction: SortDirection) => {
      const result = await upsertSortPreference(
        supabase,
        userId,
        listId,
        mode,
        direction
      );

      if (result.error || !result.data) {
        setErrorMessage(result.error?.message || "Failed to save sort preference.");
        return false;
      }

      setSortPreferences((prev) => {
        const existingIndex = prev.findIndex((item) => item.list_id === listId);
        if (existingIndex < 0) {
          return [...prev, result.data as TaskSortPreference];
        }

        const copy = [...prev];
        copy[existingIndex] = result.data as TaskSortPreference;
        return copy;
      });
      setErrorMessage("");
      return true;
    },
    [supabase, userId]
  );

  const setSortForCurrentView = useCallback(
    async (mode: TaskSortMode, direction: SortDirection) => {
      if (selectedListId === ALL_LISTS_KEY) {
        return;
      }

      await setSortForList(selectedListId, mode, direction);
    },
    [selectedListId, setSortForList]
  );

  const sortedLists = useMemo(
    () => [...lists].sort((a, b) => (a.sort_order === b.sort_order ? a.name.localeCompare(b.name) : a.sort_order - b.sort_order)),
    [lists]
  );
  const selectedListSort =
    selectedListId === ALL_LISTS_KEY
      ? { mode: DEFAULT_SORT_MODE, direction: DEFAULT_SORT_DIRECTION }
      : getSortForList(selectedListId);

  const syncEnabledByList = useMemo(() => {
    const map: Record<string, boolean> = {};
    (calendarState?.list_sync_settings ?? []).forEach((item) => {
      map[item.list_id] = !!item.sync_enabled;
    });
    return map;
  }, [calendarState?.list_sync_settings]);

  const connectGoogleCalendar = useCallback(async () => {
    if (!session?.access_token) {
      setErrorMessage("No active session for Google connect.");
      return;
    }
    setCalendarBusy(true);
    try {
      const { url } = await getGoogleConnectUrl(session.access_token);
      window.location.href = url;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect Google Calendar";
      setErrorMessage(message);
    } finally {
      setCalendarBusy(false);
    }
  }, [session?.access_token]);

  const disconnectGoogleCalendar = useCallback(async () => {
    if (!session?.access_token) return;
    setCalendarBusy(true);
    try {
      await disconnectCalendar(session.access_token);
      await loadCalendarStatus();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to disconnect Google Calendar";
      setErrorMessage(message);
    } finally {
      setCalendarBusy(false);
    }
  }, [loadCalendarStatus, session?.access_token]);

  const setListCalendarSync = useCallback(
    async (listId: string, enabled: boolean) => {
      if (!session?.access_token) return false;
      try {
        await setListSync(session.access_token, listId, enabled);
        await loadCalendarStatus();
        if (enabled) {
          scheduleCalendarSync(true);
        }
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update list sync";
        setErrorMessage(message);
        return false;
      }
    },
    [loadCalendarStatus, scheduleCalendarSync, session?.access_token]
  );

  const syncCalendarNow = useCallback(async () => {
    if (!session?.access_token) return false;
    setCalendarBusy(true);
    try {
      const result = await triggerCalendarSyncNow(session.access_token);
      setCalendarSyncResult({ processed: result.processed, failed: result.failed });
      await loadCalendarStatus();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to sync calendar now";
      setErrorMessage(message);
      return false;
    } finally {
      setCalendarBusy(false);
    }
  }, [loadCalendarStatus, session?.access_token]);

  return {
    allListsKey: ALL_LISTS_KEY,
    lists: sortedLists,
    tasks,
    tasksByParent,
    rootTasksByList,
    countsByList,
    totalOpenCount,
    totalCompletedCount,
    totalTaskCount,
    selectedListId,
    setSelectedListId,
    sortMode: selectedListSort.mode,
    sortDirection: selectedListSort.direction,
    setSortForCurrentView,
    getSortForList,
    setSortForList,
    showCompleted,
    setShowCompleted,
    isSaving,
    calendarState,
    calendarBusy,
    calendarSyncResult,
    syncEnabledByList,
    errorMessage,
    fetchAll,
    loadCalendarStatus,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    setListCalendarSync,
    syncCalendarNow,
    createList,
    saveList,
    removeList,
    createTaskFromDraft,
    saveTask,
    removeTask,
    toggleTaskCompletion,
    reorderTasks,
    reorderLists,
    buildTaskDraft,
  };
};
