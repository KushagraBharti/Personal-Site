import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createTask,
  createTaskList,
  deleteTaskViaApi,
  deleteTaskListViaApi,
  disconnectCalendar,
  fetchTrackerBootstrap,
  getCalendarStatus,
  getCalendarSyncProgress,
  getGoogleConnectUrl,
  reorderTaskLists,
  reorderTasksViaApi,
  setTaskCompletionViaApi,
  setListSync,
  triggerCalendarLivePump,
  triggerCalendarRebuild,
  triggerCalendarSyncNow,
  updateTask,
  updateTaskList,
  upsertSortPreference,
} from "./api";
import {
  CalendarConnectionState,
  SortDirection,
  TaskDraft,
  TaskList,
  TaskSortMode,
  TaskSortPreference,
  TrackerTask,
  TaskUpdateInput,
} from "./types";
import { useTrackerContext } from "../../shared/hooks/useTrackerContext";
import { toIsoOrNull } from "./dueDateTime";

const ALL_LISTS_KEY = "all";
const DEFAULT_SORT_MODE: TaskSortMode = "custom";
const DEFAULT_SORT_DIRECTION: SortDirection = "asc";

const isValidIanaTimeZone = (timeZone: string | null | undefined) => {
  if (!timeZone) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
};

const getBrowserTimeZone = () => {
  const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return isValidIanaTimeZone(resolved) ? resolved : "UTC";
};

const buildTaskDraft = (
  listId: string,
  parentTaskId: string | null = null,
): TaskDraft => ({
  list_id: listId,
  parent_task_id: parentTaskId,
  title: "",
  details: "",
  due_at: "",
  due_timezone: getBrowserTimeZone(),
  recurrence_type: "none",
  recurrence_interval: 1,
  recurrence_unit: "week",
  recurrence_ends_at: "",
});

