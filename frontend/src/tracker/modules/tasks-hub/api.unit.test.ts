import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteTaskListViaApi,
  getCalendarStatus,
  getGoogleConnectUrl,
  getCalendarSyncProgress,
  setTaskCompletionViaApi,
  triggerCalendarSyncNow,
  setListSync,
} from "./api";

describe("tasks-hub API", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("sends the auth header and returns the calendar status payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        connected: true,
        connection: null,
        watch_expires_at: null,
        list_sync_settings: [],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await getCalendarStatus("token");

    expect(result.connected).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/private/calendar/status"),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer token",
        }),
      })
    );
  });

  it("throws useful backend error messages for calendar actions", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: "Failed to generate Google connect URL" }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: "Failed to sync calendar" }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: "Failed to fetch sync progress" }),
        })
    );

    await expect(getGoogleConnectUrl("token")).rejects.toThrow("Failed to generate Google connect URL");
    await expect(triggerCalendarSyncNow("token")).rejects.toThrow("Failed to sync calendar");
    await expect(getCalendarSyncProgress("token", "run-1")).rejects.toThrow("Failed to fetch sync progress");
  });

  it("calls the backend delete-list endpoint with auth", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await deleteTaskListViaApi("token", "list-1");

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/private/lists/list-1"),
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({
          Authorization: "Bearer token",
        }),
      })
    );
  });

  it("calls the backend task-completion endpoint with auth and payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        task: { id: "task-1", is_completed: true },
        created_next_task: null,
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await setTaskCompletionViaApi("token", "task-1", true);

    expect(result).toEqual({
      ok: true,
      task: { id: "task-1", is_completed: true },
      created_next_task: null,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/private/tasks/task-1/completion"),
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({
          Authorization: "Bearer token",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          is_completed: true,
        }),
      })
    );
  });

  it("calls the backend list-sync endpoint with auth and payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, queued_cleanup: true, cleanup_job_count: 2 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await setListSync("token", "list-1", false);

    expect(result).toEqual({ ok: true, queued_cleanup: true, cleanup_job_count: 2 });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/private/calendar/list-sync"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer token",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          list_id: "list-1",
          sync_enabled: false,
        }),
      })
    );
  });
});
