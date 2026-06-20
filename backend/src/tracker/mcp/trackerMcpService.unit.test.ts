import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TrackerTaskRow } from "../../types/googleCalendar";
import { TrackerTaskListRow } from "../tasks-hub/services/taskHubTypes";

const listUserSyncEnabledListsMock = vi.hoisted(() => vi.fn());
const queueTaskUpsertForUserMock = vi.hoisted(() => vi.fn());
const queueManualSyncForUserMock = vi.hoisted(() => vi.fn());
const processCalendarSyncJobsMock = vi.hoisted(() => vi.fn());
const runLegacyManualSyncForUserMock = vi.hoisted(() => vi.fn());

vi.mock("../calendar/services/taskCalendarSyncService", () => ({
  listUserSyncEnabledLists: listUserSyncEnabledListsMock,
  processCalendarSyncJobs: processCalendarSyncJobsMock,
  queueManualSyncForUser: queueManualSyncForUserMock,
  queueTaskUpsertForUser: queueTaskUpsertForUserMock,
  runLegacyManualSyncForUser: runLegacyManualSyncForUserMock,
}));

interface MockSupabaseState {
  lists: TrackerTaskListRow[];
  tasks: TrackerTaskRow[];
  calendarConnection?: Record<string, unknown> | null;
}

const buildList = (
  overrides?: Partial<TrackerTaskListRow>,
): TrackerTaskListRow => ({
  id: "list-visible",
  user_id: "user-1",
  name: "School",
  color_hex: "#00FFFF",
  sort_order: 1,
  archived: false,
  created_at: "2026-06-01T00:00:00.000Z",
  updated_at: "2026-06-01T00:00:00.000Z",
  ...overrides,
});

const buildTask = (overrides?: Partial<TrackerTaskRow>): TrackerTaskRow => ({
  id: "task-1",
  user_id: "user-1",
  list_id: "list-visible",
  parent_task_id: null,
  title: "Task",
  details: "Details",
  due_at: null,
  due_timezone: null,
  is_completed: false,
  completed_at: null,
  recurrence_type: "none",
  recurrence_interval: null,
  recurrence_unit: null,
  recurrence_ends_at: null,
  sort_order: 1,
  created_at: "2026-06-01T00:00:00.000Z",
  updated_at: "2026-06-01T00:00:00.000Z",
  ...overrides,
});

class MockQueryBuilder {
  private filters: Record<string, unknown> = {};
  private operation: "select" | null = null;
  private orderColumns: Array<{ column: string; ascending: boolean }> = [];

  constructor(
    private readonly table: string,
    private readonly state: MockSupabaseState,
  ) {}

  select() {
    this.operation = "select";
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters[column] = value;
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderColumns.push({
      column,
      ascending: options?.ascending ?? true,
    });
    return this;
  }

  maybeSingle() {
    return this.execute().then((result) => ({
      ...result,
      data: Array.isArray(result.data) ? (result.data[0] ?? null) : result.data,
    }));
  }

  then(resolve: (value: any) => any, reject?: (reason: any) => any) {
    return this.execute().then(resolve, reject);
  }

  private rowsForTable(): Array<Record<string, unknown>> {
    if (this.table === "tracker_task_lists") {
      return this.state.lists as unknown as Array<Record<string, unknown>>;
    }
    if (this.table === "tracker_tasks") {
      return this.state.tasks as unknown as Array<Record<string, unknown>>;
    }
    if (this.table === "tracker_google_calendar_connections_public") {
      return this.state.calendarConnection
        ? [this.state.calendarConnection]
        : [];
    }
    return [];
  }

  private matchesFilters(row: Record<string, unknown>) {
    return Object.entries(this.filters).every(
      ([column, value]) => row[column] === value,
    );
  }

  private execute() {
    if (this.operation !== "select") {
      return Promise.resolve({ data: null, error: null });
    }

    let rows = this.rowsForTable().filter((row) => this.matchesFilters(row));
    for (const { column, ascending } of [...this.orderColumns].reverse()) {
      rows = [...rows].sort((left, right) => {
        const leftValue = left[column];
        const rightValue = right[column];
        if (typeof leftValue === "number" && typeof rightValue === "number") {
          return ascending ? leftValue - rightValue : rightValue - leftValue;
        }
        return ascending
          ? String(leftValue ?? "").localeCompare(String(rightValue ?? ""))
          : String(rightValue ?? "").localeCompare(String(leftValue ?? ""));
      });
    }
    return Promise.resolve({ data: rows, error: null });
  }
}

const createSupabaseMock = (state: MockSupabaseState) =>
  ({
    from: (table: string) => new MockQueryBuilder(table, state),
  }) as any;

