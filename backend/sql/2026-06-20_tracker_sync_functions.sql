-- Tracker Google Calendar sync queue functions and task-change triggers.
-- Definitions were pulled from production with pg_get_functiondef/pg_get_triggerdef
-- and made rerunnable for checked-in database reproducibility.

BEGIN;

CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_tracker_calendar_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.tracker_next_due_at(
  base_due_at timestamp with time zone,
  recurrence_type text,
  recurrence_interval integer,
  recurrence_unit text
)
RETURNS timestamp with time zone
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  safe_due timestamptz;
  safe_interval integer;
  safe_unit text;
begin
  safe_due := coalesce(base_due_at, now());
  safe_interval := greatest(coalesce(recurrence_interval, 1), 1);
  safe_unit := coalesce(nullif(lower(recurrence_unit), ''), 'day');

  case lower(coalesce(recurrence_type, 'none'))
    when 'daily' then
      return safe_due + interval '1 day';
    when 'weekly' then
      return safe_due + interval '1 week';
    when 'biweekly' then
      return safe_due + interval '2 weeks';
    when 'custom' then
      if safe_unit = 'month' then
        return safe_due + make_interval(months => safe_interval);
      elsif safe_unit = 'week' then
        return safe_due + make_interval(weeks => safe_interval);
      else
        return safe_due + make_interval(days => safe_interval);
      end if;
    else
      return null;
  end case;
end;
$function$;

CREATE OR REPLACE FUNCTION public.claim_sync_jobs(
  batch_size integer DEFAULT 25,
  p_user_id uuid DEFAULT NULL::uuid,
  p_lanes text[] DEFAULT NULL::text[]
)
RETURNS SETOF public.tracker_google_sync_jobs
LANGUAGE sql
SET search_path TO 'public', 'pg_temp'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.complete_sync_job(job_id bigint)
RETURNS void
LANGUAGE sql
SET search_path TO 'public', 'pg_temp'
AS $function$
  UPDATE public.tracker_google_sync_jobs
  SET
    status = 'done',
    locked_at = NULL,
    updated_at = now()
  WHERE id = job_id;
$function$;

CREATE OR REPLACE FUNCTION public.fail_sync_job(
  job_id bigint,
  err text,
  retry_delay interval
)
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.enqueue_task_google_sync_job()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_user_id uuid;
  v_task_id uuid;
  v_list_id uuid;
  v_job_type text;
  v_has_connection boolean;
  v_list_enabled boolean;
  v_now_bucket text;
  v_dedupe_key text;
begin
  if tg_op = 'DELETE' then
    v_user_id := old.user_id;
    v_task_id := old.id;
    v_list_id := old.list_id;
    v_job_type := 'task_delete';
  else
    v_user_id := new.user_id;
    v_task_id := new.id;
    v_list_id := new.list_id;
    v_job_type := 'task_upsert';
  end if;

  select exists (
    select 1
    from public.tracker_google_calendar_connections_public c
    where c.user_id = v_user_id
      and c.status = 'connected'
      and c.selected_calendar_id is not null
  ) into v_has_connection;

  if not v_has_connection then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  select coalesce((
    select s.sync_enabled
    from public.tracker_task_list_sync_settings s
    where s.user_id = v_user_id
      and s.list_id = v_list_id
    limit 1
  ), false) into v_list_enabled;

  if not v_list_enabled then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  v_now_bucket := to_char(date_trunc('minute', now()), 'YYYYMMDDHH24MI');
  v_dedupe_key := v_job_type || ':' || v_task_id::text || ':' || v_now_bucket;

  insert into public.tracker_google_sync_jobs (
    user_id,
    task_id,
    list_id,
    job_type,
    priority,
    payload,
    status
  ) values (
    v_user_id,
    v_task_id,
    v_list_id,
    v_job_type,
    100,
    jsonb_build_object('dedupe_key', v_dedupe_key, 'source', 'trigger'),
    'pending'
  )
  on conflict do nothing;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.queue_live_sync_job_on_task_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.queue_live_sync_job_on_task_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
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
$function$;

DROP TRIGGER IF EXISTS set_tracker_google_calendar_connections_public_updated_at
  ON public.tracker_google_calendar_connections_public;
