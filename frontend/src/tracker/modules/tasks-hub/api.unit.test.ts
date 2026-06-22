import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createTask,
  createTaskList,
  deleteTaskListViaApi,
  fetchTrackerBootstrap,
  getCalendarStatus,
  getGoogleConnectUrl,
  getCalendarSyncProgress,
  reorderTaskLists,
  reorderTasksViaApi,
  setTaskCompletionViaApi,
  triggerCalendarSyncNow,
  setListSync,
  updateTask,
  updateTaskList,
  upsertSortPreference,
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
      }),
    );
  });

  it("throws useful backend error messages for calendar actions", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({
            error: "Failed to generate Google connect URL",
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: "Failed to sync calendar" }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: "Failed to fetch sync progress" }),
        }),
    );

    await expect(getGoogleConnectUrl("token")).rejects.toThrow(
      "Failed to generate Google connect URL",
    );
    await expect(triggerCalendarSyncNow("token")).rejects.toThrow(
      "Failed to sync calendar",
    );
    await expect(getCalendarSyncProgress("token", "run-1")).rejects.toThrow(
      "Failed to fetch sync progress",
    );
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
      }),
    );
  });

  it("fetches tracker bootstrap data from the backend", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        lists: [{ id: "list-1" }],
        tasks: [{ id: "task-1" }],
        sort_preferences: [{ id: "pref-1" }],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchTrackerBootstrap("token", "America/Chicago");

    expect(result).toEqual({
      ok: true,
      lists: [{ id: "list-1" }],
      tasks: [{ id: "task-1" }],
      sort_preferences: [{ id: "pref-1" }],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:5000/api/private/tracker/bootstrap",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer token",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          browser_timezone: "America/Chicago",
        }),
      }),
    );
  });

  it("uses backend list CRUD and reorder endpoints", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, list: { id: "list-1", name: "Work" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          list: { id: "list-1", name: "Personal" },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          lists: [{ id: "list-2" }, { id: "list-1" }],
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    await expect(createTaskList("token", { name: "Work" })).resolves.toEqual({
      id: "list-1",
      name: "Work",
    });
    await expect(
      updateTaskList("token", "list-1", { name: "Personal" }),
    ).resolves.toEqual({
      id: "list-1",
      name: "Personal",
    });
    await expect(
      reorderTaskLists("token", ["list-2", "list-1"]),
    ).resolves.toEqual([{ id: "list-2" }, { id: "list-1" }]);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("/api/private/lists"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "Work" }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("/api/private/lists/list-1"),
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ name: "Personal" }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("/api/private/lists/reorder"),
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ ordered_list_ids: ["list-2", "list-1"] }),
      }),
    );
  });

  it("uses backend task CRUD, reorder, and sort preference endpoints", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          task: { id: "task-1", title: "Write" },
          calendar_sync_warning: "Task saved, but calendar sync could not be queued.",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, task: { id: "task-1", title: "Ship" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          tasks: [{ id: "task-2" }, { id: "task-1" }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          sort_preference: {
            id: "pref-1",
            sort_mode: "title",
            sort_direction: "asc",
          },
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      createTask("token", {
        list_id: "list-1",
        parent_task_id: null,
        title: "Write",
        details: null,
        due_at: null,
        due_timezone: null,
        recurrence_type: "none",
        recurrence_interval: null,
        recurrence_unit: null,
        recurrence_ends_at: null,
        browser_timezone: "America/Chicago",
      }),
    ).resolves.toEqual({
      ok: true,
      task: { id: "task-1", title: "Write" },
      calendar_sync_warning: "Task saved, but calendar sync could not be queued.",
    });
    await expect(
      updateTask("token", "task-1", { title: "Ship" }),
    ).resolves.toEqual({ ok: true, task: { id: "task-1", title: "Ship" } });
    await expect(
      reorderTasksViaApi("token", "list-1", null, ["task-2", "task-1"]),
    ).resolves.toEqual([{ id: "task-2" }, { id: "task-1" }]);
    await expect(
      upsertSortPreference("token", "list-1", "title", "asc"),
    ).resolves.toEqual({
      id: "pref-1",
      sort_mode: "title",
      sort_direction: "asc",
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("/api/private/tasks"),
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("/api/private/tasks/task-1"),
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ title: "Ship" }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("/api/private/tasks/reorder"),
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          list_id: "list-1",
          parent_task_id: null,
          ordered_task_ids: ["task-2", "task-1"],
        }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining("/api/private/task-sort-preferences/list-1"),
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ sort_mode: "title", sort_direction: "asc" }),
      }),
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
      }),
    );
  });

  it("calls the backend list-sync endpoint with auth and payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        run_id: "",
        queued_cleanup: true,
        cleanup_job_count: 2,
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await setListSync("token", "list-1", false);

    expect(result).toEqual({
      ok: true,
      run_id: "",
      queued_cleanup: true,
      cleanup_job_count: 2,
    });
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
      }),
    );
  });
});