describe("tracker MCP service", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-20T15:00:00.000Z"));
    listUserSyncEnabledListsMock.mockReset();
    queueTaskUpsertForUserMock.mockReset();
    queueManualSyncForUserMock.mockReset();
    processCalendarSyncJobsMock.mockReset();
    runLegacyManualSyncForUserMock.mockReset();
    process.env.TRACKER_MCP_DEFAULT_TIMEZONE = "America/Chicago";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const baseState = (): MockSupabaseState => ({
    lists: [
      buildList({ id: "list-visible", name: "School", sort_order: 1 }),
      buildList({ id: "list-hidden", name: "Misc.", sort_order: 2 }),
      buildList({
        id: "list-other-user",
        user_id: "user-2",
        name: "Brother",
        sort_order: 1,
      }),
    ],
    tasks: [
      buildTask({
        id: "task-today",
        title: "Visible today",
        due_at: "2026-06-20T12:00:00.777Z",
        due_timezone: "America/Chicago",
      }),
      buildTask({
        id: "task-overdue",
        title: "Visible overdue",
        due_at: "2026-06-19T12:00:00.777Z",
        due_timezone: "America/Chicago",
        sort_order: 2,
      }),
      buildTask({
        id: "task-hidden",
        list_id: "list-hidden",
        title: "Hidden task",
      }),
      buildTask({
        id: "task-complete",
        title: "Completed task",
        is_completed: true,
        completed_at: "2026-06-19T22:00:00.000Z",
        sort_order: 3,
      }),
      buildTask({
        id: "task-other-user",
        user_id: "user-2",
        list_id: "list-other-user",
        title: "Other user task",
      }),
    ],
    calendarConnection: {
      user_id: "user-1",
      status: "connected",
      selected_calendar_summary: "Tracker Tasks",
      last_full_sync_at: null,
      last_incremental_sync_at: "2026-06-20T14:00:00.000Z",
      last_error: null,
    },
  });

  const visibleSettings = () => {
    listUserSyncEnabledListsMock.mockResolvedValue([
      { list_id: "list-visible", sync_enabled: true },
      { list_id: "list-hidden", sync_enabled: false },
      { list_id: "list-other-user", sync_enabled: true },
    ]);
  };

  it("summarizes only the configured owner's synced lists", async () => {
    visibleSettings();
    const { getTrackerSnapshot } = await import("./trackerMcpService");

    const snapshot = await getTrackerSnapshot({
      supabaseAdmin: createSupabaseMock(baseState()),
      userId: "user-1",
    });

    expect(snapshot.totals).toMatchObject({
      active: 2,
      completed: 1,
      total: 3,
      overdue: 1,
      today: 1,
    });
    expect(snapshot.lists).toHaveLength(1);
    expect(snapshot.lists[0].list).toMatchObject({
      id: "list-visible",
      name: "School",
    });
    expect(snapshot.calendar).toMatchObject({
      connected: true,
      selected_calendar_summary: "Tracker Tasks",
    });
  });

  it("lists active tasks only from synced lists", async () => {
    visibleSettings();
    const { listTasks } = await import("./trackerMcpService");

    const result = await listTasks(
      {
        supabaseAdmin: createSupabaseMock(baseState()),
        userId: "user-1",
      },
      {},
    );

    expect(result.lists).toHaveLength(1);
    expect(result.lists[0].tasks.map((task) => task.id)).toEqual([
      "task-today",
      "task-overdue",
    ]);
  });

  it("returns the latest 10 completed tasks per synced list by default", async () => {
    visibleSettings();
    const state = baseState();
    state.tasks = [
      ...state.tasks.filter((task) => !task.is_completed),
      ...Array.from({ length: 12 }, (_, index) =>
        buildTask({
          id: `done-${index + 1}`,
          title: `Done ${index + 1}`,
          is_completed: true,
          completed_at: `2026-06-${String(index + 1).padStart(2, "0")}T10:00:00.000Z`,
          sort_order: index + 10,
        }),
      ),
      buildTask({
        id: "hidden-done",
        list_id: "list-hidden",
        title: "Hidden done",
        is_completed: true,
        completed_at: "2026-06-30T10:00:00.000Z",
      }),
    ];
    const { listCompletedTasks } = await import("./trackerMcpService");

    const result = await listCompletedTasks(
      {
        supabaseAdmin: createSupabaseMock(state),
        userId: "user-1",
      },
      {},
    );

    expect(result.limit_per_list).toBe(10);
    expect(result.lists[0].returned_task_count).toBe(10);
    expect(result.lists[0].tasks[0]).toMatchObject({
      id: "done-12",
      title: "Done 12",
    });
    expect(result.lists[0].tasks.map((task) => task.id)).not.toContain(
      "hidden-done",
    );
  });

  it("rejects creating a task in an unsynced list", async () => {
    visibleSettings();
    const { createMcpTask } = await import("./trackerMcpService");

    await expect(
      createMcpTask(
        {
          supabaseAdmin: createSupabaseMock(baseState()),
          userId: "user-1",
        },
        {
          list_name: "Misc.",
          title: "Should not be visible",
        },
      ),
    ).rejects.toMatchObject({
      code: 404,
      message: "List not found in MCP-visible calendar-synced lists.",
    });
  });

  it("requires explicit child confirmation before deleting a task subtree", async () => {
    visibleSettings();
    const state = baseState();
    state.tasks.push(
      buildTask({
        id: "task-child",
        parent_task_id: "task-today",
        title: "Child task",
        sort_order: 4,
      }),
    );
    const { deleteMcpTask } = await import("./trackerMcpService");

    await expect(
      deleteMcpTask(
        {
          supabaseAdmin: createSupabaseMock(state),
          userId: "user-1",
        },
        {
          task_id: "task-today",
          confirm_delete: true,
        },
      ),
    ).rejects.toMatchObject({
      code: 400,
      message:
        "Task has subtasks. Set confirm_delete_children to true to delete the whole subtree.",
    });
  });
});
