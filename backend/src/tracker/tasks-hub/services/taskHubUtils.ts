import {
  RecurrenceType,
  RecurrenceUnit,
  SortDirection,
  TaskSortMode,
} from "./taskHubTypes";

export const DEFAULT_LIST_NAME = "General";
export const LIST_COLOR_POOL = [
  "#00FFFF",
  "#BFFF00",
  "#FF6B9D",
  "#FFE600",
  "#B388FF",
  "#FF9500",
  "#0066FF",
];

export const nowIso = () => new Date().toISOString();

export const getRawErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message?: unknown }).message ?? "");
  }
  return String(error);
};

export const normalizeListName = (name: string) =>
  name.trim().replace(/\s+/g, " ").toLocaleLowerCase();

export const isValidIanaTimeZone = (timeZone: string | null | undefined) => {
  if (!timeZone) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
};

export const normalizeBrowserTimeZone = (timeZone: unknown) =>
  typeof timeZone === "string" && isValidIanaTimeZone(timeZone)
    ? timeZone
    : "UTC";

export const normalizeTaskDueTimeZone = (
  dueAt: string | null,
  dueTimeZone: unknown,
  browserTimeZone: unknown,
  currentTimeZone?: string | null,
) => {
  if (!dueAt) return null;
  if (typeof dueTimeZone === "string" && isValidIanaTimeZone(dueTimeZone))
    return dueTimeZone;
  if (isValidIanaTimeZone(currentTimeZone)) return currentTimeZone as string;
  return normalizeBrowserTimeZone(browserTimeZone);
};

export const cleanOptionalString = (value: unknown) => {
  if (value === undefined) return undefined;
  if (typeof value !== "string") return null;
  return value.trim();
};

export const cleanNullableString = (
  value: unknown,
  options?: { trim?: boolean },
) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return null;
  return options?.trim ? value.trim() : value;
};

export const normalizeRecurrenceType = (
  value: unknown,
): RecurrenceType | null => {
  if (
    value === "none" ||
    value === "daily" ||
    value === "weekly" ||
    value === "biweekly" ||
    value === "custom"
  ) {
    return value;
  }
  return null;
};

export const normalizeRecurrenceUnit = (
  value: unknown,
): RecurrenceUnit | null => {
  if (value === "day" || value === "week" || value === "month") return value;
  return null;
};

export const normalizeSortMode = (value: unknown): TaskSortMode | null => {
  if (
    value === "due_date" ||
    value === "date_created" ||
    value === "title" ||
    value === "custom"
  ) {
    return value;
  }
  return null;
};

export const normalizeSortDirection = (
  value: unknown,
): SortDirection | null => {
  if (value === "asc" || value === "desc") return value;
  return null;
};

export const pickAutoListColor = (existingColors: string[]) => {
  const existing = new Set(
    existingColors.map((color) => color.toLocaleLowerCase()),
  );
  const available = LIST_COLOR_POOL.filter(
    (color) => !existing.has(color.toLocaleLowerCase()),
  );
  const palette = available.length > 0 ? available : LIST_COLOR_POOL;
  return palette[Math.floor(Math.random() * palette.length)];
};
