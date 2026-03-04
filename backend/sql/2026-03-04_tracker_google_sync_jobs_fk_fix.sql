-- Allow task_delete sync jobs to be enqueued even if tracker_tasks row is already deleted.
-- This removes the hard FK from tracker_google_sync_jobs.task_id -> tracker_tasks.id
-- and keeps an index for lookup performance.

BEGIN;

ALTER TABLE IF EXISTS public.tracker_google_sync_jobs
  DROP CONSTRAINT IF EXISTS tracker_google_sync_jobs_task_id_fkey;

ALTER TABLE IF EXISTS public.tracker_google_sync_jobs
  ALTER COLUMN task_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tracker_google_sync_jobs_task_id
  ON public.tracker_google_sync_jobs (task_id)
  WHERE task_id IS NOT NULL;

COMMIT;
