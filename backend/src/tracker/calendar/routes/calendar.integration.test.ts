import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getUserMock = vi.hoisted(() => vi.fn());
const createClientMock = vi.hoisted(() => vi.fn());
const createGoogleOAuthStateMock = vi.hoisted(() => vi.fn());
const createGoogleOAuthUrlMock = vi.hoisted(() => vi.fn());
const exchangeGoogleOAuthCodeMock = vi.hoisted(() => vi.fn());
const parseGoogleOAuthStateMock = vi.hoisted(() => vi.fn());
const getCalendarStatusForUserMock = vi.hoisted(() => vi.fn());
const upsertGoogleConnectionFromOAuthMock = vi.hoisted(() => vi.fn());
const renewCalendarWatchForUserMock = vi.hoisted(() => vi.fn());
const queueFullBackfillMock = vi.hoisted(() => vi.fn());
const disconnectGoogleCalendarForUserMock = vi.hoisted(() => vi.fn());
const upsertListSyncSettingMock = vi.hoisted(() => vi.fn());
const queueManualSyncForUserMock = vi.hoisted(() => vi.fn());
const processCalendarSyncJobsMock = vi.hoisted(() => vi.fn());
const runLegacyManualSyncForUserMock = vi.hoisted(() => vi.fn());
const queueLivePumpForUserMock = vi.hoisted(() => vi.fn());
const queueRebuildRunForUserMock = vi.hoisted(() => vi.fn());
const rebuildCalendarLegacyInlineForUserMock = vi.hoisted(() => vi.fn());
const getSyncProgressForRunMock = vi.hoisted(() => vi.fn());
const getSyncRunDebugMock = vi.hoisted(() => vi.fn());
const inferLanesForRunModeMock = vi.hoisted(() => vi.fn());
const isCalendarRebuildSchemaUnavailableMock = vi.hoisted(() => vi.fn());
const handleGoogleWebhookMock = vi.hoisted(() => vi.fn());
const getSupabaseAdminMock = vi.hoisted(() => vi.fn());

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}));

vi.mock("../services/googleCalendarOAuthService", () => ({
  createGoogleOAuthState: createGoogleOAuthStateMock,
  createGoogleOAuthUrl: createGoogleOAuthUrlMock,
  exchangeGoogleOAuthCode: exchangeGoogleOAuthCodeMock,
  parseGoogleOAuthState: parseGoogleOAuthStateMock,
}));

vi.mock("../services/taskCalendarSyncService", () => ({
  disconnectGoogleCalendarForUser: disconnectGoogleCalendarForUserMock,
  getCalendarStatusForUser: getCalendarStatusForUserMock,
  getSyncRunDebug: getSyncRunDebugMock,
  getSyncProgressForRun: getSyncProgressForRunMock,
  inferLanesForRunMode: inferLanesForRunModeMock,
  isCalendarRebuildSchemaUnavailable: isCalendarRebuildSchemaUnavailableMock,
  processCalendarSyncJobs: processCalendarSyncJobsMock,
  queueLivePumpForUser: queueLivePumpForUserMock,
  queueManualSyncForUser: queueManualSyncForUserMock,
  queueRebuildRunForUser: queueRebuildRunForUserMock,
  queueFullBackfill: queueFullBackfillMock,
  rebuildCalendarLegacyInlineForUser: rebuildCalendarLegacyInlineForUserMock,
  renewCalendarWatchForUser: renewCalendarWatchForUserMock,
  runLegacyManualSyncForUser: runLegacyManualSyncForUserMock,
  upsertGoogleConnectionFromOAuth: upsertGoogleConnectionFromOAuthMock,
  upsertListSyncSetting: upsertListSyncSettingMock,
}));

vi.mock("../services/calendarSyncQueueService", () => ({
  getSupabaseAdmin: getSupabaseAdminMock,
}));

vi.mock("../services/calendarWebhookService", () => ({
  handleGoogleWebhook: handleGoogleWebhookMock,
}));

const authorizedClient = {
  auth: {
    getUser: getUserMock,
  },
};

describe("calendar tracker routes", () => {
  beforeEach(() => {
    vi.resetModules();
    getUserMock.mockReset();
    createClientMock.mockReset();
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
    createGoogleOAuthStateMock.mockReset();
    createGoogleOAuthUrlMock.mockReset();
    exchangeGoogleOAuthCodeMock.mockReset();
    parseGoogleOAuthStateMock.mockReset();
    getCalendarStatusForUserMock.mockReset();
    upsertGoogleConnectionFromOAuthMock.mockReset();
    renewCalendarWatchForUserMock.mockReset();
    queueFullBackfillMock.mockReset();
    disconnectGoogleCalendarForUserMock.mockReset();
    upsertListSyncSettingMock.mockReset();
    queueManualSyncForUserMock.mockReset();
    processCalendarSyncJobsMock.mockReset();
    runLegacyManualSyncForUserMock.mockReset();
    queueLivePumpForUserMock.mockReset();
    queueRebuildRunForUserMock.mockReset();
    rebuildCalendarLegacyInlineForUserMock.mockReset();
    getSyncProgressForRunMock.mockReset();
    getSyncRunDebugMock.mockReset();
    inferLanesForRunModeMock.mockReset();
    isCalendarRebuildSchemaUnavailableMock.mockReset();
    handleGoogleWebhookMock.mockReset();
    getSupabaseAdminMock.mockReset();
    getSupabaseAdminMock.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    process.env.SUPABASE_URL = "https://supabase.test";
    process.env.SUPABASE_SECRET_KEY = "service-key";
    process.env.TRACKER_FRONTEND_URL = "http://localhost:5173/tracker?module=tasks";
    process.env.CALENDAR_SYNC_ENABLED = "1";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requires auth for protected calendar routes", async () => {
    const { default: app } = await import("../../../app");
    const response = await request(app).get("/api/private/calendar/status");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Unauthorized" });
  });

  it("returns a disabled payload when calendar sync is off", async () => {
    process.env.CALENDAR_SYNC_ENABLED = "0";
    const { default: app } = await import("../../../app");

    const response = await request(app)
      .get("/api/private/calendar/status")
      .set("authorization", "Bearer valid-token");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      connected: false,
      connection: null,
      watch_expires_at: null,
      list_sync_settings: [],
    });
  });

  it("redirects the Google callback to an error when the code or state is missing", async () => {
    const { default: app } = await import("../../../app");
    const response = await request(app).get("/api/private/calendar/google/callback");

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain("calendar=error");
    expect(response.headers.location).toContain("missing_code_or_state");
  });

  it("returns 400 when selecting a calendar without calendar_id", async () => {
    const { default: app } = await import("../../../app");
    const response = await request(app)
      .post("/api/private/calendar/select-calendar")
      .set("authorization", "Bearer valid-token")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "calendar_id is required" });
  });

  it("returns 404 when a sync run is not found", async () => {
    getSyncRunDebugMock.mockResolvedValue(null);

    const { default: app } = await import("../../../app");
    const response = await request(app)
      .get("/api/private/calendar/runs/run-123")
      .set("authorization", "Bearer valid-token");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Sync run not found" });
  });

  it("returns 500 and logs when sync-now fails", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    queueManualSyncForUserMock.mockRejectedValue(new Error("queue failed"));
    runLegacyManualSyncForUserMock.mockRejectedValue(new Error("legacy failed"));

    const { default: app } = await import("../../../app");
    const response = await request(app)
      .post("/api/private/calendar/sync-now")
      .set("authorization", "Bearer valid-token");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "legacy failed" });
    expect(errorSpy).toHaveBeenCalled();
  });
});
