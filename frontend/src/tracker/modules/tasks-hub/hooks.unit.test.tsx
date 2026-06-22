import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTasksHubModule } from "./hooks";
import { TrackerTask } from "./types";

const apiMocks = vi.hoisted(() => ({
  createTask: vi.fn(),
  createTaskList: vi.fn(),
  deleteTaskViaApi: vi.fn(),
  deleteTaskListViaApi: vi.fn(),
  disconnectCalendar: vi.fn(),
  fetchTrackerBootstrap: vi.fn(),
  getCalendarStatus: vi.fn(),
  getCalendarSyncProgress: vi.fn(),
  getGoogleConnectUrl: vi.fn(),
  isUnauthorizedTrackerApiError: vi.fn(),
  reorderTaskLists: vi.fn(),
  reorderTasksViaApi: vi.fn(),
  setTaskCompletionViaApi: vi.fn(),
  setListSync: vi.fn(),
  triggerCalendarLivePump: vi.fn(),
  triggerCalendarRebuild: vi.fn(),
  triggerCalendarSyncNow: vi.fn(),
  updateTask: vi.fn(),
  updateTaskList: vi.fn(),
  upsertSortPreference: vi.fn(),
}));

const trackerContextMock = vi.hoisted(() => vi.fn());

vi.mock("./api", () => apiMocks);
vi.mock("../../shared/hooks/useTrackerContext", () => ({
  useTrackerContext: trackerContextMock,
}));

const buildCalendarStatus = () => ({
  connected: false,
  connection: null,
  watch_expires_at: null,
  list_sync_settings: [],
});

const buildTask = (overrides?: Partial<TrackerTask>): TrackerTask => ({
  id: "task-1",
  user_id: "user-1",
  list_id: "list-1",
  parent_task_id: null,
  title: "Before",
  details: null,
  due_at: null,
  due_timezone: null,
  is_completed: false,
  completed_at: null,
  recurrence_type: "none",
  recurrence_interval: null,
  recurrence_unit: null,
  recurrence_ends_at: null,
  sort_order: 1,
  created_at: "2026-06-20T00:00:00.000Z",
  updated_at: "2026-06-20T00:00:00.000Z",
  ...overrides,
});

