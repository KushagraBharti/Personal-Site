export type TaskSortMode = "due_date" | "date_created" | "title" | "custom";

export type SortDirection = "asc" | "desc";

export type RecurrenceType = "none" | "daily" | "weekly" | "biweekly" | "custom";

export type RecurrenceUnit = "day" | "week" | "month";

export interface TaskList {
  id: string;
  user_id: string;
  name: string;
  color_hex: string;
  sort_order: number;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrackerTask {
  id: string;
  user_id: string;
  list_id: string;
  parent_task_id: string | null;
  title: string;
  details: string | null;
  due_at: string | null;
  is_completed: boolean;
  completed_at: string | null;
  recurrence_type: RecurrenceType;
  recurrence_interval: number | null;
  recurrence_unit: RecurrenceUnit | null;
  recurrence_ends_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TaskSortPreference {
  id: string;
  user_id: string;
  list_id: string;
  sort_mode: TaskSortMode;
  sort_direction: SortDirection;
  created_at: string;
  updated_at: string;
}

export interface TaskDraft {
  list_id: string;
  parent_task_id: string | null;
  title: string;
  details: string;
  due_at: string;
  recurrence_type: RecurrenceType;
  recurrence_interval: number;
  recurrence_unit: RecurrenceUnit;
  recurrence_ends_at: string;
}

export interface TaskUpdateInput {
  title?: string;
  details?: string | null;
  due_at?: string | null;
  is_completed?: boolean;
  completed_at?: string | null;
  recurrence_type?: RecurrenceType;
  recurrence_interval?: number | null;
  recurrence_unit?: RecurrenceUnit | null;
  recurrence_ends_at?: string | null;
  sort_order?: number;
  list_id?: string;
  parent_task_id?: string | null;
}

export interface ListUpdateInput {
  name?: string;
  color_hex?: string;
  sort_order?: number;
  archived?: boolean;
}

export interface TaskListSyncSetting {
  list_id: string;
  sync_enabled: boolean;
}

export interface CalendarConnectionState {
  connected: boolean;
  connection: {
    id: string;
    status: "connected" | "error" | "disconnected";
    google_email: string | null;
    selected_calendar_id: string | null;
    selected_calendar_summary: string | null;
    last_full_sync_at: string | null;
    last_incremental_sync_at: string | null;
    last_error: string | null;
  } | null;
  watch_expires_at: string | null;
  list_sync_settings: TaskListSyncSetting[];
}

export interface SyncNowResult {
  ok: boolean;
  processed: number;
  failed: number;
}
