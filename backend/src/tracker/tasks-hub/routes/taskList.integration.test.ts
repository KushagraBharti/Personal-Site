import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getUserMock = vi.hoisted(() => vi.fn());
const createClientMock = vi.hoisted(() => vi.fn());
const getSupabaseAdminMock = vi.hoisted(() => vi.fn());
const queueTaskUpsertForUserMock = vi.hoisted(() => vi.fn());
const drainCalendarSyncJobsMock = vi.hoisted(() => vi.fn());
const getTrackerBootstrapForUserMock = vi.hoisted(() => vi.fn());
const createTaskListForUserMock = vi.hoisted(() => vi.fn());
const updateTaskListForUserMock = vi.hoisted(() => vi.fn());
const reorderTaskListsForUserMock = vi.hoisted(() => vi.fn());
const deleteTaskListForUserMock = vi.hoisted(() => vi.fn());
const createTaskForUserMock = vi.hoisted(() => vi.fn());
const updateTaskForUserMock = vi.hoisted(() => vi.fn());
const reorderTasksForUserMock = vi.hoisted(() => vi.fn());
const deleteTaskForUserMock = vi.hoisted(() => vi.fn());
const setTaskCompletionForUserMock = vi.hoisted(() => vi.fn());
const reconcileCompletedRecurringTasksMock = vi.hoisted(() => vi.fn());
const upsertSortPreferenceForUserMock = vi.hoisted(() => vi.fn());

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}));

vi.mock("../../calendar/services/calendarSyncQueueService", () => ({
  getSupabaseAdmin: getSupabaseAdminMock,
}));

vi.mock("../../calendar/services/taskCalendarSyncService", () => ({
  drainCalendarSyncJobs: drainCalendarSyncJobsMock,
  queueTaskUpsertForUser: queueTaskUpsertForUserMock,
}));

vi.mock("../services/taskListService", () => ({
  createTaskForUser: createTaskForUserMock,
  createTaskListForUser: createTaskListForUserMock,
  deleteTaskForUser: deleteTaskForUserMock,
  deleteTaskListForUser: deleteTaskListForUserMock,
  getTrackerBootstrapForUser: getTrackerBootstrapForUserMock,
  reconcileCompletedRecurringTasks: reconcileCompletedRecurringTasksMock,
  reorderTaskListsForUser: reorderTaskListsForUserMock,
  reorderTasksForUser: reorderTasksForUserMock,
  setTaskCompletionForUser: setTaskCompletionForUserMock,
  updateTaskForUser: updateTaskForUserMock,
  updateTaskListForUser: updateTaskListForUserMock,
  upsertSortPreferenceForUser: upsertSortPreferenceForUserMock,
}));

const authorizedClient = {
  auth: {
    getUser: getUserMock,
  },
};

const adminClient = {
  auth: {
    getUser: getUserMock,
  },
};