CREATE TRIGGER set_tracker_google_calendar_connections_public_updated_at
  BEFORE UPDATE ON public.tracker_google_calendar_connections_public
  FOR EACH ROW
  EXECUTE FUNCTION public.set_tracker_calendar_updated_at();

DROP TRIGGER IF EXISTS set_tracker_google_calendar_connections_secrets_updated_at
  ON public.tracker_google_calendar_connections_secrets;
CREATE TRIGGER set_tracker_google_calendar_connections_secrets_updated_at
  BEFORE UPDATE ON public.tracker_google_calendar_connections_secrets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_tracker_calendar_updated_at();

DROP TRIGGER IF EXISTS set_tracker_google_sync_jobs_updated_at
  ON public.tracker_google_sync_jobs;
CREATE TRIGGER set_tracker_google_sync_jobs_updated_at
  BEFORE UPDATE ON public.tracker_google_sync_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_tracker_calendar_updated_at();

DROP TRIGGER IF EXISTS set_tracker_task_google_event_links_updated_at
  ON public.tracker_task_google_event_links;
CREATE TRIGGER set_tracker_task_google_event_links_updated_at
  BEFORE UPDATE ON public.tracker_task_google_event_links
  FOR EACH ROW
  EXECUTE FUNCTION public.set_tracker_calendar_updated_at();

DROP TRIGGER IF EXISTS set_tracker_task_list_sync_settings_updated_at
  ON public.tracker_task_list_sync_settings;
CREATE TRIGGER set_tracker_task_list_sync_settings_updated_at
  BEFORE UPDATE ON public.tracker_task_list_sync_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_tracker_calendar_updated_at();

DROP TRIGGER IF EXISTS tracker_task_lists_set_updated_at
  ON public.tracker_task_lists;
CREATE TRIGGER tracker_task_lists_set_updated_at
  BEFORE UPDATE ON public.tracker_task_lists
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS tracker_task_sort_preferences_set_updated_at
  ON public.tracker_task_sort_preferences;
CREATE TRIGGER tracker_task_sort_preferences_set_updated_at
  BEFORE UPDATE ON public.tracker_task_sort_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS tracker_tasks_set_updated_at
  ON public.tracker_tasks;
CREATE TRIGGER tracker_tasks_set_updated_at
  BEFORE UPDATE ON public.tracker_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS tracker_tasks_enqueue_google_sync_job
  ON public.tracker_tasks;
CREATE TRIGGER tracker_tasks_enqueue_google_sync_job
  AFTER INSERT OR UPDATE OR DELETE ON public.tracker_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_task_google_sync_job();

DROP TRIGGER IF EXISTS trg_queue_live_sync_task_change
  ON public.tracker_tasks;
CREATE TRIGGER trg_queue_live_sync_task_change
  AFTER INSERT OR UPDATE ON public.tracker_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_live_sync_job_on_task_change();

DROP TRIGGER IF EXISTS trg_queue_live_sync_task_delete
  ON public.tracker_tasks;
CREATE TRIGGER trg_queue_live_sync_task_delete
  BEFORE DELETE ON public.tracker_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_live_sync_job_on_task_delete();

REVOKE ALL ON FUNCTION public.claim_sync_jobs(integer, uuid, text[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_sync_job(bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fail_sync_job(bigint, text, interval) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enqueue_task_google_sync_job() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.queue_live_sync_job_on_task_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.queue_live_sync_job_on_task_delete() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_tracker_calendar_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at_timestamp() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tracker_next_due_at(timestamp with time zone, text, integer, text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.claim_sync_jobs(integer, uuid, text[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_sync_job(bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.fail_sync_job(bigint, text, interval) TO service_role;
GRANT EXECUTE ON FUNCTION public.enqueue_task_google_sync_job() TO service_role;
GRANT EXECUTE ON FUNCTION public.queue_live_sync_job_on_task_change() TO service_role;
GRANT EXECUTE ON FUNCTION public.queue_live_sync_job_on_task_delete() TO service_role;
GRANT EXECUTE ON FUNCTION public.set_tracker_calendar_updated_at() TO service_role;
GRANT EXECUTE ON FUNCTION public.set_updated_at_timestamp() TO service_role;
GRANT EXECUTE ON FUNCTION public.tracker_next_due_at(timestamp with time zone, text, integer, text) TO service_role;

COMMIT;
