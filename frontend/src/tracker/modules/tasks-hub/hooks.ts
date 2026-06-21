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
  isUnauthorizedTrackerApiError,
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
  const {
    supabase,
    userId,
    getFreshAccessToken,
    clearAuthSession,
    startLoading,
    stopLoading,
  } = useTrackerContext();

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

  const getErrorMessage = useCallback(
    (error: unknown, fallback: string) => {
      if (isUnauthorizedTrackerApiError(error)) {
        void clearAuthSession();
        return "Session expired. Please sign in again.";
      }
      return error instanceof Error ? error.message : fallback;
    },
    [clearAuthSession],
  );

  const requireAccessToken = useCallback(
    async (message = "Missing session token.") => {
      const accessToken = await getFreshAccessToken();
      if (!accessToken) {
        setErrorMessage(message);
        return null;
      }
      return accessToken;
    },
    [getFreshAccessToken],
  );

  const fetchAll = useCallback(
    async (options?: { showLoading?: boolean }) => {
      if (!userId) return;

      const load = async () => {
        const accessToken = await requireAccessToken();
        if (!accessToken) return;

        try {
          const bootstrap = await fetchTrackerBootstrap(
            accessToken,
            getBrowserTimeZone(),
          );
          setLists(bootstrap.lists);
          setTasks(bootstrap.tasks);
          setSortPreferences(bootstrap.sort_preferences);
          setErrorMessage("");
        } catch (error) {
          setErrorMessage(getErrorMessage(error, "Failed to load tasks."));
        }
      };

      if (options?.showLoading === false) {
        await load();
        return;
      }

      await runWithLoading(load);
    },
    [getErrorMessage, requireAccessToken, runWithLoading, userId],
  );

  useEffect(() => {
    if (!userId) return;
    fetchAll();
  }, [fetchAll, userId]);

  const loadCalendarStatus = useCallback(
    async (options?: { reportErrors?: boolean }) => {
      if (!userId) {
        setCalendarState(null);
        return null;
      }
      const accessToken = await requireAccessToken();
      if (!accessToken) {
        setCalendarState(null);
        return null;
      }
      try {
        const status = await getCalendarStatus(accessToken);
        setCalendarState(status);
        return status;
      } catch (err) {
        const message = getErrorMessage(
          err,
          "Failed to load calendar status",
        );
        if (options?.reportErrors !== false) {
          setErrorMessage(message);
        }
        return null;
      }
    },
    [getErrorMessage, requireAccessToken, userId],
  );

  useEffect(() => {
    if (!userId) return;
    loadCalendarStatus();
  }, [loadCalendarStatus, userId]);

  const refreshFromRealtime = useCallback(async () => {
    if (!userId) return;
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
  }, [fetchAll, loadCalendarStatus, userId]);

  const scheduleRealtimeRefresh = useCallback(
    (delayMs = 500) => {
      if (!userId) return;
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
    [refreshFromRealtime, userId],
  );

  useEffect(() => {
    if (!userId) return;

    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    void (async () => {
      try {
        const accessToken = await requireAccessToken();
        if (!accessToken) return;
        await supabase.realtime.setAuth(accessToken);
        if (!active) return;

        channel = supabase
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
      } catch (error) {
        if (active) {
          console.error("Tracker realtime auth failed", error);
        }
      }
    })();

    return () => {
      active = false;
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [
    clearAuthSession,
    requireAccessToken,
    scheduleRealtimeRefresh,
    supabase,
    userId,
  ]);

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

      setIsSaving(true);
      try {
        const accessToken = await requireAccessToken();
        if (!accessToken) return null;

        const result = await createTaskList(accessToken, {
          name: cleanedName,
          color_hex: colorHex,
        });
        setLists((prev) => [...prev, result]);
        setSelectedListId(result.id);
        setErrorMessage("");
        return result;
      } catch (error) {
        setErrorMessage(getErrorMessage(error, "Failed to create list."));
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    [getErrorMessage, requireAccessToken],
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

      try {
        const accessToken = await requireAccessToken();
        if (!accessToken) return false;

        const result = await updateTaskList(accessToken, listId, payload);
        setLists((prev) =>
          prev.map((list) => (list.id === listId ? result : list)),
        );
        setErrorMessage("");
        return true;
      } catch (error) {
        setErrorMessage(getErrorMessage(error, "Failed to update list."));
        return false;
      }
    },
    [getErrorMessage, requireAccessToken],
  );

  const removeList = useCallback(
    async (listId: string) => {
      try {
        const accessToken = await requireAccessToken();
        if (!accessToken) return false;

        await deleteTaskListViaApi(accessToken, listId);
      } catch (error) {
        setErrorMessage(getErrorMessage(error, "Failed to delete list."));
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
    [getErrorMessage, requireAccessToken, selectedListId],
  );

  const pollSyncRun = useCallback(
    async (
      runId: string,
      options?: { timeoutMs?: number; pollEveryMs?: number },
    ) => {
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
        const accessToken = await requireAccessToken();
        if (!accessToken) return;

        const progress = await getCalendarSyncProgress(accessToken, runId);
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
    [loadCalendarStatus, requireAccessToken],
  );

  const scheduleLiveSyncPump = useCallback(
    (immediate = false) => {
      if (!calendarState?.connected) return;
      if (livePumpTimerRef.current) {
        window.clearTimeout(livePumpTimerRef.current);
      }
      const delayMs = immediate ? 0 : 450;
      livePumpTimerRef.current = window.setTimeout(async () => {
        try {
          const accessToken = await requireAccessToken();
          if (!accessToken) return;

          const result = await triggerCalendarLivePump(accessToken);
          setCalendarLiveResult({
            processed: result.processed,
            failed: result.failed,
            failures: result.failures || [],
          });
          if (result.failed > 0) {
            await loadCalendarStatus();
          }
        } catch (err) {
          setErrorMessage(getErrorMessage(err, "Live calendar sync failed"));
        } finally {
          livePumpTimerRef.current = null;
        }
      }, delayMs);
    },
    [
      calendarState?.connected,
      getErrorMessage,
      loadCalendarStatus,
      requireAccessToken,
    ],
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

      try {
        const accessToken = await requireAccessToken();
        if (!accessToken) return null;

        const result = await createTask(accessToken, {
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
        setErrorMessage(getErrorMessage(error, "Failed to create task."));
        return null;
      }
    },
    [getErrorMessage, requireAccessToken, scheduleLiveSyncPump],
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

      try {
        const accessToken = await requireAccessToken();
        if (!accessToken) return false;

        const result = await updateTask(accessToken, taskId, {
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
        setErrorMessage(getErrorMessage(error, "Failed to save task."));
        return false;
      }
    },
    [getErrorMessage, requireAccessToken, scheduleLiveSyncPump, tasks],
  );

  const removeTask = useCallback(
    async (taskId: string) => {
      try {
        const accessToken = await requireAccessToken();
        if (!accessToken) return false;

        await deleteTaskViaApi(accessToken, taskId);
      } catch (error) {
        setErrorMessage(getErrorMessage(error, "Failed to delete task."));
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
    [getErrorMessage, requireAccessToken, scheduleLiveSyncPump],
  );

  const toggleTaskCompletion = useCallback(
    async (task: TrackerTask) => {
      const nextCompleted = !task.is_completed;

      let result: Awaited<ReturnType<typeof setTaskCompletionViaApi>>;
      try {
        const accessToken = await requireAccessToken();
        if (!accessToken) return false;

        result = await setTaskCompletionViaApi(
          accessToken,
          task.id,
          nextCompleted,
        );
      } catch (error) {
        setErrorMessage(
          getErrorMessage(error, "Failed to update task status."),
        );
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
    [getErrorMessage, requireAccessToken, scheduleLiveSyncPump],
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

      try {
        const accessToken = await requireAccessToken();
        if (!accessToken) {
          setTasks(previous);
          return false;
        }

        const updatedTasks = await reorderTasksViaApi(
          accessToken,
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
        setErrorMessage(
          getErrorMessage(error, "Failed to persist custom order."),
        );
        return false;
      }
    },
    [getErrorMessage, requireAccessToken, scheduleLiveSyncPump, tasks],
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

      try {
        const accessToken = await requireAccessToken();
        if (!accessToken) {
          setLists(previous);
          return false;
        }

        const updatedLists = await reorderTaskLists(accessToken, orderedListIds);
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
        setErrorMessage(
          getErrorMessage(error, "Failed to persist list order."),
        );
        return false;
      }
    },
    [getErrorMessage, lists, requireAccessToken],
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
      try {
        const accessToken = await requireAccessToken();
        if (!accessToken) return false;

        const result = await upsertSortPreference(
          accessToken,
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
        setErrorMessage(
          getErrorMessage(error, "Failed to save sort preference."),
        );
        return false;
      }
    },
    [getErrorMessage, requireAccessToken],
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
    setCalendarBusy(true);
    try {
      const accessToken = await requireAccessToken(
        "No active session for Google connect.",
      );
      if (!accessToken) return;

      const { url } = await getGoogleConnectUrl(accessToken);
      window.location.href = url;
    } catch (err) {
      setErrorMessage(
        getErrorMessage(err, "Failed to connect Google Calendar"),
      );
    } finally {
      setCalendarBusy(false);
    }
  }, [getErrorMessage, requireAccessToken]);

  const disconnectGoogleCalendar = useCallback(async () => {
    setCalendarBusy(true);
    try {
      const accessToken = await requireAccessToken();
      if (!accessToken) return;

      await disconnectCalendar(accessToken);
      await loadCalendarStatus();
    } catch (err) {
      setErrorMessage(
        getErrorMessage(err, "Failed to disconnect Google Calendar"),
      );
    } finally {
      setCalendarBusy(false);
    }
  }, [getErrorMessage, loadCalendarStatus, requireAccessToken]);

  const setListCalendarSync = useCallback(
    async (listId: string, enabled: boolean) => {
      try {
        const accessToken = await requireAccessToken();
        if (!accessToken) return false;

        const result = await setListSync(accessToken, listId, enabled);
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
        setErrorMessage(getErrorMessage(err, "Failed to update list sync"));
        return false;
      }
    },
    [
      getErrorMessage,
      loadCalendarStatus,
      pollSyncRun,
      requireAccessToken,
      scheduleLiveSyncPump,
    ],
  );

  const syncCalendarNow = useCallback(async () => {
    setCalendarBusy(true);
    try {
      const accessToken = await requireAccessToken();
      if (!accessToken) return false;

      const result = await triggerCalendarSyncNow(accessToken);
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
      setErrorMessage(getErrorMessage(err, "Failed to sync calendar now"));
      return false;
    } finally {
      setCalendarBusy(false);
    }
  }, [getErrorMessage, loadCalendarStatus, pollSyncRun, requireAccessToken]);

  const rebuildCalendarNow = useCallback(async () => {
    const confirmed = window.confirm(
      "Rebuild Tracker Tasks calendar? This will delete all events in that calendar and rebuild from the tracker tasks that should currently appear there.",
    );
    if (!confirmed) return false;

    setCalendarBusy(true);
    try {
      const accessToken = await requireAccessToken();
      if (!accessToken) return false;

      const result = await triggerCalendarRebuild(accessToken);
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
      setErrorMessage(getErrorMessage(err, "Failed to rebuild calendar"));
      return false;
    } finally {
      setCalendarBusy(false);
    }
  }, [getErrorMessage, loadCalendarStatus, pollSyncRun, requireAccessToken]);

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