describe("task list routes", () => {
  beforeEach(() => {
    vi.resetModules();
    getUserMock.mockReset();
    createClientMock.mockReset();
    getSupabaseAdminMock.mockReset();
    queueTaskUpsertForUserMock.mockReset();
    queueTaskUpsertForUserMock.mockResolvedValue(undefined);
    drainCalendarSyncJobsMock.mockReset();
    drainCalendarSyncJobsMock.mockResolvedValue({
      processed: 0,
      failed: 0,
      exhausted: false,
      results: [],
    });
    getTrackerBootstrapForUserMock.mockReset();
    createTaskListForUserMock.mockReset();
    updateTaskListForUserMock.mockReset();
    reorderTaskListsForUserMock.mockReset();
    deleteTaskListForUserMock.mockReset();
    createTaskForUserMock.mockReset();
    updateTaskForUserMock.mockReset();
    reorderTasksForUserMock.mockReset();
    deleteTaskForUserMock.mockReset();
    setTaskCompletionForUserMock.mockReset();
    reconcileCompletedRecurringTasksMock.mockReset();
    upsertSortPreferenceForUserMock.mockReset();

    createClientMock.mockReturnValue(authorizedClient);
    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          email: "user@example.com",
        },
      },
      error: null,
    });
    getSupabaseAdminMock.mockReturnValue(adminClient);
    process.env.SUPABASE_URL = "https://supabase.test";
    process.env.SUPABASE_SECRET_KEY = "service-key";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requires auth for list deletion", async () => {
    const { default: app } = await import("../../../app");
    const response = await request(app).delete("/api/private/lists/list-1");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Unauthorized" });
  }, 15_000);

  it("bootstraps tracker data through the backend service", async () => {
    getTrackerBootstrapForUserMock.mockResolvedValue({
      lists: [{ id: "list-1" }],
      tasks: [{ id: "task-1" }],
      sort_preferences: [{ id: "pref-1" }],
    });

    const { default: app } = await import("../../../app");
    const response = await request(app)
      .post("/api/private/tracker/bootstrap")
      .set("authorization", "Bearer valid-token")
      .send({ browser_timezone: "America/Chicago" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      lists: [{ id: "list-1" }],
      tasks: [{ id: "task-1" }],
      sort_preferences: [{ id: "pref-1" }],
    });
    expect(getTrackerBootstrapForUserMock).toHaveBeenCalledWith(
      adminClient,
      "user-1",
      {
        browserTimeZone: "America/Chicago",
      },
    );
  });

  it("creates a task list through the backend service", async () => {
    createTaskListForUserMock.mockResolvedValue({
      ok: true,
      list: { id: "list-1", name: "Work" },
    });

    const { default: app } = await import("../../../app");
    const response = await request(app)
      .post("/api/private/lists")
      .set("authorization", "Bearer valid-token")
      .send({ name: "Work" });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      ok: true,
      list: { id: "list-1", name: "Work" },
    });
    expect(createTaskListForUserMock).toHaveBeenCalledWith(
      adminClient,
      "user-1",
      {
        name: "Work",
      },
    );
  });

  it("updates and reorders task lists through the backend service", async () => {
    updateTaskListForUserMock.mockResolvedValueOnce({
      ok: true,
      list: { id: "list-1", name: "Personal" },
    });
    reorderTaskListsForUserMock.mockResolvedValueOnce({
      ok: true,
      lists: [
        { id: "list-2", sort_order: 1 },
        { id: "list-1", sort_order: 2 },
      ],
    });

    const { default: app } = await import("../../../app");
    const updateResponse = await request(app)
      .patch("/api/private/lists/list-1")
      .set("authorization", "Bearer valid-token")
      .send({ name: "Personal" });
    const reorderResponse = await request(app)
      .patch("/api/private/lists/reorder")
      .set("authorization", "Bearer valid-token")
      .send({ ordered_list_ids: ["list-2", "list-1"] });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body).toEqual({
      ok: true,
      list: { id: "list-1", name: "Personal" },
    });
    expect(updateTaskListForUserMock).toHaveBeenCalledWith(
      adminClient,
      "user-1",
      "list-1",
      {
        name: "Personal",
      },
    );
    expect(reorderResponse.status).toBe(200);
    expect(reorderResponse.body).toEqual({
      ok: true,
      lists: [
        { id: "list-2", sort_order: 1 },
        { id: "list-1", sort_order: 2 },
      ],
    });
    expect(reorderTaskListsForUserMock).toHaveBeenCalledWith(
      adminClient,
      "user-1",
      ["list-2", "list-1"],
    );
  });

  it("deletes the list through the backend service", async () => {
    deleteTaskListForUserMock.mockResolvedValue({ ok: true });

    const { default: app } = await import("../../../app");
    const response = await request(app)
      .delete("/api/private/lists/list-1")
      .set("authorization", "Bearer valid-token");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
    expect(deleteTaskListForUserMock).toHaveBeenCalledWith(
      adminClient,
      "user-1",
      "list-1",
    );
  });

  it("creates, updates, and reorders tasks through the backend service", async () => {
    createTaskForUserMock.mockResolvedValueOnce({
      ok: true,
      task: {
        id: "task-1",
        list_id: "list-1",
        title: "Write",
        updated_at: "2026-06-20T00:00:00.000Z",
      },
    });
    updateTaskForUserMock.mockResolvedValueOnce({
      ok: true,
      task: {
        id: "task-1",
        list_id: "list-1",
        title: "Ship",
        updated_at: "2026-06-20T00:01:00.000Z",
      },
    });
    reorderTasksForUserMock.mockResolvedValueOnce({
      ok: true,
      tasks: [
        { id: "task-2", sort_order: 1 },
        { id: "task-1", sort_order: 2 },
      ],
    });

    const { default: app } = await import("../../../app");
    const createResponse = await request(app)
      .post("/api/private/tasks")
      .set("authorization", "Bearer valid-token")
      .send({ list_id: "list-1", title: "Write" });
    const updateResponse = await request(app)
      .patch("/api/private/tasks/task-1")
      .set("authorization", "Bearer valid-token")
      .send({ title: "Ship" });
    const reorderResponse = await request(app)
      .patch("/api/private/tasks/reorder")
      .set("authorization", "Bearer valid-token")
      .send({
        list_id: "list-1",
        parent_task_id: null,
        ordered_task_ids: ["task-2", "task-1"],
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toEqual({
      ok: true,
      task: {
        id: "task-1",
        list_id: "list-1",
        title: "Write",
        updated_at: "2026-06-20T00:00:00.000Z",
      },
    });
    expect(createTaskForUserMock).toHaveBeenCalledWith(adminClient, "user-1", {
      list_id: "list-1",
      title: "Write",
    });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body).toEqual({
      ok: true,
      task: {
        id: "task-1",
        list_id: "list-1",
        title: "Ship",
        updated_at: "2026-06-20T00:01:00.000Z",
      },
    });
    expect(updateTaskForUserMock).toHaveBeenCalledWith(
      adminClient,
      "user-1",
      "task-1",
      {
        title: "Ship",
      },
    );
    expect(reorderResponse.status).toBe(200);
    expect(reorderResponse.body).toEqual({
      ok: true,
      tasks: [
        { id: "task-2", sort_order: 1 },
        { id: "task-1", sort_order: 2 },
      ],
    });
    expect(reorderTasksForUserMock).toHaveBeenCalledWith(
      adminClient,
      "user-1",
      {
        list_id: "list-1",
        parent_task_id: null,
        ordered_task_ids: ["task-2", "task-1"],
      },
    );
    expect(queueTaskUpsertForUserMock).toHaveBeenNthCalledWith(
      1,
      adminClient,
      "user-1",
      {
        id: "task-1",
        list_id: "list-1",
        title: "Write",
        updated_at: "2026-06-20T00:00:00.000Z",
      },
      "api_task_create",
    );
    expect(queueTaskUpsertForUserMock).toHaveBeenNthCalledWith(
      2,
      adminClient,
      "user-1",
      {
        id: "task-1",
        list_id: "list-1",
        title: "Ship",
        updated_at: "2026-06-20T00:01:00.000Z",
      },
      "api_task_update",
    );
    expect(drainCalendarSyncJobsMock).not.toHaveBeenCalled();
  });

  it("returns a calendar sync warning when task enqueue fails", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    queueTaskUpsertForUserMock.mockRejectedValueOnce(new Error("queue down"));
    createTaskForUserMock.mockResolvedValueOnce({
      ok: true,
      task: {
        id: "task-1",
        list_id: "list-1",
        title: "Write",
        updated_at: "2026-06-20T00:00:00.000Z",
      },
    });

    const { default: app } = await import("../../../app");
    const response = await request(app)
      .post("/api/private/tasks")
      .set("authorization", "Bearer valid-token")
      .send({ list_id: "list-1", title: "Write" });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      ok: true,
      task: {
        id: "task-1",
        list_id: "list-1",
        title: "Write",
        updated_at: "2026-06-20T00:00:00.000Z",
      },
      calendar_sync_warning: "Task saved, but calendar sync could not be queued.",
    });
    expect(drainCalendarSyncJobsMock).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalled();
  });

  it("deletes a task through the backend service", async () => {
    deleteTaskForUserMock.mockResolvedValue({ ok: true });

    const { default: app } = await import("../../../app");
    const response = await request(app)
      .delete("/api/private/tasks/task-1")
      .set("authorization", "Bearer valid-token");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
    expect(deleteTaskForUserMock).toHaveBeenCalledWith(
      adminClient,
      "user-1",
      "task-1",
    );
    expect(drainCalendarSyncJobsMock).not.toHaveBeenCalled();
  });

  it("updates task completion through the backend service", async () => {
    setTaskCompletionForUserMock.mockResolvedValue({
      ok: true,
      task: {
        id: "task-1",
        list_id: "list-1",
        is_completed: true,
        updated_at: "2026-06-20T00:02:00.000Z",
      },
      createdNextTask: null,
    });

    const { default: app } = await import("../../../app");
    const response = await request(app)
      .patch("/api/private/tasks/task-1/completion")
      .set("authorization", "Bearer valid-token")
      .send({ is_completed: true });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      task: {
        id: "task-1",
        list_id: "list-1",
        is_completed: true,
        updated_at: "2026-06-20T00:02:00.000Z",
      },
      created_next_task: null,
    });
    expect(setTaskCompletionForUserMock).toHaveBeenCalledWith(
      adminClient,
      "user-1",
      "task-1",
      true,
    );
    expect(queueTaskUpsertForUserMock).toHaveBeenCalledWith(
      adminClient,
      "user-1",
      {
        id: "task-1",
        list_id: "list-1",
        is_completed: true,
        updated_at: "2026-06-20T00:02:00.000Z",
      },
      "api_task_completion",
    );
    expect(drainCalendarSyncJobsMock).not.toHaveBeenCalled();
  });

  it("rejects malformed task completion payloads", async () => {
    const { default: app } = await import("../../../app");
    const response = await request(app)
      .patch("/api/private/tasks/task-1/completion")
      .set("authorization", "Bearer valid-token")
      .send({ is_completed: "yes" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "is_completed boolean is required",
    });
    expect(setTaskCompletionForUserMock).not.toHaveBeenCalled();
  });

  it("saves sort preferences through the backend service", async () => {
    upsertSortPreferenceForUserMock.mockResolvedValue({
      ok: true,
      sort_preference: {
        id: "pref-1",
        list_id: "list-1",
        sort_mode: "title",
        sort_direction: "asc",
      },
    });

    const { default: app } = await import("../../../app");
    const response = await request(app)
      .put("/api/private/task-sort-preferences/list-1")
      .set("authorization", "Bearer valid-token")
      .send({ sort_mode: "title", sort_direction: "asc" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      sort_preference: {
        id: "pref-1",
        list_id: "list-1",
        sort_mode: "title",
        sort_direction: "asc",
      },
    });
    expect(upsertSortPreferenceForUserMock).toHaveBeenCalledWith(
      adminClient,
      "user-1",
      "list-1",
      { sort_mode: "title", sort_direction: "asc" },
    );
  });
});
