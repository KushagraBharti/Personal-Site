BEGIN;

CREATE TABLE IF NOT EXISTS public.tracker_task_google_projection_event_links (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.tracker_tasks(id),
  calendar_id text NOT NULL,
  google_event_id text NOT NULL,
  projection_index integer NOT NULL CHECK (projection_index > 0),
  projected_due_at timestamptz NOT NULL,
  google_event_etag text,
  google_event_updated_at timestamptz,
  last_synced_task_updated_at timestamptz,
  last_sync_source text NOT NULL DEFAULT 'system'
    CHECK (last_sync_source IN ('app', 'google', 'system')),
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_tracker_task_google_projection_links_task_projection
  ON public.tracker_task_google_projection_event_links (user_id, task_id, projection_index);

CREATE UNIQUE INDEX IF NOT EXISTS uq_tracker_task_google_projection_links_google_event
  ON public.tracker_task_google_projection_event_links (user_id, calendar_id, google_event_id);

CREATE INDEX IF NOT EXISTS idx_tracker_task_google_projection_links_task
  ON public.tracker_task_google_projection_event_links (user_id, task_id, is_deleted, projection_index);

COMMIT;
