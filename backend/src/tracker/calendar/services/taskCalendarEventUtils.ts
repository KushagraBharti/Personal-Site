import { DateTime } from "luxon";
import { TrackerTaskRow } from "../../../types/googleCalendar";

export const DATE_ONLY_MARKER_MS = 777;
export const DONE_EVENT_PREFIX = "[Done] ";
export const UPCOMING_EVENT_PREFIX = "[Upcoming] ";
export const RECURRING_PROJECTION_COUNT = 3;

export type TrackerGoogleEventKind = "primary" | "projection";
export type TrackerGoogleTitleMode = "default" | "done" | "upcoming";

export interface ProjectedTaskOccurrence {
  projectionIndex: number;
  dueAt: string;
}

const isValidIanaTimeZone = (timeZone: string | null | undefined) => {
  if (!timeZone) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
};

export const resolveTaskTimeZone = (taskTimeZone: string | null | undefined): string =>
  isValidIanaTimeZone(taskTimeZone) ? (taskTimeZone as string) : "UTC";

export const isDateOnlyIso = (isoString: string | null | undefined) => {
  if (!isoString) return false;
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.getMilliseconds() === DATE_ONLY_MARKER_MS;
};

export const isRecurringTask = (
  taskOrRecurrence:
    | TrackerTaskRow
    | TrackerTaskRow["recurrence_type"]
    | null
    | undefined
) => {
  const recurrenceType =
    typeof taskOrRecurrence === "string"
      ? taskOrRecurrence
      : taskOrRecurrence?.recurrence_type;
  return !!recurrenceType && recurrenceType !== "none";
};

export const stripTaskEventPrefixes = (title: string) => {
  let normalized = title.trim();
  for (const prefix of [DONE_EVENT_PREFIX, UPCOMING_EVENT_PREFIX]) {
    if (normalized.startsWith(prefix)) {
      normalized = normalized.slice(prefix.length).trimStart();
    }
  }
  return normalized || title.trim();
};

export const formatTaskEventTitle = (title: string, mode: TrackerGoogleTitleMode) => {
  const baseTitle = stripTaskEventPrefixes(title);
  if (mode === "done") return `${DONE_EVENT_PREFIX}${baseTitle}`;
  if (mode === "upcoming") return `${UPCOMING_EVENT_PREFIX}${baseTitle}`;
  return baseTitle;
};

export const computeNextRecurringDueAt = (
  task: Pick<
    TrackerTaskRow,
    | "due_at"
    | "due_timezone"
    | "recurrence_type"
    | "recurrence_interval"
    | "recurrence_unit"
    | "recurrence_ends_at"
  >,
  dueAtIso: string | null | undefined = task.due_at
) => {
  if (!dueAtIso) return null;

  const baseUtc = DateTime.fromISO(dueAtIso, { zone: "utc" });
  if (!baseUtc.isValid) return null;

  if (!isRecurringTask(task.recurrence_type)) return null;

  const hasDateOnlyDueAt = isDateOnlyIso(dueAtIso);
  const zone = resolveTaskTimeZone(task.due_timezone);
  let next = hasDateOnlyDueAt ? baseUtc : baseUtc.setZone(zone);

  if (task.recurrence_type === "daily") {
    next = next.plus({ days: 1 });
  } else if (task.recurrence_type === "weekly") {
    next = next.plus({ weeks: 1 });
  } else if (task.recurrence_type === "biweekly") {
    next = next.plus({ weeks: 2 });
  } else {
    const interval = Math.max(task.recurrence_interval ?? 1, 1);
    const unit = task.recurrence_unit ?? "day";
    if (unit === "month") {
      next = next.plus({ months: interval });
    } else if (unit === "week") {
      next = next.plus({ weeks: interval });
    } else {
      next = next.plus({ days: interval });
    }
  }

  const nextUtc = hasDateOnlyDueAt ? next : next.toUTC();
  if (task.recurrence_ends_at) {
    const endUtc = DateTime.fromISO(task.recurrence_ends_at, { zone: "utc" });
    if (endUtc.isValid && nextUtc.toMillis() > endUtc.toMillis()) {
      return null;
    }
  }

  return nextUtc.toISO() ?? null;
};

export const isTaskOverdue = (
  task: Pick<TrackerTaskRow, "due_at" | "due_timezone">,
  now = DateTime.utc()
) => {
  if (!task.due_at) return false;

  if (isDateOnlyIso(task.due_at)) {
    const zone = resolveTaskTimeZone(task.due_timezone);
    const dueDate = DateTime.fromISO(task.due_at, { zone: "utc" }).setZone(zone);
    if (!dueDate.isValid) return false;
    const dueDay = dueDate.toISODate();
    const nowDay = now.setZone(zone).toISODate();
    return !!dueDay && !!nowDay && nowDay > dueDay;
  }

  const dueUtc = DateTime.fromISO(task.due_at, { zone: "utc" });
  if (!dueUtc.isValid) return false;
  return now.toUTC().toMillis() > dueUtc.toMillis();
};

export const buildRecurringProjectionDueAts = (
  task: Pick<
    TrackerTaskRow,
    | "due_at"
    | "due_timezone"
    | "recurrence_type"
    | "recurrence_interval"
    | "recurrence_unit"
    | "recurrence_ends_at"
  >,
  count = RECURRING_PROJECTION_COUNT,
  now = DateTime.utc()
): ProjectedTaskOccurrence[] => {
  if (!task.due_at) return [];
  if (!isRecurringTask(task.recurrence_type)) return [];
  if (!isTaskOverdue(task, now)) return [];

  const occurrences: ProjectedTaskOccurrence[] = [];
  let cursor = task.due_at;

  for (let index = 1; index <= Math.max(count, 0); index += 1) {
    const nextDueAt = computeNextRecurringDueAt(task, cursor);
    if (!nextDueAt) break;
    occurrences.push({
      projectionIndex: index,
      dueAt: nextDueAt,
    });
    cursor = nextDueAt;
  }

  return occurrences;
};
