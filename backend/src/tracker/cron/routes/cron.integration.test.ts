import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const processCalendarSyncJobsMock = vi.hoisted(() => vi.fn());
const renewExpiringCalendarWatchesMock = vi.hoisted(() => vi.fn());

vi.mock("../../calendar/services/taskCalendarSyncService", () => ({
  processCalendarSyncJobs: processCalendarSyncJobsMock,
  renewExpiringCalendarWatches: renewExpiringCalendarWatchesMock,
}));

describe("cron routes", () => {
  beforeEach(() => {
    vi.resetModules();
    processCalendarSyncJobsMock.mockReset();
    renewExpiringCalendarWatchesMock.mockReset();
    process.env.CRON_SECRET = "cron-secret";
    process.env.CALENDAR_SYNC_ENABLED = "1";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requires cron auth", async () => {
    const { default: app } = await import("../../../app");
    const response = await request(app).get("/api/private/cron/health");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Unauthorized" });
  });

  it("returns health when the cron secret is valid", async () => {
    const { default: app } = await import("../../../app");
    const response = await request(app)
      .get("/api/private/cron/health")
      .set("authorization", "Bearer cron-secret");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("returns a disabled payload when calendar sync is off", async () => {
    process.env.CALENDAR_SYNC_ENABLED = "0";

    const { default: app } = await import("../../../app");
    const response = await request(app)
      .post("/api/private/cron/calendar-sync")
      .set("authorization", "Bearer cron-secret");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, disabled: true });
  });

  it("returns calendar sync results when processing succeeds", async () => {
    processCalendarSyncJobsMock.mockResolvedValue([
      { ok: true },
      { ok: false },
    ]);

    const { default: app } = await import("../../../app");
    const response = await request(app)
      .post("/api/private/cron/calendar-sync")
      .set("authorization", "Bearer cron-secret");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      ok: true,
      processed: 2,
      failed: 1,
    });
  });

  it("logs and returns 500 when watch renewal fails", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    renewExpiringCalendarWatchesMock.mockRejectedValue(new Error("watch renew failed"));

    const { default: app } = await import("../../../app");
    const response = await request(app)
      .get("/api/private/cron/calendar-watch-renew")
      .set("authorization", "Bearer cron-secret");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Failed to renew calendar watches" });
    expect(errorSpy).toHaveBeenCalled();
  });
});
