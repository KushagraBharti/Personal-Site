BEGIN;

CREATE TABLE IF NOT EXISTS public.tracker_google_sync_runs (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode text NOT NULL CHECK (mode IN ('live','reconcile','rebuild')),
  status text NOT NULL CHECK (status IN ('queued','running','done','failed','cancelled')),
  queued_jobs integer NOT NULL DEFAULT 0,
  processed_jobs integer NOT NULL DEFAULT 0,
  failed_jobs integer NOT NULL DEFAULT 0,
  started_at timestamptz,
  finished_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tracker_google_sync_runs_user_created
  ON public.tracker_google_sync_runs (user_id, created_at DESC);

ALTER TABLE IF EXISTS public.tracker_google_sync_jobs
  ADD COLUMN IF NOT EXISTS run_id text,
  ADD COLUMN IF NOT EXISTS lane text,
  ADD COLUMN IF NOT EXISTS dedupe_key text,
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS google_event_id text;

UPDATE public.tracker_google_sync_jobs
SET lane = COALESCE(lane, 'system')
WHERE lane IS NULL;

ALTER TABLE IF EXISTS public.tracker_google_sync_jobs
  ALTER COLUMN lane SET DEFAULT 'system';

ALTER TABLE IF EXISTS public.tracker_google_sync_jobs
  DROP CONSTRAINT IF EXISTS tracker_google_sync_jobs_lane_check;

ALTER TABLE IF EXISTS public.tracker_google_sync_jobs
  ADD CONSTRAINT tracker_google_sync_jobs_lane_check
  CHECK (lane IN ('live','reconcile','rebuild','system'));

ALTER TABLE IF EXISTS public.tracker_google_sync_jobs
  DROP CONSTRAINT IF EXISTS tracker_google_sync_jobs_job_type_check;

ALTER TABLE IF EXISTS public.tracker_google_sync_jobs
  ADD CONSTRAINT tracker_google_sync_jobs_job_type_check
  CHECK (
    job_type IN (
      'task_upsert',
      'task_delete',
      'inbound_delta',
      'full_backfill',
      'reconcile_app_page',
      'reconcile_google_page',
      'hard_reset_clear_page',
      'renew_watch'
    )
  );

CREATE INDEX IF NOT EXISTS idx_tracker_google_sync_jobs_queue
  ON public.tracker_google_sync_jobs (user_id, status, priority, run_after, id);

CREATE INDEX IF NOT EXISTS idx_tracker_google_sync_jobs_run_status
  ON public.tracker_google_sync_jobs (run_id, status, id)
  WHERE run_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tracker_google_sync_jobs_task_id
  ON public.tracker_google_sync_jobs (task_id)
  WHERE task_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tracker_google_sync_jobs_google_event_id
  ON public.tracker_google_sync_jobs (google_event_id)
  WHERE google_event_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_tracker_google_sync_jobs_dedupe_active
  ON public.tracker_google_sync_jobs (dedupe_key)
  WHERE dedupe_key IS NOT NULL AND status IN ('pending','running');

DROP FUNCTION IF EXISTS public.claim_sync_jobs(integer, uuid);
DROP FUNCTION IF EXISTS public.claim_sync_jobs(integer, uuid, text[]);
DROP FUNCTION IF EXISTS public.complete_sync_job(bigint);
DROP FUNCTION IF EXISTS public.fail_sync_job(bigint, text, interval);

CREATE OR REPLACE FUNCTION public.claim_sync_jobs(
  batch_size integer DEFAULT 25,
  p_user_id uuid DEFAULT NULL,
  p_lanes text[] DEFAULT NULL
)
RETURNS SETOF public.tracker_google_sync_jobs
LANGUAGE sql
AS $$
  WITH target AS (
    SELECT id
    FROM public.tracker_google_sync_jobs
    WHERE status = 'pending'
      AND run_after <= now()
      AND (p_user_id IS NULL OR user_id = p_user_id)
      AND (p_lanes IS NULL OR lane = ANY(p_lanes))
    ORDER BY priority ASC, run_after ASC, id ASC
    LIMIT GREATEST(COALESCE(batch_size, 25), 1)
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.tracker_google_sync_jobs AS jobs
  SET
    status = 'running',
    locked_at = now(),
    attempt_count = jobs.attempt_count + 1,
    updated_at = now()
  WHERE jobs.id IN (SELECT id FROM target)
  RETURNING jobs.*;
$$;

CREATE OR REPLACE FUNCTION public.complete_sync_job(job_id bigint)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE public.tracker_google_sync_jobs
  SET
    status = 'done',
    locked_at = NULL,
    updated_at = now()
  WHERE id = job_id;
$$;

CREATE OR REPLACE FUNCTION public.fail_sync_job(
  job_id bigint,
  err text,
  retry_delay interval
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  next_status text;
BEGIN
  SELECT
    CASE
      WHEN attempt_count >= max_attempts THEN 'dead'
      ELSE 'pending'
    END
  INTO next_status
  FROM public.tracker_google_sync_jobs
  WHERE id = job_id;

  UPDATE public.tracker_google_sync_jobs
  SET
    status = COALESCE(next_status, 'dead'),
    last_error = err,
    locked_at = NULL,
    run_after = CASE
      WHEN COALESCE(next_status, 'dead') = 'pending' THEN now() + retry_delay
      ELSE run_after
    END,
    updated_at = now()
  WHERE id = job_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.queue_live_sync_job_on_task_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  should_enqueue boolean := false;
BEGIN
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    should_enqueue := true;
  ELSE
    should_enqueue :=
      NEW.title IS DISTINCT FROM OLD.title OR
      NEW.details IS DISTINCT FROM OLD.details OR
      NEW.due_at IS DISTINCT FROM OLD.due_at OR
      NEW.due_timezone IS DISTINCT FROM OLD.due_timezone OR
      NEW.is_completed IS DISTINCT FROM OLD.is_completed OR
      NEW.completed_at IS DISTINCT FROM OLD.completed_at OR
      NEW.list_id IS DISTINCT FROM OLD.list_id OR
      NEW.parent_task_id IS DISTINCT FROM OLD.parent_task_id OR
      NEW.recurrence_type IS DISTINCT FROM OLD.recurrence_type OR
      NEW.recurrence_interval IS DISTINCT FROM OLD.recurrence_interval OR
      NEW.recurrence_unit IS DISTINCT FROM OLD.recurrence_unit OR
      NEW.recurrence_ends_at IS DISTINCT FROM OLD.recurrence_ends_at;
  END IF;

  IF should_enqueue THEN
    BEGIN
      INSERT INTO public.tracker_google_sync_jobs (
        user_id,
        lane,
        task_id,
        list_id,
        job_type,
        source,
        dedupe_key,
        priority,
        payload,
        status
      ) VALUES (
        NEW.user_id,
        'live',
        NEW.id,
        NEW.list_id,
        'task_upsert',
        'trigger_task_change',
        'live:upsert:' || NEW.id::text || ':' || COALESCE(NEW.updated_at::text, now()::text),
        5,
        jsonb_build_object('source', 'trigger_task_change'),
        'pending'
      );
    EXCEPTION WHEN unique_violation THEN
      NULL;
    END;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.queue_live_sync_job_on_task_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  linked_event_id text;
  linked_calendar_id text;
BEGIN
  IF OLD.user_id IS NULL THEN
    RETURN OLD;
  END IF;

  SELECT google_event_id, calendar_id
  INTO linked_event_id, linked_calendar_id
  FROM public.tracker_task_google_event_links
  WHERE user_id = OLD.user_id
    AND task_id = OLD.id
  LIMIT 1;

  BEGIN
    INSERT INTO public.tracker_google_sync_jobs (
      user_id,
      lane,
      task_id,
      list_id,
      google_event_id,
      job_type,
      source,
      dedupe_key,
      priority,
      payload,
      status
    ) VALUES (
      OLD.user_id,
      'live',
      OLD.id,
      OLD.list_id,
      linked_event_id,
      'task_delete',
      'trigger_task_delete',
      'live:delete:' || OLD.id::text || ':' || floor(extract(epoch from clock_timestamp()) * 1000)::text,
      5,
      jsonb_build_object(
        'source', 'trigger_task_delete',
        'calendar_id', linked_calendar_id,
        'google_event_id', linked_event_id
      ),
      'pending'
    );
  EXCEPTION WHEN unique_violation THEN
    NULL;
  END;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_queue_live_sync_task_change ON public.tracker_tasks;
CREATE TRIGGER trg_queue_live_sync_task_change
AFTER INSERT OR UPDATE ON public.tracker_tasks
FOR EACH ROW
EXECUTE FUNCTION public.queue_live_sync_job_on_task_change();

DROP TRIGGER IF EXISTS trg_queue_live_sync_task_delete ON public.tracker_tasks;
CREATE TRIGGER trg_queue_live_sync_task_delete
BEFORE DELETE ON public.tracker_tasks
FOR EACH ROW
EXECUTE FUNCTION public.queue_live_sync_job_on_task_delete();

COMMIT;
