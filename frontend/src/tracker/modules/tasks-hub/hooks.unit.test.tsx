import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTasksHubModule } from "./hooks";

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
});
