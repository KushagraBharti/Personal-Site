import { TrackerTaskRow } from "../../../types/googleCalendar";

export type RecurrenceType = TrackerTaskRow["recurrence_type"];
export type RecurrenceUnit = TrackerTaskRow["recurrence_unit"];

export type TaskSortMode = "due_date" | "date_created" | "title" | "custom";
export type SortDirection = "asc" | "desc";

export interface TrackerTaskListRow {
  id: string;
  user_id: string;
  name: string;
  color_hex: string;
  sort_order: number;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrackerTaskSortPreferenceRow {
  id: string;
  user_id: string;
  list_id: string;
  sort_mode: TaskSortMode;
  sort_direction: SortDirection;
  created_at: string;
  updated_at: string;
}

export interface TaskCreateInput {
  list_id?: unknown;
  parent_task_id?: unknown;
  title?: unknown;
  details?: unknown;
  due_at?: unknown;
  due_timezone?: unknown;
  recurrence_type?: unknown;
  recurrence_interval?: unknown;
  recurrence_unit?: unknown;
  recurrence_ends_at?: unknown;
  browser_timezone?: unknown;
}

export interface TaskUpdateInput {
  list_id?: unknown;
  parent_task_id?: unknown;
  title?: unknown;
  details?: unknown;
  due_at?: unknown;
  due_timezone?: unknown;
  recurrence_type?: unknown;
  recurrence_interval?: unknown;
  recurrence_unit?: unknown;
  recurrence_ends_at?: unknown;
  browser_timezone?: unknown;
}

export interface TaskListCreateInput {
  name?: unknown;
  color_hex?: unknown;
}

export interface TaskListUpdateInput {
  name?: unknown;
  color_hex?: unknown;
}

export interface ServiceFailure {
  ok: false;
  code: number;
  error: string;
}

export type ServiceResult<T> = ({ ok: true } & T) | ServiceFailure;
