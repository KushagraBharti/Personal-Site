"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pickAutoListColor = exports.normalizeSortDirection = exports.normalizeSortMode = exports.normalizeRecurrenceUnit = exports.normalizeRecurrenceType = exports.cleanNullableString = exports.cleanOptionalString = exports.normalizeTaskDueTimeZone = exports.normalizeBrowserTimeZone = exports.isValidIanaTimeZone = exports.normalizeListName = exports.getRawErrorMessage = exports.nowIso = exports.LIST_COLOR_POOL = exports.DEFAULT_LIST_NAME = void 0;
const taskCalendarEventUtils_1 = require("../../calendar/services/taskCalendarEventUtils");
exports.DEFAULT_LIST_NAME = "General";
exports.LIST_COLOR_POOL = [
    "#00FFFF",
    "#BFFF00",
    "#FF6B9D",
    "#FFE600",
    "#B388FF",
    "#FF9500",
    "#0066FF",
];
const nowIso = () => new Date().toISOString();
exports.nowIso = nowIso;
const getRawErrorMessage = (error) => {
    var _a;
    if (error instanceof Error)
        return error.message;
    if (typeof error === "object" && error !== null && "message" in error) {
        return String((_a = error.message) !== null && _a !== void 0 ? _a : "");
    }
    return String(error);
};
exports.getRawErrorMessage = getRawErrorMessage;
const normalizeListName = (name) => name.trim().replace(/\s+/g, " ").toLocaleLowerCase();
exports.normalizeListName = normalizeListName;
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
exports.isValidIanaTimeZone = isValidIanaTimeZone;
const normalizeBrowserTimeZone = (timeZone) => typeof timeZone === "string" && (0, exports.isValidIanaTimeZone)(timeZone) ? timeZone : "UTC";
exports.normalizeBrowserTimeZone = normalizeBrowserTimeZone;
const normalizeTaskDueTimeZone = (dueAt, dueTimeZone, browserTimeZone, currentTimeZone) => {
    if (!dueAt || (0, taskCalendarEventUtils_1.isDateOnlyIso)(dueAt))
        return null;
    if (typeof dueTimeZone === "string" && (0, exports.isValidIanaTimeZone)(dueTimeZone))
        return dueTimeZone;
    if ((0, exports.isValidIanaTimeZone)(currentTimeZone))
        return currentTimeZone;
    return (0, exports.normalizeBrowserTimeZone)(browserTimeZone);
};
exports.normalizeTaskDueTimeZone = normalizeTaskDueTimeZone;
const cleanOptionalString = (value) => {
    if (value === undefined)
        return undefined;
    if (typeof value !== "string")
        return null;
    return value.trim();
};
exports.cleanOptionalString = cleanOptionalString;
const cleanNullableString = (value, options) => {
    if (value === undefined)
        return undefined;
    if (value === null)
        return null;
    if (typeof value !== "string")
        return null;
    return (options === null || options === void 0 ? void 0 : options.trim) ? value.trim() : value;
};
exports.cleanNullableString = cleanNullableString;
const normalizeRecurrenceType = (value) => {
    if (value === "none" ||
        value === "daily" ||
        value === "weekly" ||
        value === "biweekly" ||
        value === "custom") {
        return value;
    }
    return null;
};
exports.normalizeRecurrenceType = normalizeRecurrenceType;
const normalizeRecurrenceUnit = (value) => {
    if (value === "day" || value === "week" || value === "month")
        return value;
    return null;
};
exports.normalizeRecurrenceUnit = normalizeRecurrenceUnit;
const normalizeSortMode = (value) => {
    if (value === "due_date" || value === "date_created" || value === "title" || value === "custom") {
        return value;
    }
    return null;
};
exports.normalizeSortMode = normalizeSortMode;
const normalizeSortDirection = (value) => {
    if (value === "asc" || value === "desc")
        return value;
    return null;
};
exports.normalizeSortDirection = normalizeSortDirection;
const pickAutoListColor = (existingColors) => {
    const existing = new Set(existingColors.map((color) => color.toLocaleLowerCase()));
    const available = exports.LIST_COLOR_POOL.filter((color) => !existing.has(color.toLocaleLowerCase()));
    const palette = available.length > 0 ? available : exports.LIST_COLOR_POOL;
    return palette[Math.floor(Math.random() * palette.length)];
};
exports.pickAutoListColor = pickAutoListColor;
