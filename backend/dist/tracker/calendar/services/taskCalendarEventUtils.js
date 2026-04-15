"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildRecurringProjectionDueAts = exports.isTaskOverdue = exports.computeNextRecurringDueAt = exports.formatTaskEventTitle = exports.stripTaskEventPrefixes = exports.isRecurringTask = exports.isDateOnlyIso = exports.resolveTaskTimeZone = exports.RECURRING_PROJECTION_COUNT = exports.UPCOMING_EVENT_PREFIX = exports.DONE_EVENT_PREFIX = exports.DATE_ONLY_MARKER_MS = void 0;
const luxon_1 = require("luxon");
exports.DATE_ONLY_MARKER_MS = 777;
exports.DONE_EVENT_PREFIX = "[Done] ";
exports.UPCOMING_EVENT_PREFIX = "[Upcoming] ";
exports.RECURRING_PROJECTION_COUNT = 3;
const isValidIanaTimeZone = (timeZone) => {
    if (!timeZone)
        return false;
    try {
        new Intl.DateTimeFormat("en-US", { timeZone });
        return true;
    }
    catch (_a) {
        return false;
    }
};
const resolveTaskTimeZone = (taskTimeZone) => isValidIanaTimeZone(taskTimeZone) ? taskTimeZone : "UTC";
exports.resolveTaskTimeZone = resolveTaskTimeZone;
const isDateOnlyIso = (isoString) => {
    if (!isoString)
        return false;
    const parsed = new Date(isoString);
    if (Number.isNaN(parsed.getTime()))
        return false;
    return parsed.getMilliseconds() === exports.DATE_ONLY_MARKER_MS;
};
exports.isDateOnlyIso = isDateOnlyIso;
const isRecurringTask = (taskOrRecurrence) => {
    const recurrenceType = typeof taskOrRecurrence === "string"
        ? taskOrRecurrence
        : taskOrRecurrence === null || taskOrRecurrence === void 0 ? void 0 : taskOrRecurrence.recurrence_type;
    return !!recurrenceType && recurrenceType !== "none";
};
exports.isRecurringTask = isRecurringTask;
const stripTaskEventPrefixes = (title) => {
    let normalized = title.trim();
    for (const prefix of [exports.DONE_EVENT_PREFIX, exports.UPCOMING_EVENT_PREFIX]) {
        if (normalized.startsWith(prefix)) {
            normalized = normalized.slice(prefix.length).trimStart();
        }
    }
    return normalized || title.trim();
};
exports.stripTaskEventPrefixes = stripTaskEventPrefixes;
const formatTaskEventTitle = (title, mode) => {
    const baseTitle = (0, exports.stripTaskEventPrefixes)(title);
    if (mode === "done")
        return `${exports.DONE_EVENT_PREFIX}${baseTitle}`;
    if (mode === "upcoming")
        return `${exports.UPCOMING_EVENT_PREFIX}${baseTitle}`;
    return baseTitle;
};
exports.formatTaskEventTitle = formatTaskEventTitle;
const computeNextRecurringDueAt = (task, dueAtIso = task.due_at) => {
    var _a, _b, _c;
    if (!dueAtIso)
        return null;
    const baseUtc = luxon_1.DateTime.fromISO(dueAtIso, { zone: "utc" });
    if (!baseUtc.isValid)
        return null;
    if (!(0, exports.isRecurringTask)(task.recurrence_type))
        return null;
    const hasDateOnlyDueAt = (0, exports.isDateOnlyIso)(dueAtIso);
    const zone = (0, exports.resolveTaskTimeZone)(task.due_timezone);
    let next = hasDateOnlyDueAt ? baseUtc : baseUtc.setZone(zone);
    if (task.recurrence_type === "daily") {
        next = next.plus({ days: 1 });
    }
    else if (task.recurrence_type === "weekly") {
        next = next.plus({ weeks: 1 });
    }
    else if (task.recurrence_type === "biweekly") {
        next = next.plus({ weeks: 2 });
    }
    else {
        const interval = Math.max((_a = task.recurrence_interval) !== null && _a !== void 0 ? _a : 1, 1);
        const unit = (_b = task.recurrence_unit) !== null && _b !== void 0 ? _b : "day";
        if (unit === "month") {
            next = next.plus({ months: interval });
        }
        else if (unit === "week") {
            next = next.plus({ weeks: interval });
        }
        else {
            next = next.plus({ days: interval });
        }
    }
    const nextUtc = hasDateOnlyDueAt ? next : next.toUTC();
    if (task.recurrence_ends_at) {
        const endUtc = luxon_1.DateTime.fromISO(task.recurrence_ends_at, { zone: "utc" });
        if (endUtc.isValid && nextUtc.toMillis() > endUtc.toMillis()) {
            return null;
        }
    }
    return (_c = nextUtc.toISO()) !== null && _c !== void 0 ? _c : null;
};
exports.computeNextRecurringDueAt = computeNextRecurringDueAt;
const isTaskOverdue = (task, now = luxon_1.DateTime.utc()) => {
    if (!task.due_at)
        return false;
    if ((0, exports.isDateOnlyIso)(task.due_at)) {
        const zone = (0, exports.resolveTaskTimeZone)(task.due_timezone);
        const dueDate = luxon_1.DateTime.fromISO(task.due_at, { zone: "utc" }).setZone(zone);
        if (!dueDate.isValid)
            return false;
        const dueDay = dueDate.toISODate();
        const nowDay = now.setZone(zone).toISODate();
        return !!dueDay && !!nowDay && nowDay > dueDay;
    }
    const dueUtc = luxon_1.DateTime.fromISO(task.due_at, { zone: "utc" });
    if (!dueUtc.isValid)
        return false;
    return now.toUTC().toMillis() > dueUtc.toMillis();
};
exports.isTaskOverdue = isTaskOverdue;
const buildRecurringProjectionDueAts = (task, count = exports.RECURRING_PROJECTION_COUNT, now = luxon_1.DateTime.utc()) => {
    if (!task.due_at)
        return [];
    if (!(0, exports.isRecurringTask)(task.recurrence_type))
        return [];
    if (!(0, exports.isTaskOverdue)(task, now))
        return [];
    const occurrences = [];
    let cursor = task.due_at;
    for (let index = 1; index <= Math.max(count, 0); index += 1) {
        const nextDueAt = (0, exports.computeNextRecurringDueAt)(task, cursor);
        if (!nextDueAt)
            break;
        occurrences.push({
            projectionIndex: index,
            dueAt: nextDueAt,
        });
        cursor = nextDueAt;
    }
    return occurrences;
};
exports.buildRecurringProjectionDueAts = buildRecurringProjectionDueAts;
