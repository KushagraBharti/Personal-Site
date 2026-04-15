import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";
import {
  buildRecurringProjectionDueAts,
  computeNextRecurringDueAt,
  formatTaskEventTitle,
  isTaskOverdue,
} from "./taskCalendarEventUtils";
import { TrackerTaskRow } from "../../../types/googleCalendar";

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

describe("taskCalendarEventUtils", () => {
  it("computes the next recurring due-at using the tracker recurrence rules", () => {
    const nextDueAt = computeNextRecurringDueAt(buildTask());
    expect(nextDueAt).toBe("2026-04-15T03:00:00.000Z");
  });

  it("projects the next 3 recurring occurrences only after the task is overdue", () => {
    const task = buildTask();
    const beforeDue = DateTime.fromISO("2026-04-14T02:30:00.000Z", { zone: "utc" });
    const afterDue = DateTime.fromISO("2026-04-14T04:00:00.000Z", { zone: "utc" });

    expect(buildRecurringProjectionDueAts(task, 3, beforeDue)).toEqual([]);
    expect(buildRecurringProjectionDueAts(task, 3, afterDue)).toEqual([
      { projectionIndex: 1, dueAt: "2026-04-15T03:00:00.000Z" },
      { projectionIndex: 2, dueAt: "2026-04-16T03:00:00.000Z" },
      { projectionIndex: 3, dueAt: "2026-04-17T03:00:00.000Z" },
    ]);
  });

  it("treats date-only tasks as overdue only after the due day ends", () => {
    const task = buildTask({
      due_at: "2026-04-14T12:00:00.777Z",
      due_timezone: null,
      recurrence_type: "daily",
    });

    expect(
      isTaskOverdue(task, DateTime.fromISO("2026-04-14T23:59:00.000Z", { zone: "utc" }))
    ).toBe(false);
    expect(
      isTaskOverdue(task, DateTime.fromISO("2026-04-15T00:01:00.000Z", { zone: "utc" }))
    ).toBe(true);
  });

  it("formats calendar titles with explicit done and upcoming markers", () => {
    expect(formatTaskEventTitle("Task A", "default")).toBe("Task A");
    expect(formatTaskEventTitle("Task A", "done")).toBe("[Done] Task A");
    expect(formatTaskEventTitle("Task A", "upcoming")).toBe("[Upcoming] Task A");
  });
});
