export type CalendarSyncJobType =
  | "task_upsert"
  | "task_delete"
  | "inbound_delta"
  | "full_backfill"
  | "renew_watch";

export interface CalendarConnectionPublic {
  id: string;
  user_id: string;
  status: "connected" | "error" | "disconnected";
  google_email: string | null;
  selected_calendar_id: string | null;
  selected_calendar_summary: string | null;
  last_full_sync_at: string | null;
  last_incremental_sync_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarConnectionSecrets {
  id: string;
  user_id: string;
  connection_public_id: string;
  refresh_token_encrypted: string;
  access_token_encrypted: string | null;
  access_token_expires_at: string | null;
  sync_token: string | null;
  channel_id: string | null;
  channel_resource_id: string | null;
  channel_token_hash: string | null;
  channel_expiration: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrackerGoogleSyncJob {
  id: number;
  user_id: string;
  task_id: string | null;
  list_id: string | null;
  job_type: CalendarSyncJobType;
  priority: number;
  payload: Record<string, unknown>;
  status: "pending" | "running" | "done" | "failed" | "dead";
  attempt_count: number;
  max_attempts: number;
  run_after: string;
  last_error: string | null;
  locked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrackerTaskRow {
  id: string;
  user_id: string;
  list_id: string;
  parent_task_id: string | null;
  title: string;
  details: string | null;
  due_at: string | null;
  is_completed: boolean;
  completed_at: string | null;
  recurrence_type: "none" | "daily" | "weekly" | "biweekly" | "custom";
  recurrence_interval: number | null;
  recurrence_unit: "day" | "week" | "month" | null;
  recurrence_ends_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

