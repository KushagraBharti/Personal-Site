CREATE OR REPLACE FUNCTION public.enqueue_task_google_sync_job()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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

REVOKE ALL ON FUNCTION public.enqueue_task_google_sync_job() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_task_google_sync_job() TO service_role;
