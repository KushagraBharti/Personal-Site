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

  beforeEach(() => {
    broadcastHandler = null;
    channel = {
      on: vi.fn((_type, _filter, handler) => {
        broadcastHandler = handler;
        return channel;
      }),
      subscribe: vi.fn(() => channel),
    };
    supabase = {
      realtime: { setAuth: vi.fn().mockResolvedValue(undefined) },
      channel: vi.fn(() => channel),
      removeChannel: vi.fn(),
    };

    apiMocks.fetchTrackerBootstrap.mockResolvedValue({
      ok: true,
      lists: [],
      tasks: [],
      sort_preferences: [],
    });
    apiMocks.getCalendarStatus.mockResolvedValue(buildCalendarStatus());
    trackerContextMock.mockReturnValue({
      session: {
        access_token: "session-token",
        user: { id: "user-1" },
      },
      userId: "user-1",
      supabase,
      startLoading: vi.fn(),
      stopLoading: vi.fn(),
    });
  });

  it("subscribes to the user's private tracker topic and refreshes on broadcast", async () => {
    const { unmount } = renderHook(() => useTasksHubModule());

    await waitFor(() => {
      expect(apiMocks.fetchTrackerBootstrap).toHaveBeenCalledTimes(1);
      expect(apiMocks.getCalendarStatus).toHaveBeenCalledTimes(1);
    });
    expect(supabase.realtime.setAuth).toHaveBeenCalledWith("session-token");
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
      expect(supabase.realtime.setAuth).toHaveBeenCalledWith("session-token");
    });
    expect(supabase.channel).not.toHaveBeenCalled();

    resolveAuth?.();

    await waitFor(() => {
      expect(supabase.channel).toHaveBeenCalledWith("tracker:user:user-1", {
        config: { private: true },
      });
    });
  });
});
