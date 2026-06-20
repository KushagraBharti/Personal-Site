import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getUserMock = vi.hoisted(() => vi.fn());
const createClientMock = vi.hoisted(() => vi.fn());
const getSupabaseAdminMock = vi.hoisted(() => vi.fn());
const deleteTaskListForUserMock = vi.hoisted(() => vi.fn());
const deleteTaskForUserMock = vi.hoisted(() => vi.fn());
const setTaskCompletionForUserMock = vi.hoisted(() => vi.fn());
const reconcileCompletedRecurringTasksMock = vi.hoisted(() => vi.fn());

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}));

vi.mock("../../calendar/services/calendarSyncQueueService", () => ({
  getSupabaseAdmin: getSupabaseAdminMock,
}));

vi.mock("../services/taskListService", () => ({
  deleteTaskForUser: deleteTaskForUserMock,
  deleteTaskListForUser: deleteTaskListForUserMock,
  reconcileCompletedRecurringTasks: reconcileCompletedRecurringTasksMock,
  setTaskCompletionForUser: setTaskCompletionForUserMock,
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
    deleteTaskListForUserMock.mockReset();
    deleteTaskForUserMock.mockReset();
    setTaskCompletionForUserMock.mockReset();
    reconcileCompletedRecurringTasksMock.mockReset();

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
  });

  it("deletes the list through the backend service", async () => {
    deleteTaskListForUserMock.mockResolvedValue({ ok: true });

    const { default: app } = await import("../../../app");
    const response = await request(app)
      .delete("/api/private/lists/list-1")
      .set("authorization", "Bearer valid-token");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
    expect(deleteTaskListForUserMock).toHaveBeenCalledWith(adminClient, "user-1", "list-1");
  });

  it("deletes a task through the backend service", async () => {
    deleteTaskForUserMock.mockResolvedValue({ ok: true });

    const { default: app } = await import("../../../app");
    const response = await request(app)
      .delete("/api/private/tasks/task-1")
      .set("authorization", "Bearer valid-token");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
    expect(deleteTaskForUserMock).toHaveBeenCalledWith(adminClient, "user-1", "task-1");
  });

  it("updates task completion through the backend service", async () => {
    setTaskCompletionForUserMock.mockResolvedValue({
      ok: true,
      task: { id: "task-1", is_completed: true },
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
      task: { id: "task-1", is_completed: true },
      created_next_task: null,
    });
    expect(setTaskCompletionForUserMock).toHaveBeenCalledWith(
      adminClient,
      "user-1",
      "task-1",
      true
    );
  });

  it("rejects malformed task completion payloads", async () => {
    const { default: app } = await import("../../../app");
    const response = await request(app)
      .patch("/api/private/tasks/task-1/completion")
      .set("authorization", "Bearer valid-token")
      .send({ is_completed: "yes" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "is_completed boolean is required" });
    expect(setTaskCompletionForUserMock).not.toHaveBeenCalled();
  });
});
