import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getCalendarStatus,
  getGoogleConnectUrl,
  getCalendarSyncProgress,
  triggerCalendarSyncNow,
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
});
