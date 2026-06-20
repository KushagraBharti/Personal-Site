import { beforeEach, describe, expect, it, vi } from "vitest";
import { TrackerTaskGoogleProjectionEventLinkRow, TrackerTaskRow } from "../../../types/googleCalendar";

const googleApiMocks = vi.hoisted(() => ({
  getValidGoogleAccessToken: vi.fn(),
  insertGoogleEvent: vi.fn(),
  patchGoogleEvent: vi.fn(),
  deleteGoogleEvent: vi.fn(),
}));

vi.mock("./googleCalendarApiService", () => {
  return {
    ensureTasksCalendar: vi.fn(),
    fetchGoogleUserEmail: vi.fn(),
    getValidGoogleAccessToken: googleApiMocks.getValidGoogleAccessToken,
    hashChannelToken: vi.fn(),
    insertGoogleEvent: googleApiMocks.insertGoogleEvent,
    patchGoogleEvent: googleApiMocks.patchGoogleEvent,
    deleteGoogleEvent: googleApiMocks.deleteGoogleEvent,
    isDateOnlyIso: (isoString: string | null | undefined) => {
      if (!isoString) return false;
      const parsed = new Date(isoString);
      if (Number.isNaN(parsed.getTime())) return false;
      return parsed.getMilliseconds() === 777;
    },
    listGoogleEventsDelta: vi.fn(),
    listGoogleEventsPage: vi.fn(),
    loadCalendarConnection: vi.fn(),
    stopGoogleCalendarWatch: vi.fn(),
    taskIdToDeterministicGoogleEventId: (taskId: string) => `primary-${taskId}`,
    taskProjectionToDeterministicGoogleEventId: (taskId: string, projectionIndex: number) =>
      `projection-${taskId}-${projectionIndex}`,
    taskToGoogleEventPayload: (
      task: TrackerTaskRow,
      options?: {
        dueAt?: string | null;
        titleMode?: "default" | "done" | "upcoming";
        eventKind?: "primary" | "projection";
        projectionIndex?: number;
      }
    ) => {
      const dueAt = options?.dueAt ?? task.due_at;
      const prefix =
        options?.titleMode === "done"
          ? "[Done] "
          : options?.titleMode === "upcoming"
            ? "[Upcoming] "
            : "";
      return {
        summary: `${prefix}${task.title}`,
        start: dueAt ? { dateTime: dueAt } : undefined,
        end: dueAt ? { dateTime: dueAt } : undefined,
        extendedProperties: {
          private: {
            tracker_task_id: task.id,
            tracker_event_kind: options?.eventKind ?? "primary",
            tracker_projection_index:
              typeof options?.projectionIndex === "number"
                ? String(options.projectionIndex)
                : "",
          },
        },
      };
    },
    upsertGoogleCalendarWatch: vi.fn(),
    googleEventToTaskDueAtIso: vi.fn(),
    googleEventToTrackerEventKind: (event: any) =>
      event?.extendedProperties?.private?.tracker_event_kind === "projection"
        ? "projection"
        : "primary",
    googleEventToTrackerProjectionIndex: (event: any) => {
      const value = Number(event?.extendedProperties?.private?.tracker_projection_index);
      return Number.isInteger(value) && value > 0 ? value : null;
    },
  };
});

interface MockSupabaseState {
  taskById: Record<string, TrackerTaskRow>;
  listSyncByListId: Record<string, boolean>;
  primaryLinkByTaskId: Record<string, any | null>;
  projectionLinksByTaskId: Record<string, TrackerTaskGoogleProjectionEventLinkRow[]>;
  upsertedPrimaryLinks: any[];
  upsertedProjectionLinks: any[];
  updatedPrimaryRows: any[];
  updatedProjectionRows: any[];
}

const buildTask = (overrides?: Partial<TrackerTaskRow>): TrackerTaskRow => ({
  id: "task-1",
  user_id: "user-1",
  list_id: "list-1",
  parent_task_id: null,
  title: "Task A",
  details: null,
  due_at: "2026-04-14T03:00:00.000Z",
  due_timezone: "America/Chicago",
  is_completed: false,
  completed_at: null,
  recurrence_type: "daily",
  recurrence_interval: null,
  recurrence_unit: null,
  recurrence_ends_at: null,
  sort_order: 1,
  created_at: "2026-04-13T00:00:00.000Z",
  updated_at: "2026-04-13T00:00:00.000Z",
  ...overrides,
});

class MockQueryBuilder {
  private filters: Record<string, unknown> = {};
  private payload: any = null;
  private operation: "select" | "upsert" | "update" | null = null;

  constructor(
    private readonly table: string,
    private readonly state: MockSupabaseState
  ) {}

  select() {
    this.operation = "select";
    return this;
  }

