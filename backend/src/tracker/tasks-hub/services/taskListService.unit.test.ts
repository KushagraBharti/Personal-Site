import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TrackerTaskRow } from "../../../types/googleCalendar";
import {
  TrackerTaskListRow,
  TrackerTaskSortPreferenceRow,
} from "./taskHubTypes";

vi.mock("../../calendar/services/taskCalendarSyncService", () => ({
  processTaskDeleteJob: vi.fn(),
}));

interface MockSupabaseState {
  tasks: TrackerTaskRow[];
  lists?: TrackerTaskListRow[];
  sortPreferences?: TrackerTaskSortPreferenceRow[];
  insertedTasks: TrackerTaskRow[];
  insertedLists?: TrackerTaskListRow[];
  updatedTasks: Array<{ taskId: string; payload: Record<string, unknown> }>;
  updatedLists?: Array<{ listId: string; payload: Record<string, unknown> }>;
}

const buildTask = (overrides?: Partial<TrackerTaskRow>): TrackerTaskRow => ({
  id: "task-1",
  user_id: "user-1",
  list_id: "list-1",
  parent_task_id: null,
  title: "Daily task",
  details: "Details",
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

const buildList = (overrides?: Partial<TrackerTaskListRow>): TrackerTaskListRow => ({
  id: "list-1",
  user_id: "user-1",
  name: "General",
  color_hex: "#00FFFF",
  sort_order: 1,
  archived: false,
  created_at: "2026-04-13T00:00:00.000Z",
  updated_at: "2026-04-13T00:00:00.000Z",
  ...overrides,
});

class MockQueryBuilder {
  private filters: Record<string, unknown> = {};
  private neqFilters: Record<string, unknown> = {};
  private notNullColumns = new Set<string>();
  private operation: "delete" | "insert" | "select" | "update" | null = null;
  private payload: any = null;
  private resultMode: "many" | "maybeSingle" | "single" = "many";
  private orderColumn: string | null = null;
  private orderAscending = true;
  private limitCount: number | null = null;

  constructor(
    private readonly table: string,
    private readonly state: MockSupabaseState
  ) {}

  select() {
    if (!this.operation) this.operation = "select";
    return this;
  }

  insert(payload: any) {
    this.operation = "insert";
    this.payload = payload;
    return this;
  }

  update(payload: any) {
    this.operation = "update";
    this.payload = payload;
    return this;
  }

  delete() {
    this.operation = "delete";
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters[column] = value;
    return this;
  }

  neq(column: string, value: unknown) {
    this.neqFilters[column] = value;
    return this;
  }

  is(column: string, value: unknown) {
    this.filters[column] = value;
    return this;
  }

  not(column: string, operator: string, value: unknown) {
    if (operator === "is" && value === null) {
      this.notNullColumns.add(column);
    }
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderColumn = column;
    this.orderAscending = options?.ascending ?? true;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  maybeSingle() {
    this.resultMode = "maybeSingle";
    return this.execute();
  }

  single() {
    this.resultMode = "single";
    return this.execute();
  }

  then(resolve: (value: any) => any, reject?: (reason: any) => any) {
    return this.execute().then(resolve, reject);
  }

  upsert(payload: any) {
    this.operation = "insert";
    this.payload = payload;
    return this;
  }

  private rowsForTable(): Array<Record<string, unknown>> {
    if (this.table === "tracker_tasks") return this.state.tasks as unknown as Array<Record<string, unknown>>;
    if (this.table === "tracker_task_lists") return (this.state.lists ?? []) as unknown as Array<Record<string, unknown>>;
    if (this.table === "tracker_task_sort_preferences") {
      return (this.state.sortPreferences ?? []) as unknown as Array<Record<string, unknown>>;
    }
    return [];
  }

  private setRowsForTable(rows: Array<Record<string, unknown>>) {
    if (this.table === "tracker_tasks") {
      this.state.tasks = rows as unknown as TrackerTaskRow[];
    } else if (this.table === "tracker_task_lists") {
      this.state.lists = rows as unknown as TrackerTaskListRow[];
    } else if (this.table === "tracker_task_sort_preferences") {
      this.state.sortPreferences = rows as unknown as TrackerTaskSortPreferenceRow[];
    }
  }

  private matchesFilters(row: Record<string, unknown>) {
    const matchesEq = Object.entries(this.filters).every(
      ([column, value]) => row[column] === value
    );
    const matchesNeq = Object.entries(this.neqFilters).every(
      ([column, value]) => row[column] !== value
    );
    const matchesNotNull = Array.from(this.notNullColumns).every(
      (column) => row[column] !== null
    );
    return matchesEq && matchesNeq && matchesNotNull;
  }

  private selectRows() {
    let rows = this.rowsForTable().filter((row) => this.matchesFilters(row));
    if (this.orderColumn) {
      const column = this.orderColumn;
      rows = [...rows].sort((left, right) => {
        const leftValue = Number(left[column] ?? 0);
        const rightValue = Number(right[column] ?? 0);
        return this.orderAscending ? leftValue - rightValue : rightValue - leftValue;
      });
    }
    if (typeof this.limitCount === "number") rows = rows.slice(0, this.limitCount);
    return rows;
  }

  private execute() {
    if (this.operation === "insert") {
      const now = new Date().toISOString();
      const rows = this.rowsForTable();
      const prefix =
        this.table === "tracker_task_lists"
          ? "list"
          : this.table === "tracker_task_sort_preferences"
            ? "pref"
            : "task";
      const row = {
        id: `${prefix}-${rows.length + 1}`,
        created_at: now,
        updated_at: now,
        ...this.payload,
      } as Record<string, unknown>;
      rows.push(row);
      this.setRowsForTable(rows);
      if (this.table === "tracker_tasks") {
        this.state.insertedTasks.push(row as unknown as TrackerTaskRow);
      } else if (this.table === "tracker_task_lists") {
        this.state.insertedLists?.push(row as unknown as TrackerTaskListRow);
      }
      return Promise.resolve({ data: row, error: null });
    }

    if (this.operation === "update") {
      const row = this.rowsForTable().find((item) => this.matchesFilters(item));
      if (!row) return Promise.resolve({ data: null, error: { message: "Row not found" } });
      Object.assign(row, this.payload, { updated_at: new Date().toISOString() });
      if (this.table === "tracker_tasks") {
        this.state.updatedTasks.push({ taskId: String(row.id), payload: this.payload });
      } else if (this.table === "tracker_task_lists") {
        this.state.updatedLists?.push({ listId: String(row.id), payload: this.payload });
      }
      return Promise.resolve({ data: row, error: null });
    }

    if (this.operation === "delete") {
      const keptRows = this.rowsForTable().filter((row) => !this.matchesFilters(row));
      this.setRowsForTable(keptRows);
      return Promise.resolve({ data: null, error: null });
    }

    const rows = this.selectRows();
    if (this.resultMode === "single") {
      return Promise.resolve({
        data: rows[0] ?? null,
        error: rows[0] ? null : { message: "No rows" },
      });
    }
    if (this.resultMode === "maybeSingle") {
      return Promise.resolve({ data: rows[0] ?? null, error: null });
    }
    return Promise.resolve({ data: rows, error: null });
  }
}

const createSupabaseMock = (state: MockSupabaseState) =>
  ({
    from: (table: string) => new MockQueryBuilder(table, state),
  }) as any;

describe("taskListService", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-15T04:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("bootstraps a default list and normalizes stored task timezones", async () => {
    const { getTrackerBootstrapForUser } = await import("./taskListService");
    const state: MockSupabaseState = {
      tasks: [
        buildTask({
          id: "task-1",
          due_at: "2026-04-15T14:00:00.000Z",
          due_timezone: null,
        }),
        buildTask({
          id: "task-2",
          due_at: "2026-04-16T00:00:00.777Z",
          due_timezone: "America/Chicago",
          sort_order: 2,
        }),
      ],
      lists: [],
      sortPreferences: [],
      insertedTasks: [],
      insertedLists: [],
      updatedTasks: [],
      updatedLists: [],
    };

    const result = await getTrackerBootstrapForUser(createSupabaseMock(state), "user-1", {
      browserTimeZone: "America/New_York",
    });

    expect(result.lists).toHaveLength(1);
    expect(result.lists[0]).toMatchObject({
      user_id: "user-1",
      name: "General",
      sort_order: 1,
      archived: false,
    });
    expect(state.insertedLists).toHaveLength(1);
    expect(result.tasks.find((task) => task.id === "task-1")?.due_timezone).toBe("America/New_York");
    expect(result.tasks.find((task) => task.id === "task-2")?.due_timezone).toBeNull();
  });

  it("creates tasks with backend-owned sibling sort order and timezone normalization", async () => {
    const { createTaskForUser } = await import("./taskListService");
    const state: MockSupabaseState = {
      tasks: [
        buildTask({ id: "task-1", recurrence_type: "none", sort_order: 2 }),
      ],
      lists: [buildList()],
      insertedTasks: [],
      insertedLists: [],
      updatedTasks: [],
      updatedLists: [],
    };

    const result = await createTaskForUser(createSupabaseMock(state), "user-1", {
      list_id: "list-1",
      parent_task_id: null,
      title: "  New task  ",
      details: "  Details  ",
      due_at: "2026-04-16T14:00:00.000Z",
      due_timezone: null,
      recurrence_type: "none",
      recurrence_interval: null,
      recurrence_unit: null,
      recurrence_ends_at: null,
      browser_timezone: "America/Los_Angeles",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected successful result");
    expect(result.task).toMatchObject({
      user_id: "user-1",
      list_id: "list-1",
      title: "New task",
      details: "Details",
      due_timezone: "America/Los_Angeles",
      sort_order: 3,
      is_completed: false,
      completed_at: null,
    });
    expect(state.insertedTasks).toHaveLength(1);
  });

  it("rejects recurring task creation without a due date", async () => {
    const { createTaskForUser } = await import("./taskListService");
    const state: MockSupabaseState = {
      tasks: [],
      lists: [buildList()],
      insertedTasks: [],
      insertedLists: [],
      updatedTasks: [],
      updatedLists: [],
    };

    const result = await createTaskForUser(createSupabaseMock(state), "user-1", {
      list_id: "list-1",
      parent_task_id: null,
      title: "Recurring",
      due_at: null,
      recurrence_type: "daily",
      browser_timezone: "America/Chicago",
    });

    expect(result).toEqual({
      ok: false,
      code: 400,
      error: "Recurring tasks require a due date.",
    });
    expect(state.insertedTasks).toHaveLength(0);
  });

  it("guards against deleting the user's last active list", async () => {
    const { deleteTaskListForUser } = await import("./taskListService");
    const state: MockSupabaseState = {
      tasks: [],
      lists: [buildList()],
      insertedTasks: [],
      insertedLists: [],
      updatedTasks: [],
      updatedLists: [],
    };

    const result = await deleteTaskListForUser(createSupabaseMock(state), "user-1", "list-1");

    expect(result).toEqual({
      ok: false,
      code: 400,
      error: "Create another list before deleting your last remaining list.",
    });
    expect(state.lists).toHaveLength(1);
  });

  it("creates the next recurring task when completing an open recurring task", async () => {
    const { setTaskCompletionForUser } = await import("./taskListService");
    const state: MockSupabaseState = {
      tasks: [
        buildTask(),
        buildTask({
          id: "task-2",
          recurrence_type: "none",
          sort_order: 4,
        }),
      ],
      insertedTasks: [],
      updatedTasks: [],
    };

    const result = await setTaskCompletionForUser(
      createSupabaseMock(state),
      "user-1",
      "task-1",
      true
    );

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected successful result");
    expect(result.task).toMatchObject({
      id: "task-1",
      is_completed: true,
      completed_at: "2026-04-15T04:00:00.000Z",
    });
    expect(result.createdNextTask).toMatchObject({
      list_id: "list-1",
      parent_task_id: null,
      title: "Daily task",
      due_at: "2026-04-15T03:00:00.000Z",
      due_timezone: "America/Chicago",
      is_completed: false,
      completed_at: null,
      recurrence_type: "daily",
      sort_order: 5,
    });
    expect(state.insertedTasks).toHaveLength(1);
  });

  it("does not create another task when completing a task that is already complete", async () => {
    const { setTaskCompletionForUser } = await import("./taskListService");
    const state: MockSupabaseState = {
      tasks: [
        buildTask({
          is_completed: true,
          completed_at: "2026-04-14T04:00:00.000Z",
        }),
      ],
      insertedTasks: [],
      updatedTasks: [],
    };

    const result = await setTaskCompletionForUser(
      createSupabaseMock(state),
      "user-1",
      "task-1",
      true
    );

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected successful result");
    expect(result.createdNextTask).toBeNull();
    expect(state.insertedTasks).toHaveLength(0);
  });

  it("clears completion without creating a recurring task", async () => {
    const { setTaskCompletionForUser } = await import("./taskListService");
    const state: MockSupabaseState = {
      tasks: [
        buildTask({
          is_completed: true,
          completed_at: "2026-04-14T04:00:00.000Z",
        }),
      ],
      insertedTasks: [],
      updatedTasks: [],
    };

    const result = await setTaskCompletionForUser(
      createSupabaseMock(state),
      "user-1",
      "task-1",
      false
    );

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected successful result");
    expect(result.task).toMatchObject({
      id: "task-1",
      is_completed: false,
      completed_at: null,
    });
    expect(result.createdNextTask).toBeNull();
    expect(state.insertedTasks).toHaveLength(0);
  });

  it("reconciles completed recurring tasks without duplicating existing next tasks", async () => {
    const { reconcileCompletedRecurringTasks } = await import("./taskListService");
    const state: MockSupabaseState = {
      tasks: [
        buildTask({
          is_completed: true,
          completed_at: "2026-04-15T04:00:00.000Z",
        }),
        buildTask({
          id: "task-2",
          title: "Already repaired",
          due_at: "2026-04-16T03:00:00.000Z",
          is_completed: true,
          completed_at: "2026-04-16T04:00:00.000Z",
          sort_order: 5,
        }),
        buildTask({
          id: "task-3",
          title: "Already repaired",
          due_at: "2026-04-17T03:00:00.000Z",
          is_completed: false,
          completed_at: null,
          sort_order: 6,
        }),
      ],
      insertedTasks: [],
      updatedTasks: [],
    };

    const result = await reconcileCompletedRecurringTasks(createSupabaseMock(state));

    expect(result).toMatchObject({
      ok: true,
      checked: 2,
      created: 1,
      failed: 0,
    });
    expect(state.insertedTasks).toHaveLength(1);
    expect(state.insertedTasks[0]).toMatchObject({
      title: "Daily task",
      due_at: "2026-04-15T03:00:00.000Z",
      is_completed: false,
    });
  });
});
