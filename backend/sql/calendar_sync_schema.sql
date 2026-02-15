-- Calendar sync schema for tracker tasks <-> Google Calendar
-- Run in Supabase SQL editor.

create extension if not exists pgcrypto;

-- ============================================================================
-- CONNECTIONS
-- ============================================================================

create table if not exists public.tracker_google_calendar_connections_public (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  status text not null default 'connected' check (status in ('connected', 'error', 'disconnected')),
  google_email text,
  selected_calendar_id text,
  selected_calendar_summary text,
  last_full_sync_at timestamptz,
  last_incremental_sync_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tracker_google_calendar_connections_secrets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  connection_public_id uuid not null references public.tracker_google_calendar_connections_public(id) on delete cascade,
  refresh_token_encrypted text not null,
  access_token_encrypted text,
  access_token_expires_at timestamptz,
  sync_token text,
  channel_id text,
  channel_resource_id text,
  channel_token_hash text,
  channel_expiration timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tracker_google_calendar_connections_secrets_channel_idx
  on public.tracker_google_calendar_connections_secrets(channel_id, channel_resource_id);

-- ============================================================================
-- LINKS + SETTINGS
-- ============================================================================

create table if not exists public.tracker_task_google_event_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null unique references public.tracker_tasks(id) on delete cascade,
  calendar_id text not null,
  google_event_id text not null,
  google_event_etag text,
  google_event_updated_at timestamptz,
  last_synced_task_updated_at timestamptz,
  last_sync_source text not null default 'system' check (last_sync_source in ('app', 'google', 'system')),
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, calendar_id, google_event_id)
);

create table if not exists public.tracker_task_list_sync_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  list_id uuid not null references public.tracker_task_lists(id) on delete cascade,
  sync_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, list_id)
);

-- ============================================================================
-- JOB QUEUE
-- ============================================================================

create table if not exists public.tracker_google_sync_jobs (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references public.tracker_tasks(id) on delete cascade,
  list_id uuid references public.tracker_task_lists(id) on delete cascade,
  job_type text not null check (job_type in ('task_upsert', 'task_delete', 'inbound_delta', 'full_backfill', 'renew_watch')),
  priority integer not null default 100,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'running', 'done', 'failed', 'dead')),
  attempt_count integer not null default 0,
  max_attempts integer not null default 8,
  run_after timestamptz not null default now(),
  last_error text,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tracker_google_sync_jobs_status_run_after_idx
  on public.tracker_google_sync_jobs(status, run_after, priority, id);

create index if not exists tracker_google_sync_jobs_user_status_idx
  on public.tracker_google_sync_jobs(user_id, status);

create index if not exists tracker_google_sync_jobs_type_status_idx
  on public.tracker_google_sync_jobs(job_type, status);

create unique index if not exists tracker_google_sync_jobs_dedupe_unique_idx
  on public.tracker_google_sync_jobs (
    user_id,
    job_type,
    (coalesce(payload->>'dedupe_key', ''))
  )
  where status in ('pending', 'running')
  and payload ? 'dedupe_key';

-- ============================================================================
-- UPDATED_AT HELPERS
-- ============================================================================

create or replace function public.set_tracker_calendar_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_tracker_google_calendar_connections_public_updated_at
  on public.tracker_google_calendar_connections_public;
create trigger set_tracker_google_calendar_connections_public_updated_at
before update on public.tracker_google_calendar_connections_public
for each row execute function public.set_tracker_calendar_updated_at();

drop trigger if exists set_tracker_google_calendar_connections_secrets_updated_at
  on public.tracker_google_calendar_connections_secrets;
create trigger set_tracker_google_calendar_connections_secrets_updated_at
before update on public.tracker_google_calendar_connections_secrets
for each row execute function public.set_tracker_calendar_updated_at();

drop trigger if exists set_tracker_task_google_event_links_updated_at
  on public.tracker_task_google_event_links;
create trigger set_tracker_task_google_event_links_updated_at
before update on public.tracker_task_google_event_links
for each row execute function public.set_tracker_calendar_updated_at();

drop trigger if exists set_tracker_task_list_sync_settings_updated_at
  on public.tracker_task_list_sync_settings;
create trigger set_tracker_task_list_sync_settings_updated_at
before update on public.tracker_task_list_sync_settings
for each row execute function public.set_tracker_calendar_updated_at();

drop trigger if exists set_tracker_google_sync_jobs_updated_at
  on public.tracker_google_sync_jobs;
create trigger set_tracker_google_sync_jobs_updated_at
before update on public.tracker_google_sync_jobs
for each row execute function public.set_tracker_calendar_updated_at();

-- ============================================================================
-- QUEUE FUNCTIONS
-- ============================================================================

