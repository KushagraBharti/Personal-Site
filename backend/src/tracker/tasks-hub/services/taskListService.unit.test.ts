import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TrackerTaskRow } from "../../../types/googleCalendar";

vi.mock("../../calendar/services/taskCalendarSyncService", () => ({
  processTaskDeleteJob: vi.fn(),
}));

interface MockSupabaseState {
  tasks: TrackerTaskRow[];
  insertedTasks: TrackerTaskRow[];
  updatedTasks: Array<{ taskId: string; payload: Record<string, unknown> }>;
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

class MockQueryBuilder {
  private filters: Record<string, unknown> = {};
  private neqFilters: Record<string, unknown> = {};
  private notNullColumns = new Set<string>();
  private operation: "insert" | "select" | "update" | null = null;
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

  private matchesFilters(task: TrackerTaskRow) {
    const matchesEq = Object.entries(this.filters).every(
      ([column, value]) => task[column as keyof TrackerTaskRow] === value
    );
    const matchesNeq = Object.entries(this.neqFilters).every(
      ([column, value]) => task[column as keyof TrackerTaskRow] !== value
    );
    const matchesNotNull = Array.from(this.notNullColumns).every(
      (column) => task[column as keyof TrackerTaskRow] !== null
    );
    return matchesEq && matchesNeq && matchesNotNull;
  }

  private selectRows() {
    let rows = this.state.tasks.filter((task) => this.matchesFilters(task));
    if (this.orderColumn) {
      const column = this.orderColumn as keyof TrackerTaskRow;
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
    if (this.table !== "tracker_tasks") {
      return Promise.resolve({ data: null, error: null });
    }

    if (this.operation === "insert") {
      const now = new Date().toISOString();
      const task = {
        id: `task-${this.state.tasks.length + 1}`,
        created_at: now,
        updated_at: now,
        ...this.payload,
      } as TrackerTaskRow;
      this.state.tasks.push(task);
      this.state.insertedTasks.push(task);
      return Promise.resolve({ data: task, error: null });
    }

    if (this.operation === "update") {
      const task = this.state.tasks.find((row) => this.matchesFilters(row));
      if (!task) return Promise.resolve({ data: null, error: { message: "Task not found" } });
      Object.assign(task, this.payload, { updated_at: new Date().toISOString() });
      this.state.updatedTasks.push({ taskId: task.id, payload: this.payload });
      return Promise.resolve({ data: task, error: null });
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