  upsert(payload: any) {
    this.operation = "upsert";
    this.payload = payload;
    return this;
  }

  update(payload: any) {
    this.operation = "update";
    this.payload = payload;
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters[column] = value;
    return this;
  }

  order() {
    return this.execute();
  }

  maybeSingle() {
    return this.execute();
  }

  then(resolve: (value: any) => any, reject?: (reason: any) => any) {
    return this.execute().then(resolve, reject);
  }

  private execute() {
    if (this.operation === "upsert") {
      if (this.table === "tracker_task_google_event_links") {
        this.state.upsertedPrimaryLinks.push(this.payload);
        this.state.primaryLinkByTaskId[String(this.payload.task_id)] = {
          ...this.state.primaryLinkByTaskId[String(this.payload.task_id)],
          ...this.payload,
          id: this.state.primaryLinkByTaskId[String(this.payload.task_id)]?.id ?? 1,
        };
      } else if (this.table === "tracker_task_google_projection_event_links") {
        this.state.upsertedProjectionLinks.push(this.payload);
        const taskId = String(this.payload.task_id);
        const existing = this.state.projectionLinksByTaskId[taskId] ?? [];
        const filtered = existing.filter(
          (row) => row.projection_index !== this.payload.projection_index
        );
        filtered.push({
          id: existing.find((row) => row.projection_index === this.payload.projection_index)?.id ?? filtered.length + 1,
          ...this.payload,
        });
        this.state.projectionLinksByTaskId[taskId] = filtered;
      }
      return Promise.resolve({ error: null });
    }

    if (this.operation === "update") {
      if (this.table === "tracker_task_google_event_links") {
        this.state.updatedPrimaryRows.push({ payload: this.payload, filters: { ...this.filters } });
      } else if (this.table === "tracker_task_google_projection_event_links") {
        this.state.updatedProjectionRows.push({ payload: this.payload, filters: { ...this.filters } });
      }
      return Promise.resolve({ error: null });
    }

    if (this.table === "tracker_tasks") {
      return Promise.resolve({
        data: this.state.taskById[String(this.filters.id)] ?? null,
        error: null,
      });
    }

    if (this.table === "tracker_task_list_sync_settings") {
      return Promise.resolve({
        data: {
          sync_enabled: !!this.state.listSyncByListId[String(this.filters.list_id)],
        },
        error: null,
      });
    }

    if (this.table === "tracker_task_google_event_links") {
      return Promise.resolve({
        data: this.state.primaryLinkByTaskId[String(this.filters.task_id)] ?? null,
        error: null,
      });
    }

    if (this.table === "tracker_task_google_projection_event_links") {
      const taskId = String(this.filters.task_id);
      return Promise.resolve({
        data: [...(this.state.projectionLinksByTaskId[taskId] ?? [])],
        error: null,
      });
    }

    return Promise.resolve({ data: null, error: null });
  }
}

const createSupabaseMock = (state: MockSupabaseState) =>
  ({
    from: (table: string) => new MockQueryBuilder(table, state),
  }) as any;

