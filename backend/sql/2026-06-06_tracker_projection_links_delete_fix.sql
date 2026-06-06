-- Allow tasks with projected Google Calendar events to be deleted.
-- The trigger snapshots projected event IDs before cascade deletes the link rows.

BEGIN;

ALTER TABLE IF EXISTS public.tracker_task_google_projection_event_links
  DROP CONSTRAINT IF EXISTS tracker_task_google_projection_event_links_task_id_fkey;

ALTER TABLE IF EXISTS public.tracker_task_google_projection_event_links
  ADD CONSTRAINT tracker_task_google_projection_event_links_task_id_fkey
  FOREIGN KEY (task_id)
  REFERENCES public.tracker_tasks(id)
  ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.queue_live_sync_job_on_task_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  linked_event_id text;
  linked_calendar_id text;
  linked_projection_events jsonb;
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

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'calendar_id', calendar_id,
        'google_event_id', google_event_id,
        'projection_index', projection_index
      )
      ORDER BY projection_index
    ),
    '[]'::jsonb
  )
  INTO linked_projection_events
  FROM public.tracker_task_google_projection_event_links
  WHERE user_id = OLD.user_id
    AND task_id = OLD.id
    AND is_deleted = false;

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
        'google_event_id', linked_event_id,
        'projection_events', linked_projection_events
      ),
      'pending'
    );
  EXCEPTION WHEN unique_violation THEN
    NULL;
  END;

  RETURN OLD;
END;
$$;

COMMIT;
