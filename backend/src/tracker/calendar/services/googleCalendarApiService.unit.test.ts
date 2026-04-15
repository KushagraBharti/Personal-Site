import { describe, expect, it, vi } from "vitest";

vi.mock("axios", () => ({
  default: {
    request: vi.fn(),
    post: vi.fn(),
  },
}));
import {
  googleEventToTrackerEventKind,
  googleEventToTrackerProjectionIndex,
  taskProjectionToDeterministicGoogleEventId,
  taskToGoogleEventPayload,
} from "./googleCalendarApiService";
import { TrackerTaskRow } from "../../../types/googleCalendar";

const buildTask = (overrides?: Partial<TrackerTaskRow>): TrackerTaskRow => ({
  id: "task-1",
  user_id: "user-1",
  list_id: "list-1",
  parent_task_id: null,
  title: "Task A",
  details: "details",
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

describe("googleCalendarApiService", () => {
  it("builds single-instance event payloads for recurring tasks without RRULE", () => {
    const payload = taskToGoogleEventPayload(buildTask(), {
      eventKind: "projection",
      projectionIndex: 2,
      titleMode: "upcoming",
      dueAt: "2026-04-16T03:00:00.000Z",
    });

    expect(payload.summary).toBe("[Upcoming] Task A");
    expect(payload).not.toHaveProperty("recurrence");
    expect(payload.extendedProperties).toEqual({
      private: expect.objectContaining({
        tracker_task_id: "task-1",
        tracker_event_kind: "projection",
        tracker_projection_index: "2",
      }),
    });
  });

  it("parses tracker event metadata back out of Google events", () => {
    const event = {
      extendedProperties: {
        private: {
          tracker_event_kind: "projection",
          tracker_projection_index: "3",
        },
      },
    };

    expect(googleEventToTrackerEventKind(event)).toBe("projection");
    expect(googleEventToTrackerProjectionIndex(event)).toBe(3);
  });

  it("creates deterministic ids for projected recurring placeholders", () => {
    expect(taskProjectionToDeterministicGoogleEventId("task-1", 1)).toMatch(/^trkp[a-f0-9]{40}$/);
    expect(taskProjectionToDeterministicGoogleEventId("task-1", 1)).not.toBe(
      taskProjectionToDeterministicGoogleEventId("task-1", 2)
    );
  });
});