describe("useTasksHubModule realtime refresh", () => {
  let broadcastHandler: (() => void) | null;
  let channel: {
    on: ReturnType<typeof vi.fn>;
    subscribe: ReturnType<typeof vi.fn>;
  };
  let supabase: {
    realtime: { setAuth: ReturnType<typeof vi.fn> };
    channel: ReturnType<typeof vi.fn>;
    removeChannel: ReturnType<typeof vi.fn>;
  };
  let getFreshAccessToken: ReturnType<typeof vi.fn>;
  let clearAuthSession: ReturnType<typeof vi.fn>;
  let subscribeCallback:
    | ((status: "CHANNEL_ERROR" | "CLOSED" | "SUBSCRIBED" | "TIMED_OUT", error?: Error) => void)
    | null;

  beforeEach(() => {
    vi.clearAllMocks();
    broadcastHandler = null;
    subscribeCallback = null;
    channel = {
      on: vi.fn((_type, _filter, handler) => {
        broadcastHandler = handler;
        return channel;
      }),
      subscribe: vi.fn((callback) => {
        subscribeCallback = callback;
        return channel;
      }),
    };
    supabase = {
      realtime: { setAuth: vi.fn().mockResolvedValue(undefined) },
      channel: vi.fn(() => channel),
      removeChannel: vi.fn(),
    };
    getFreshAccessToken = vi.fn().mockResolvedValue("fresh-token");
    clearAuthSession = vi.fn().mockResolvedValue(undefined);

    apiMocks.fetchTrackerBootstrap.mockResolvedValue({
      ok: true,
      lists: [],
      tasks: [],
      sort_preferences: [],
    });
    apiMocks.getCalendarStatus.mockResolvedValue(buildCalendarStatus());
    apiMocks.isUnauthorizedTrackerApiError.mockImplementation(
      (error: unknown) =>
        error instanceof Error && error.message === "Unauthorized",
    );
    trackerContextMock.mockReturnValue({
      session: {
        access_token: "stale-session-token",
        user: { id: "user-1" },
      },
      userId: "user-1",
      supabase,
      getFreshAccessToken,
      clearAuthSession,
      startLoading: vi.fn(),
      stopLoading: vi.fn(),
    });
  });

  it("uses fresh tokens for bootstrap, status, and the private tracker topic", async () => {
    const { unmount } = renderHook(() => useTasksHubModule());

    await waitFor(() => {
      expect(apiMocks.fetchTrackerBootstrap).toHaveBeenCalledWith(
        "fresh-token",
        expect.any(String),
      );
      expect(apiMocks.getCalendarStatus).toHaveBeenCalledWith("fresh-token");
    });
    expect(supabase.realtime.setAuth).toHaveBeenCalledWith("fresh-token");
    await waitFor(() => {
      expect(supabase.channel).toHaveBeenCalledWith("tracker:user:user-1", {
        config: { private: true },
      });
    });
    expect(channel.on).toHaveBeenCalledWith(
      "broadcast",
      { event: "tracker_change" },
      expect.any(Function),
    );

    apiMocks.fetchTrackerBootstrap.mockClear();
    apiMocks.getCalendarStatus.mockClear();

    broadcastHandler?.();

    await waitFor(
      () => {
        expect(apiMocks.fetchTrackerBootstrap).toHaveBeenCalledTimes(1);
        expect(apiMocks.getCalendarStatus).toHaveBeenCalledTimes(1);
      },
      { timeout: 1500 },
    );
    expect(apiMocks.fetchTrackerBootstrap).toHaveBeenLastCalledWith(
      "fresh-token",
      expect.any(String),
    );
    expect(apiMocks.getCalendarStatus).toHaveBeenLastCalledWith("fresh-token");

    unmount();
    expect(supabase.removeChannel).toHaveBeenCalledWith(channel);
  });

  it("waits for realtime auth before joining the private topic", async () => {
    let resolveAuth: (() => void) | null = null;
    supabase.realtime.setAuth.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveAuth = resolve;
        }),
    );

    renderHook(() => useTasksHubModule());

    await waitFor(() => {
      expect(getFreshAccessToken).toHaveBeenCalled();
      expect(supabase.realtime.setAuth).toHaveBeenCalledWith("fresh-token");
    });
    expect(supabase.channel).not.toHaveBeenCalled();

    resolveAuth?.();

    await waitFor(() => {
      expect(supabase.channel).toHaveBeenCalledWith("tracker:user:user-1", {
        config: { private: true },
      });
    });
  });

  it("does not subscribe when a fresh access token is unavailable", async () => {
    getFreshAccessToken.mockResolvedValue(null);

    renderHook(() => useTasksHubModule());

    await waitFor(() => {
      expect(getFreshAccessToken).toHaveBeenCalled();
    });
    expect(supabase.realtime.setAuth).not.toHaveBeenCalled();
    expect(supabase.channel).not.toHaveBeenCalled();
  });

  it("does not clear auth when realtime rejects the private topic", async () => {
    renderHook(() => useTasksHubModule());

    await waitFor(() => {
      expect(supabase.channel).toHaveBeenCalled();
      expect(subscribeCallback).toBeTruthy();
    });

    subscribeCallback?.(
      "CHANNEL_ERROR",
      new Error(
        "Unauthorized: You do not have permissions to read from this Channel topic",
      ),
    );

    expect(clearAuthSession).not.toHaveBeenCalled();
    expect(supabase.removeChannel).not.toHaveBeenCalled();
  });

  it("clears auth when a private API call returns Unauthorized", async () => {
    apiMocks.fetchTrackerBootstrap.mockRejectedValue(
      new Error("Unauthorized"),
    );

    renderHook(() => useTasksHubModule());

    await waitFor(() => {
      expect(clearAuthSession).toHaveBeenCalled();
    });
  });

  it("optimistically inserts a created task and replaces it with the server task", async () => {
    let resolveCreate:
      | ((value: {
          ok: boolean;
          task: TrackerTask;
          calendar_sync_warning?: string;
        }) => void)
      | null = null;
    apiMocks.fetchTrackerBootstrap.mockResolvedValue({
      ok: true,
      lists: [{ id: "list-1" }],
      tasks: [],
      sort_preferences: [],
    });
    apiMocks.createTask.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCreate = resolve;
        }),
    );

    const { result } = renderHook(() => useTasksHubModule());

    await waitFor(() => {
      expect(result.current.lists).toHaveLength(1);
    });

    let optimisticTask: TrackerTask | null = null;
    act(() => {
      optimisticTask = result.current.createTaskFromDraft({
        list_id: "list-1",
        parent_task_id: null,
        title: " New task ",
        details: "",
        due_at: "",
        due_timezone: "America/Chicago",
        recurrence_type: "none",
        recurrence_interval: 1,
        recurrence_unit: "week",
        recurrence_ends_at: "",
      });
    });

    expect(optimisticTask?.id).toMatch(/^temp:/);
    expect(result.current.tasks).toEqual([
      expect.objectContaining({ id: optimisticTask?.id, title: "New task" }),
    ]);

    await waitFor(() => {
      expect(apiMocks.createTask).toHaveBeenCalled();
    });

    act(() => {
      resolveCreate?.({
        ok: true,
        task: buildTask({ id: "task-server", title: "New task" }),
        calendar_sync_warning:
          "Task saved, but calendar sync could not be queued.",
      });
    });

    await waitFor(() => {
      expect(result.current.tasks).toEqual([
        expect.objectContaining({ id: "task-server", title: "New task" }),
      ]);
      expect(result.current.calendarWarning).toBe(
        "Task saved, but calendar sync could not be queued.",
      );
    });
  });

  it("optimistically saves a task and rolls back on failure", async () => {
    apiMocks.fetchTrackerBootstrap.mockResolvedValue({
      ok: true,
      lists: [{ id: "list-1" }],
      tasks: [buildTask()],
      sort_preferences: [],
    });
    apiMocks.updateTask.mockRejectedValue(new Error("save failed"));

    const { result } = renderHook(() => useTasksHubModule());

    await waitFor(() => {
      expect(result.current.tasks[0]?.title).toBe("Before");
    });

    act(() => {
      expect(result.current.saveTask("task-1", { title: "After" })).toBe(true);
    });

    expect(result.current.tasks[0]?.title).toBe("After");
    await waitFor(() => {
      expect(result.current.tasks[0]?.title).toBe("Before");
      expect(result.current.errorMessage).toBe("save failed");
    });
  });

  it("optimistically deletes a task subtree and restores it on failure", async () => {
    const parent = buildTask();
    const child = buildTask({
      id: "task-2",
      parent_task_id: "task-1",
      title: "Child",
      sort_order: 1,
    });
    apiMocks.fetchTrackerBootstrap.mockResolvedValue({
      ok: true,
      lists: [{ id: "list-1" }],
      tasks: [parent, child],
      sort_preferences: [],
    });
    apiMocks.deleteTaskViaApi.mockRejectedValue(new Error("delete failed"));

    const { result } = renderHook(() => useTasksHubModule());

    await waitFor(() => {
      expect(result.current.tasks).toHaveLength(2);
    });

    act(() => {
      expect(result.current.removeTask("task-1")).toBe(true);
    });

    expect(result.current.tasks).toHaveLength(0);
    await waitFor(() => {
      expect(result.current.tasks.map((task) => task.id).sort()).toEqual([
        "task-1",
        "task-2",
      ]);
      expect(result.current.errorMessage).toBe("delete failed");
    });
  });
});