create or replace function public.claim_sync_jobs(batch_size integer default 25, p_user_id uuid default null)
returns setof public.tracker_google_sync_jobs
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with next_jobs as (
    select id
    from public.tracker_google_sync_jobs
    where status = 'pending'
      and run_after <= now()
      and (p_user_id is null or user_id = p_user_id)
    order by priority asc, run_after asc, id asc
    limit greatest(batch_size, 1)
    for update skip locked
  )
  update public.tracker_google_sync_jobs j
    set status = 'running',
        locked_at = now()
    from next_jobs
    where j.id = next_jobs.id
  returning j.*;
end;
$$;

revoke all on function public.claim_sync_jobs(integer, uuid) from public;
grant execute on function public.claim_sync_jobs(integer, uuid) to service_role;

create or replace function public.complete_sync_job(job_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.tracker_google_sync_jobs
     set status = 'done',
         locked_at = null,
         updated_at = now()
   where id = job_id;
end;
$$;

revoke all on function public.complete_sync_job(bigint) from public;
grant execute on function public.complete_sync_job(bigint) to service_role;

create or replace function public.fail_sync_job(
  job_id bigint,
  err text,
  retry_delay interval default interval '1 minute'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_attempts integer;
  current_max integer;
  next_status text;
begin
  select attempt_count, max_attempts
    into current_attempts, current_max
    from public.tracker_google_sync_jobs
   where id = job_id
   for update;

  if current_attempts is null then
    return;
  end if;

  if current_attempts + 1 >= current_max then
    next_status := 'dead';
  else
    next_status := 'pending';
  end if;

  update public.tracker_google_sync_jobs
     set attempt_count = current_attempts + 1,
         status = next_status,
         last_error = err,
         locked_at = null,
         run_after = case when next_status = 'dead' then run_after else now() + retry_delay end,
         updated_at = now()
   where id = job_id;
end;
$$;

revoke all on function public.fail_sync_job(bigint, text, interval) from public;
grant execute on function public.fail_sync_job(bigint, text, interval) to service_role;

-- ============================================================================
-- TASK TRIGGER -> ENQUEUE OUTBOUND JOBS
-- ============================================================================

create or replace function public.enqueue_task_google_sync_job()
returns trigger
language plpgsql
as $$
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
$$;

drop trigger if exists tracker_tasks_enqueue_google_sync_job on public.tracker_tasks;
create trigger tracker_tasks_enqueue_google_sync_job
after insert or update or delete on public.tracker_tasks
for each row execute function public.enqueue_task_google_sync_job();

-- ============================================================================
-- RLS
-- ============================================================================

alter table public.tracker_google_calendar_connections_public enable row level security;
alter table public.tracker_google_calendar_connections_secrets enable row level security;
alter table public.tracker_task_google_event_links enable row level security;
alter table public.tracker_task_list_sync_settings enable row level security;
alter table public.tracker_google_sync_jobs enable row level security;

drop policy if exists tracker_google_calendar_connections_public_select_own on public.tracker_google_calendar_connections_public;
create policy tracker_google_calendar_connections_public_select_own
  on public.tracker_google_calendar_connections_public
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists tracker_google_calendar_connections_public_mutate_own on public.tracker_google_calendar_connections_public;
create policy tracker_google_calendar_connections_public_mutate_own
  on public.tracker_google_calendar_connections_public
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists tracker_task_list_sync_settings_select_own on public.tracker_task_list_sync_settings;
create policy tracker_task_list_sync_settings_select_own
  on public.tracker_task_list_sync_settings
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists tracker_task_list_sync_settings_mutate_own on public.tracker_task_list_sync_settings;
create policy tracker_task_list_sync_settings_mutate_own
  on public.tracker_task_list_sync_settings
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists tracker_task_google_event_links_select_own on public.tracker_task_google_event_links;
create policy tracker_task_google_event_links_select_own
  on public.tracker_task_google_event_links
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists tracker_task_google_event_links_mutate_own on public.tracker_task_google_event_links;
create policy tracker_task_google_event_links_mutate_own
  on public.tracker_task_google_event_links
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Secrets + jobs: deny for authenticated/anon, service role bypasses RLS.
drop policy if exists tracker_google_calendar_connections_secrets_no_access on public.tracker_google_calendar_connections_secrets;
create policy tracker_google_calendar_connections_secrets_no_access
  on public.tracker_google_calendar_connections_secrets
  for all
  to authenticated
  using (false)
  with check (false);

drop policy if exists tracker_google_sync_jobs_no_access on public.tracker_google_sync_jobs;
create policy tracker_google_sync_jobs_no_access
  on public.tracker_google_sync_jobs
  for all
  to authenticated
  using (false)
  with check (false);
