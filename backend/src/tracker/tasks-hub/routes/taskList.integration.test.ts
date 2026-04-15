import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getUserMock = vi.hoisted(() => vi.fn());
const createClientMock = vi.hoisted(() => vi.fn());
const getSupabaseAdminMock = vi.hoisted(() => vi.fn());
const deleteTaskListForUserMock = vi.hoisted(() => vi.fn());

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}));

vi.mock("../../calendar/services/calendarSyncQueueService", () => ({
  getSupabaseAdmin: getSupabaseAdminMock,
}));

vi.mock("../services/taskListService", () => ({
  deleteTaskListForUser: deleteTaskListForUserMock,
}));

const authorizedClient = {
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
    getSupabaseAdminMock.mockReturnValue({});
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
    expect(deleteTaskListForUserMock).toHaveBeenCalledWith({}, "user-1", "list-1");
  });
});