export const useTasksHubModule = () => {
  const { session, supabase, userId, startLoading, stopLoading } =
    useTrackerContext();

  const [lists, setLists] = useState<TaskList[]>([]);
  const [tasks, setTasks] = useState<TrackerTask[]>([]);
  const [sortPreferences, setSortPreferences] = useState<TaskSortPreference[]>(
    [],
  );
  const [selectedListId, setSelectedListId] = useState<string>(ALL_LISTS_KEY);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [calendarState, setCalendarState] =
    useState<CalendarConnectionState | null>(null);
  const [calendarBusy, setCalendarBusy] = useState(false);
  const [calendarSyncResult, setCalendarSyncResult] = useState<{
    processed: number;
    failed: number;
    failures: Array<{ id: number; error: string }>;
  } | null>(null);
  const [calendarLiveResult, setCalendarLiveResult] = useState<{
    processed: number;
    failed: number;
    failures: Array<{ id: number; error: string }>;
  } | null>(null);
  const livePumpTimerRef = useRef<number | null>(null);
  const realtimeRefreshTimerRef = useRef<number | null>(null);
  const realtimeRefreshInFlightRef = useRef(false);
  const realtimeRefreshPendingRef = useRef(false);

  const runWithLoading = useCallback(
    async <T>(fn: () => Promise<T>) => {
      startLoading();
      try {
        return await fn();
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading],
  );

  const fetchAll = useCallback(
    async (options?: { showLoading?: boolean }) => {
      if (!session?.access_token) return;

      const load = async () => {
        try {
          const bootstrap = await fetchTrackerBootstrap(
            session.access_token,
            getBrowserTimeZone(),
          );
          setLists(bootstrap.lists);
          setTasks(bootstrap.tasks);
          setSortPreferences(bootstrap.sort_preferences);
          setErrorMessage("");
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to load tasks.";
          setErrorMessage(message);
        }
      };

      if (options?.showLoading === false) {
        await load();
        return;
      }

      await runWithLoading(load);
    },
    [runWithLoading, session?.access_token],
  );

  useEffect(() => {
    if (!session?.access_token) return;
    fetchAll();
  }, [session?.access_token, fetchAll]);

  const loadCalendarStatus = useCallback(
    async (options?: { reportErrors?: boolean }) => {
      if (!session?.access_token) {
        setCalendarState(null);
        return null;
      }
      try {
        const status = await getCalendarStatus(session.access_token);
        setCalendarState(status);
        return status;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load calendar status";
        if (options?.reportErrors !== false) {
          setErrorMessage(message);
        }
        return null;
      }
    },
    [session?.access_token],
  );

  useEffect(() => {
    if (!session?.access_token) return;
    loadCalendarStatus();
  }, [session?.access_token, loadCalendarStatus]);

  const refreshFromRealtime = useCallback(async () => {
    if (!session?.access_token) return;
    if (realtimeRefreshInFlightRef.current) {
      realtimeRefreshPendingRef.current = true;
      return;
    }

    realtimeRefreshInFlightRef.current = true;
    realtimeRefreshPendingRef.current = false;
    try {
      await Promise.all([
        fetchAll({ showLoading: false }),
        loadCalendarStatus({ reportErrors: false }),
      ]);
    } finally {
      realtimeRefreshInFlightRef.current = false;
      if (realtimeRefreshPendingRef.current) {
        realtimeRefreshPendingRef.current = false;
        realtimeRefreshTimerRef.current = window.setTimeout(() => {
          realtimeRefreshTimerRef.current = null;
          void refreshFromRealtime();
        }, 250);
      }
    }
  }, [fetchAll, loadCalendarStatus, session?.access_token]);

  const scheduleRealtimeRefresh = useCallback(
    (delayMs = 500) => {
      if (!session?.access_token) return;
      if (document.visibilityState === "hidden") {
        realtimeRefreshPendingRef.current = true;
        return;
      }

      realtimeRefreshPendingRef.current = true;
      if (realtimeRefreshTimerRef.current) {
        window.clearTimeout(realtimeRefreshTimerRef.current);
      }
      realtimeRefreshTimerRef.current = window.setTimeout(() => {
        realtimeRefreshTimerRef.current = null;
        void refreshFromRealtime();
      }, delayMs);
    },
    [refreshFromRealtime, session?.access_token],
  );

  useEffect(() => {
    if (!session?.access_token || !userId) return;

    let active = true;
    supabase.realtime.setAuth(session.access_token);

    const channel = supabase
      .channel(`tracker:user:${userId}`, { config: { private: true } })
      .on("broadcast", { event: "tracker_change" }, () => {
        if (!active) return;
        scheduleRealtimeRefresh();
      })
      .subscribe((status, error) => {
        if (!active) return;
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("Tracker realtime subscription failed", error);
        }
      });

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [scheduleRealtimeRefresh, session?.access_token, supabase, userId]);

  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState !== "visible") return;
      scheduleRealtimeRefresh(0);
    };

    document.addEventListener("visibilitychange", refreshIfVisible);
    window.addEventListener("focus", refreshIfVisible);
    return () => {
      document.removeEventListener("visibilitychange", refreshIfVisible);
      window.removeEventListener("focus", refreshIfVisible);
    };
  }, [scheduleRealtimeRefresh]);

  useEffect(() => {
    return () => {
      if (realtimeRefreshTimerRef.current) {
        window.clearTimeout(realtimeRefreshTimerRef.current);
      }
    };
  }, []);

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
    [tasks, listIds],
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
        (task) => task.list_id === list.id && !task.parent_task_id,
      );
      grouped[list.id] = roots;
    });

    return grouped;
  }, [lists, tasksForKnownLists]);

  const countsByList = useMemo(() => {
    const counts: Record<
      string,
      { total: number; open: number; completed: number }
    > = {};

    lists.forEach((list) => {
      const listTasks = tasksForKnownLists.filter(
        (task) => task.list_id === list.id,
      );
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
    [countsByList],
  );

  const totalCompletedCount = useMemo(
    () =>
      Object.values(countsByList).reduce(
        (sum, item) => sum + item.completed,
        0,
      ),
    [countsByList],
  );

  const totalTaskCount = useMemo(
    () =>
      Object.values(countsByList).reduce((sum, item) => sum + item.total, 0),
    [countsByList],
  );

  const createList = useCallback(
    async (name: string, colorHex?: string) => {
      const cleanedName = name.trim();
      if (!cleanedName) return null;
      if (!session?.access_token) {
        setErrorMessage("Missing session token.");
        return null;
      }

      setIsSaving(true);
      try {
        const result = await createTaskList(session.access_token, {
          name: cleanedName,
          color_hex: colorHex,
        });
        setLists((prev) => [...prev, result]);
        setSelectedListId(result.id);
        setErrorMessage("");
        return result;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to create list.";
        setErrorMessage(message);
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    [session?.access_token],
  );

  const saveList = useCallback(
    async (listId: string, updates: { name?: string; color_hex?: string }) => {
      const payload: { name?: string; color_hex?: string } = {};
      if (typeof updates.name === "string") {
        const cleanedName = updates.name.trim();
        if (!cleanedName) return false;
        payload.name = cleanedName;
      }
      if (typeof updates.color_hex === "string") {
        payload.color_hex = updates.color_hex;
      }

      if (Object.keys(payload).length === 0) return true;
      if (!session?.access_token) {
        setErrorMessage("Missing session token.");
        return false;
      }

      try {
        const result = await updateTaskList(
          session.access_token,
          listId,
          payload,
        );
        setLists((prev) =>
          prev.map((list) => (list.id === listId ? result : list)),
        );
        setErrorMessage("");
        return true;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to update list.";
        setErrorMessage(message);
        return false;
      }
    },
    [session?.access_token],
  );

  const removeList = useCallback(
    async (listId: string) => {
      if (!session?.access_token) {
        setErrorMessage("Missing session token.");
        return false;
      }
      try {
        await deleteTaskListViaApi(session.access_token, listId);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to delete list.",
        );
        return false;
      }

      setLists((prev) => prev.filter((list) => list.id !== listId));
      setTasks((prev) => prev.filter((task) => task.list_id !== listId));
      setSortPreferences((prev) =>
        prev.filter((pref) => pref.list_id !== listId),
      );
      if (selectedListId === listId) {
        setSelectedListId(ALL_LISTS_KEY);
      }
      setErrorMessage("");
      return true;
    },
    [selectedListId, session?.access_token],
  );

  const pollSyncRun = useCallback(
    async (
      runId: string,
      options?: { timeoutMs?: number; pollEveryMs?: number },
    ) => {
      if (!session?.access_token) return;
      const timeoutMs = Math.max(options?.timeoutMs ?? 25_000, 2_000);
      const pollEveryMs = Math.max(options?.pollEveryMs ?? 1_000, 300);
      const startedAt = Date.now();
      let latestSnapshot: {
        processed: number;
        failed: number;
        failures: Array<{ id: number; error: string }>;
      } = {
        processed: 0,
        failed: 0,
        failures: [],
      };

      while (Date.now() - startedAt < timeoutMs) {
        const progress = await getCalendarSyncProgress(
          session.access_token,
          runId,
        );
        latestSnapshot = {
          processed: progress.processed,
          failed: progress.failed,
          failures: progress.failures || [],
        };
        setCalendarSyncResult(latestSnapshot);
        if (progress.done) {
          await loadCalendarStatus();
          return;
        }
        await new Promise((resolve) => window.setTimeout(resolve, pollEveryMs));
      }

      setCalendarSyncResult(latestSnapshot);
      await loadCalendarStatus();
    },
    [loadCalendarStatus, session?.access_token],
  );

  const scheduleLiveSyncPump = useCallback(
    (immediate = false) => {
      if (!session?.access_token || !calendarState?.connected) return;
      if (livePumpTimerRef.current) {
        window.clearTimeout(livePumpTimerRef.current);
      }
      const delayMs = immediate ? 0 : 450;
      livePumpTimerRef.current = window.setTimeout(async () => {
        try {
          const result = await triggerCalendarLivePump(session.access_token);
          setCalendarLiveResult({
            processed: result.processed,
            failed: result.failed,
            failures: result.failures || [],
          });
          if (result.failed > 0) {
            await loadCalendarStatus();
          }
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Live calendar sync failed";
          setErrorMessage(message);
        } finally {
          livePumpTimerRef.current = null;
        }
      }, delayMs);
    },
    [calendarState?.connected, loadCalendarStatus, session?.access_token],
  );

  const createTaskFromDraft = useCallback(
    async (draft: TaskDraft) => {
      const cleanedTitle = draft.title.trim();
      if (!cleanedTitle) return null;

      const recurrenceType = draft.recurrence_type;
      const interval =
        recurrenceType === "custom"
          ? Math.max(draft.recurrence_interval || 1, 1)
          : null;
      const unit = recurrenceType === "custom" ? draft.recurrence_unit : null;
      const dueAtIso = toIsoOrNull(draft.due_at);
      if (recurrenceType !== "none" && !dueAtIso) {
        setErrorMessage("Recurring tasks require a due date.");
        return null;
      }
      if (!session?.access_token) {
        setErrorMessage("Missing session token.");
        return null;
      }

      try {
        const result = await createTask(session.access_token, {
          list_id: draft.list_id,
          parent_task_id: draft.parent_task_id,
          title: cleanedTitle,
          details: draft.details.trim() || null,
          due_at: dueAtIso,
          due_timezone: draft.due_timezone,
          recurrence_type: recurrenceType,
          recurrence_interval: interval,
          recurrence_unit: unit,
          recurrence_ends_at:
            recurrenceType === "none"
              ? null
              : toIsoOrNull(draft.recurrence_ends_at),
          browser_timezone: getBrowserTimeZone(),
        });
        setTasks((prev) => [...prev, result]);
        setErrorMessage("");
        scheduleLiveSyncPump();
        return result;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to create task.";
        setErrorMessage(message);
        return null;
      }
    },
    [scheduleLiveSyncPump, session?.access_token],
  );

  const saveTask = useCallback(
    async (taskId: string, updates: TaskUpdateInput) => {
      const payload: TaskUpdateInput = { ...updates };
      if (typeof payload.title === "string") {
        const cleaned = payload.title.trim();
        if (!cleaned) return false;
        payload.title = cleaned;
      }

      const currentTask = tasks.find((task) => task.id === taskId) || null;
      const touchesDueAt = Object.prototype.hasOwnProperty.call(
        payload,
        "due_at",
      );
      const touchesRecurrence =
        Object.prototype.hasOwnProperty.call(payload, "recurrence_type") ||
        Object.prototype.hasOwnProperty.call(payload, "recurrence_interval") ||
        Object.prototype.hasOwnProperty.call(payload, "recurrence_unit") ||
        Object.prototype.hasOwnProperty.call(payload, "recurrence_ends_at") ||
        touchesDueAt;
      if (touchesRecurrence) {
        const nextDueAt =
          payload.due_at !== undefined
            ? payload.due_at
            : (currentTask?.due_at ?? null);
        const nextRecurrenceType =
          payload.recurrence_type ?? currentTask?.recurrence_type ?? "none";
        if (nextRecurrenceType !== "none" && !nextDueAt) {
          setErrorMessage("Recurring tasks require a due date.");
          return false;
        }
      }

      if (!session?.access_token) {
        setErrorMessage("Missing session token.");
        return false;
      }

      try {
        const result = await updateTask(session.access_token, taskId, {
          ...payload,
          browser_timezone: getBrowserTimeZone(),
        });
        setTasks((prev) =>
          prev.map((task) => (task.id === taskId ? result : task)),
        );
        setErrorMessage("");
        scheduleLiveSyncPump();
        return true;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to save task.";
        setErrorMessage(message);
        return false;
      }
    },
    [scheduleLiveSyncPump, session?.access_token, tasks],
  );

  const removeTask = useCallback(
    async (taskId: string) => {
      try {
        await deleteTaskViaApi(session.access_token, taskId);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to delete task.";
        setErrorMessage(message);
        return false;
      }

      setTasks((prev) =>
        prev.filter(
          (task) => task.id !== taskId && task.parent_task_id !== taskId,
        ),
      );
      setErrorMessage("");
      scheduleLiveSyncPump();
      return true;
    },
    [scheduleLiveSyncPump, session.access_token],
  );

  const toggleTaskCompletion = useCallback(
    async (task: TrackerTask) => {
      const nextCompleted = !task.is_completed;

      let result: Awaited<ReturnType<typeof setTaskCompletionViaApi>>;
      try {
        result = await setTaskCompletionViaApi(
          session.access_token,
          task.id,
          nextCompleted,
        );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to update task status.";
        setErrorMessage(message);
        return false;
      }

      const updatedTask = result.task;
      setTasks((prev) =>
        prev.map((current) => (current.id === task.id ? updatedTask : current)),
      );
      const createdNextTask = result.created_next_task;
      if (createdNextTask) {
        setTasks((prev) => [...prev, createdNextTask]);
      }

      setErrorMessage("");
      scheduleLiveSyncPump();
      return true;
    },
    [scheduleLiveSyncPump, session.access_token],
  );

  const reorderTasks = useCallback(
    async (
      listId: string,
      orderedTaskIds: string[],
      parentTaskId: string | null,
    ) => {
      if (orderedTaskIds.length <= 1) return true;

      const orderMap = new Map(
        orderedTaskIds.map((taskId, index) => [taskId, index + 1]),
      );
      const previous = tasks;

      setTasks((prev) =>
        prev.map((task) => {
          if (task.list_id !== listId || task.parent_task_id !== parentTaskId)
            return task;
          const nextOrder = orderMap.get(task.id);
          return typeof nextOrder === "number"
            ? { ...task, sort_order: nextOrder }
            : task;
        }),
      );

      if (!session?.access_token) {
        setTasks(previous);
        setErrorMessage("Missing session token.");
        return false;
      }

      try {
        const updatedTasks = await reorderTasksViaApi(
          session.access_token,
          listId,
          parentTaskId,
          orderedTaskIds,
        );
        const updatedById = new Map(
          updatedTasks.map((task) => [task.id, task]),
        );
        setTasks((prev) =>
          prev.map((task) => updatedById.get(task.id) || task),
        );
        setErrorMessage("");
        scheduleLiveSyncPump();
        return true;
      } catch (error) {
        setTasks(previous);
        const message =
          error instanceof Error
            ? error.message
            : "Failed to persist custom order.";
        setErrorMessage(message);
        return false;
      }
    },
    [scheduleLiveSyncPump, session?.access_token, tasks],
  );

  const reorderLists = useCallback(
    async (orderedListIds: string[]) => {
      if (orderedListIds.length <= 1) return true;

      const orderMap = new Map(
        orderedListIds.map((listId, index) => [listId, index + 1]),
      );
      const previous = lists;

      setLists((prev) =>
        prev.map((list) => {
          const nextOrder = orderMap.get(list.id);
          return typeof nextOrder === "number"
            ? { ...list, sort_order: nextOrder }
            : list;
        }),
      );

      if (!session?.access_token) {
        setLists(previous);
        setErrorMessage("Missing session token.");
        return false;
      }

      try {
        const updatedLists = await reorderTaskLists(
          session.access_token,
          orderedListIds,
        );
        const updatedById = new Map(
          updatedLists.map((list) => [list.id, list]),
        );
        setLists((prev) =>
          prev.map((list) => updatedById.get(list.id) || list),
        );
        setErrorMessage("");
        return true;
      } catch (error) {
        setLists(previous);
        const message =
          error instanceof Error
            ? error.message
            : "Failed to persist list order.";
        setErrorMessage(message);
        return false;
      }
    },
    [lists, session?.access_token],
  );

  const getSortForList = useCallback(
    (listId: string): { mode: TaskSortMode; direction: SortDirection } => {
      const pref = sortPreferences.find((item) => item.list_id === listId);
      return {
        mode: pref?.sort_mode ?? DEFAULT_SORT_MODE,
        direction: pref?.sort_direction ?? DEFAULT_SORT_DIRECTION,
      };
    },
    [sortPreferences],
  );

  const setSortForList = useCallback(
    async (listId: string, mode: TaskSortMode, direction: SortDirection) => {
      if (!session?.access_token) {
        setErrorMessage("Missing session token.");
        return false;
      }

      try {
        const result = await upsertSortPreference(
          session.access_token,
          listId,
          mode,
          direction,
        );

        setSortPreferences((prev) => {
          const existingIndex = prev.findIndex(
            (item) => item.list_id === listId,
          );
          if (existingIndex < 0) {
            return [...prev, result];
          }

          const copy = [...prev];
          copy[existingIndex] = result;
          return copy;
        });
        setErrorMessage("");
        return true;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to save sort preference.";
        setErrorMessage(message);
        return false;
      }
    },
    [session?.access_token],
  );

  const setSortForCurrentView = useCallback(
    async (mode: TaskSortMode, direction: SortDirection) => {
      if (selectedListId === ALL_LISTS_KEY) {
        return;
      }

      await setSortForList(selectedListId, mode, direction);
    },
    [selectedListId, setSortForList],
  );

  const sortedLists = useMemo(
    () =>
      [...lists].sort((a, b) =>
        a.sort_order === b.sort_order
          ? a.name.localeCompare(b.name)
          : a.sort_order - b.sort_order,
      ),
    [lists],
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
      const message =
        err instanceof Error
          ? err.message
          : "Failed to connect Google Calendar";
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
      const message =
        err instanceof Error
          ? err.message
          : "Failed to disconnect Google Calendar";
      setErrorMessage(message);
    } finally {
      setCalendarBusy(false);
    }
  }, [loadCalendarStatus, session?.access_token]);

  const setListCalendarSync = useCallback(
    async (listId: string, enabled: boolean) => {
      if (!session?.access_token) return false;
      try {
        const result = await setListSync(session.access_token, listId, enabled);
        await loadCalendarStatus();
        if (enabled && result.run_id) {
          setCalendarSyncResult({ processed: 0, failed: 0, failures: [] });
          await pollSyncRun(result.run_id, {
            timeoutMs: 90_000,
            pollEveryMs: 1_100,
          });
        } else if (enabled || result.queued_cleanup) {
          scheduleLiveSyncPump(true);
        }
        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update list sync";
        setErrorMessage(message);
        return false;
      }
    },
    [
      loadCalendarStatus,
      pollSyncRun,
      scheduleLiveSyncPump,
      session?.access_token,
    ],
  );

  const syncCalendarNow = useCallback(async () => {
    if (!session?.access_token) return false;
    setCalendarBusy(true);
    try {
      const result = await triggerCalendarSyncNow(session.access_token);
      setCalendarSyncResult({ processed: 0, failed: 0, failures: [] });
      if (result.run_id) {
        await pollSyncRun(result.run_id, {
          timeoutMs: 90_000,
          pollEveryMs: 1_100,
        });
      } else {
        setCalendarSyncResult({
          processed: result.processed ?? 0,
          failed: result.failed ?? 0,
          failures: result.failures ?? [],
        });
        await loadCalendarStatus();
      }
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to sync calendar now";
      setErrorMessage(message);
      return false;
    } finally {
      setCalendarBusy(false);
    }
  }, [loadCalendarStatus, pollSyncRun, session?.access_token]);

  const rebuildCalendarNow = useCallback(async () => {
    if (!session?.access_token) return false;
    const confirmed = window.confirm(
      "Rebuild Tracker Tasks calendar? This will delete all events in that calendar and rebuild from the tracker tasks that should currently appear there.",
    );
    if (!confirmed) return false;

    setCalendarBusy(true);
    try {
      const result = await triggerCalendarRebuild(session.access_token);
      setCalendarSyncResult({ processed: 0, failed: 0, failures: [] });
      if (result.run_id) {
        await pollSyncRun(result.run_id, {
          timeoutMs: 180_000,
          pollEveryMs: 1_200,
        });
      } else {
        setCalendarSyncResult({
          processed: result.processed ?? 0,
          failed: result.failed ?? 0,
          failures: result.failures ?? [],
        });
        await loadCalendarStatus();
      }
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to rebuild calendar";
      setErrorMessage(message);
      return false;
    } finally {
      setCalendarBusy(false);
    }
  }, [loadCalendarStatus, pollSyncRun, session?.access_token]);

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
    isSaving,
    calendarState,
    calendarBusy,
    calendarSyncResult,
    calendarLiveResult,
    syncEnabledByList,
    errorMessage,
    fetchAll,
    loadCalendarStatus,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    setListCalendarSync,
    syncCalendarNow,
    rebuildCalendarNow,
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