describe("taskCalendarSyncService", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-15T04:00:00.000Z"));
    googleApiMocks.getValidGoogleAccessToken.mockReset();
    googleApiMocks.insertGoogleEvent.mockReset();
    googleApiMocks.patchGoogleEvent.mockReset();
    googleApiMocks.deleteGoogleEvent.mockReset();
    googleApiMocks.getValidGoogleAccessToken.mockResolvedValue({
      accessToken: "token",
      publicRow: { selected_calendar_id: "calendar-1" },
    });
    googleApiMocks.insertGoogleEvent.mockImplementation(
      async (_accessToken: string, _calendarId: string, body: Record<string, unknown>) => ({
        id: String(body.id),
        etag: "etag",
        updated: "2026-04-15T04:00:00.000Z",
      })
    );
    googleApiMocks.patchGoogleEvent.mockImplementation(
      async (_accessToken: string, _calendarId: string, eventId: string) => ({
        id: eventId,
        etag: "etag",
        updated: "2026-04-15T04:00:00.000Z",
      })
    );
    googleApiMocks.deleteGoogleEvent.mockResolvedValue(undefined);
  });

  it("identifies old trigger jobs without suppressing newer live trigger jobs", async () => {
    const { isLegacyTaskTriggerSyncJob } = await import("./taskCalendarSyncService");
    const baseJob = {
      id: 1,
      user_id: "user-1",
      run_id: null,
      lane: "live",
      task_id: "task-1",
      google_event_id: null,
      list_id: "list-1",
      job_type: "task_upsert",
      source: null,
      dedupe_key: null,
      priority: 100,
      payload: { source: "trigger" },
      status: "pending",
      attempt_count: 0,
      max_attempts: 5,
      run_after: "2026-04-15T04:00:00.000Z",
      last_error: null,
      locked_at: null,
      created_at: "2026-04-15T04:00:00.000Z",
      updated_at: "2026-04-15T04:00:00.000Z",
    } as const;

    expect(isLegacyTaskTriggerSyncJob(baseJob)).toBe(true);
    expect(
      isLegacyTaskTriggerSyncJob({
        ...baseJob,
        source: "trigger_task_change",
        payload: { source: "trigger_task_change" },
        priority: 5,
      })
    ).toBe(false);
  });

  it("creates one primary event and three projected events for overdue recurring tasks", async () => {
    const { processTaskUpsertJob } = await import("./taskCalendarSyncService");
    const state: MockSupabaseState = {
      taskById: { "task-1": buildTask() },
      listSyncByListId: { "list-1": true },
      primaryLinkByTaskId: {},
      projectionLinksByTaskId: {},
      upsertedPrimaryLinks: [],
      upsertedProjectionLinks: [],
      updatedPrimaryRows: [],
      updatedProjectionRows: [],
    };

    await processTaskUpsertJob(createSupabaseMock(state), {
      id: 1,
      user_id: "user-1",
      run_id: null,
      lane: "live",
      task_id: "task-1",
      google_event_id: null,
      list_id: "list-1",
      job_type: "task_upsert",
      source: "test",
      dedupe_key: "dedupe-1",
      priority: 5,
      payload: {},
      status: "pending",
      attempt_count: 0,
      max_attempts: 5,
      run_after: "2026-04-15T04:00:00.000Z",
      last_error: null,
      locked_at: null,
      created_at: "2026-04-15T04:00:00.000Z",
      updated_at: "2026-04-15T04:00:00.000Z",
    });

    expect(googleApiMocks.insertGoogleEvent).toHaveBeenCalledTimes(4);
    expect(state.upsertedPrimaryLinks).toHaveLength(1);
    expect(state.upsertedProjectionLinks).toHaveLength(3);
    expect(
      googleApiMocks.insertGoogleEvent.mock.calls.slice(1).map((call) => call[2].summary)
    ).toEqual([
      "[Upcoming] Task A",
      "[Upcoming] Task A",
      "[Upcoming] Task A",
    ]);
  });

  it("marks completed non-recurring events as done instead of deleting them", async () => {
    const { processTaskUpsertJob } = await import("./taskCalendarSyncService");
    const state: MockSupabaseState = {
      taskById: {
        "task-1": buildTask({
          recurrence_type: "none",
          is_completed: true,
          completed_at: "2026-04-15T04:00:00.000Z",
        }),
      },
      listSyncByListId: { "list-1": true },
      primaryLinkByTaskId: {
        "task-1": {
          id: 1,
          calendar_id: "calendar-1",
          google_event_id: "evt-1",
          google_event_etag: "etag-old",
          google_event_updated_at: "2026-04-14T00:00:00.000Z",
          is_deleted: false,
        },
      },
      projectionLinksByTaskId: {},
      upsertedPrimaryLinks: [],
      upsertedProjectionLinks: [],
      updatedPrimaryRows: [],
      updatedProjectionRows: [],
    };

    await processTaskUpsertJob(createSupabaseMock(state), {
      id: 1,
      user_id: "user-1",
      run_id: null,
      lane: "live",
      task_id: "task-1",
      google_event_id: null,
      list_id: "list-1",
      job_type: "task_upsert",
      source: "test",
      dedupe_key: "dedupe-2",
      priority: 5,
      payload: {},
      status: "pending",
      attempt_count: 0,
      max_attempts: 5,
      run_after: "2026-04-15T04:00:00.000Z",
      last_error: null,
      locked_at: null,
      created_at: "2026-04-15T04:00:00.000Z",
      updated_at: "2026-04-15T04:00:00.000Z",
    });

    expect(googleApiMocks.patchGoogleEvent).toHaveBeenCalledTimes(1);
    expect(googleApiMocks.deleteGoogleEvent).not.toHaveBeenCalled();
    expect(googleApiMocks.patchGoogleEvent.mock.calls[0]?.[3]).toMatchObject({
      summary: "[Done] Task A",
    });
  });

  it("deletes primary and projected events for completed recurring tasks", async () => {
    const { processTaskUpsertJob } = await import("./taskCalendarSyncService");
    const state: MockSupabaseState = {
      taskById: {
        "task-1": buildTask({
          is_completed: true,
          completed_at: "2026-04-15T04:00:00.000Z",
        }),
      },
      listSyncByListId: { "list-1": true },
      primaryLinkByTaskId: {
        "task-1": {
          id: 1,
          calendar_id: "calendar-1",
          google_event_id: "evt-primary",
          google_event_etag: "etag-old",
          google_event_updated_at: "2026-04-14T00:00:00.000Z",
          is_deleted: false,
        },
      },
      projectionLinksByTaskId: {
        "task-1": [
          {
            id: 2,
            user_id: "user-1",
            task_id: "task-1",
            calendar_id: "calendar-1",
            google_event_id: "evt-proj-1",
            projection_index: 1,
            projected_due_at: "2026-04-15T03:00:00.000Z",
            google_event_etag: null,
            google_event_updated_at: null,
            last_synced_task_updated_at: null,
            last_sync_source: "app",
            is_deleted: false,
            created_at: "2026-04-14T00:00:00.000Z",
            updated_at: "2026-04-14T00:00:00.000Z",
          },
          {
            id: 3,
            user_id: "user-1",
            task_id: "task-1",
            calendar_id: "calendar-1",
            google_event_id: "evt-proj-2",
            projection_index: 2,
            projected_due_at: "2026-04-16T03:00:00.000Z",
            google_event_etag: null,
            google_event_updated_at: null,
            last_synced_task_updated_at: null,
            last_sync_source: "app",
            is_deleted: false,
            created_at: "2026-04-14T00:00:00.000Z",
            updated_at: "2026-04-14T00:00:00.000Z",
          },
          {
            id: 4,
            user_id: "user-1",
            task_id: "task-1",
            calendar_id: "calendar-1",
            google_event_id: "evt-proj-3",
            projection_index: 3,
            projected_due_at: "2026-04-17T03:00:00.000Z",
            google_event_etag: null,
            google_event_updated_at: null,
            last_synced_task_updated_at: null,
            last_sync_source: "app",
            is_deleted: false,
            created_at: "2026-04-14T00:00:00.000Z",
            updated_at: "2026-04-14T00:00:00.000Z",
          },
        ],
      },
      upsertedPrimaryLinks: [],
      upsertedProjectionLinks: [],
      updatedPrimaryRows: [],
      updatedProjectionRows: [],
    };

    await processTaskUpsertJob(createSupabaseMock(state), {
      id: 1,
      user_id: "user-1",
      run_id: null,
      lane: "live",
      task_id: "task-1",
      google_event_id: null,
      list_id: "list-1",
      job_type: "task_upsert",
      source: "test",
      dedupe_key: "dedupe-3",
      priority: 5,
      payload: {},
      status: "pending",
      attempt_count: 0,
      max_attempts: 5,
      run_after: "2026-04-15T04:00:00.000Z",
      last_error: null,
      locked_at: null,
      created_at: "2026-04-15T04:00:00.000Z",
      updated_at: "2026-04-15T04:00:00.000Z",
    });

    expect(googleApiMocks.deleteGoogleEvent).toHaveBeenCalledTimes(4);
    expect(state.upsertedPrimaryLinks.at(-1)).toMatchObject({ is_deleted: true });
    expect(state.updatedProjectionRows).toHaveLength(3);
  });

  it("deletes projected events from task-delete payload when link rows already cascaded", async () => {
    const { processTaskDeleteJob } = await import("./taskCalendarSyncService");
    const state: MockSupabaseState = {
      taskById: {},
      listSyncByListId: {},
      primaryLinkByTaskId: {},
      projectionLinksByTaskId: {},
      upsertedPrimaryLinks: [],
      upsertedProjectionLinks: [],
      updatedPrimaryRows: [],
      updatedProjectionRows: [],
    };

    await processTaskDeleteJob(createSupabaseMock(state), {
      id: 1,
      user_id: "user-1",
      run_id: null,
      lane: "live",
      task_id: "task-1",
      google_event_id: null,
      list_id: "list-1",
      job_type: "task_delete",
      source: "trigger_task_delete",
      dedupe_key: "dedupe-4",
      priority: 5,
      payload: {
        projection_events: [
          { calendar_id: "calendar-1", google_event_id: "evt-proj-1" },
          { calendar_id: "calendar-1", google_event_id: "evt-proj-2" },
        ],
      },
      status: "pending",
      attempt_count: 0,
      max_attempts: 5,
      run_after: "2026-04-15T04:00:00.000Z",
      last_error: null,
      locked_at: null,
      created_at: "2026-04-15T04:00:00.000Z",
      updated_at: "2026-04-15T04:00:00.000Z",
    });

    expect(googleApiMocks.deleteGoogleEvent).toHaveBeenCalledTimes(2);
    expect(googleApiMocks.deleteGoogleEvent.mock.calls.map((call) => call.slice(1, 3))).toEqual([
      ["calendar-1", "evt-proj-1"],
      ["calendar-1", "evt-proj-2"],
    ]);
    expect(state.updatedProjectionRows).toHaveLength(0);
  });
});
