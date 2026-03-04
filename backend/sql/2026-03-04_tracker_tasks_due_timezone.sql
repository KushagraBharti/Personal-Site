-- Store per-task IANA timezone so recurring schedule anchors survive travel.

BEGIN;

ALTER TABLE IF EXISTS public.tracker_tasks
  ADD COLUMN IF NOT EXISTS due_timezone text;

COMMENT ON COLUMN public.tracker_tasks.due_timezone IS
  'IANA timezone for timed due_at values (e.g. America/Chicago). Null for date-only tasks.';

COMMIT;
