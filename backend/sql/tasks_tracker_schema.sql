-- Tasks Tracker schema (Google Tasks style, compact + dynamic)
-- Safe to run multiple times.

create extension if not exists pgcrypto;

-- ============================================================================
-- Helpers
-- ============================================================================

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Optional helper for SQL-side recurrence previews / jobs.
create or replace function public.tracker_next_due_at(
  base_due_at timestamptz,
  recurrence_type text,
  recurrence_interval integer,
  recurrence_unit text
)
returns timestamptz
language plpgsql
as $$
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
$$;

-- ============================================================================
-- 1) Lists / categories
-- ============================================================================

create table if not exists public.tracker_task_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  name text not null,
  color_hex text not null default '#00FFFF',
  sort_order integer not null default 0,
  archived boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint tracker_task_lists_name_not_blank check (length(trim(name)) > 0),
  constraint tracker_task_lists_color_hex_valid check (color_hex ~* '^#[0-9a-f]{6}$')
);

create index if not exists tracker_task_lists_user_sort_idx
  on public.tracker_task_lists(user_id, archived, sort_order, created_at);

drop index if exists tracker_task_lists_user_name_ci_unique_idx;
create unique index if not exists tracker_task_lists_user_name_ci_active_unique_idx
  on public.tracker_task_lists(user_id, lower(name))
  where archived = false;

-- ============================================================================
-- 2) Tasks (supports subtasks through parent_task_id)
-- ============================================================================

create table if not exists public.tracker_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  list_id uuid not null references public.tracker_task_lists(id) on delete cascade,
  parent_task_id uuid references public.tracker_tasks(id) on delete cascade,

  title text not null,
  details text,

  due_at timestamptz,
  is_completed boolean not null default false,
  completed_at timestamptz,

  -- Recurrence model
  recurrence_type text not null default 'none',
  recurrence_interval integer,
  recurrence_unit text,
  recurrence_ends_at timestamptz,

  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint tracker_tasks_title_not_blank check (length(trim(title)) > 0),
  constraint tracker_tasks_recurrence_type_valid
    check (lower(recurrence_type) in ('none', 'daily', 'weekly', 'biweekly', 'custom')),
  constraint tracker_tasks_custom_interval_valid
    check (
      lower(recurrence_type) <> 'custom'
      or coalesce(recurrence_interval, 0) > 0
    ),
  constraint tracker_tasks_custom_unit_valid
    check (
      lower(recurrence_type) <> 'custom'
      or lower(coalesce(recurrence_unit, '')) in ('day', 'week', 'month')
    ),
  constraint tracker_tasks_completion_consistency
    check (
      (is_completed = false and completed_at is null)
      or (is_completed = true and completed_at is not null)
    )
);

create index if not exists tracker_tasks_user_list_idx
  on public.tracker_tasks(user_id, list_id, is_completed, sort_order, created_at);

create index if not exists tracker_tasks_due_idx
  on public.tracker_tasks(user_id, is_completed, due_at, created_at);

create index if not exists tracker_tasks_parent_idx
  on public.tracker_tasks(user_id, parent_task_id, sort_order, created_at);

-- ============================================================================
-- 3) Sort preference per list
-- ============================================================================

create table if not exists public.tracker_task_sort_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  list_id uuid not null references public.tracker_task_lists(id) on delete cascade,

  sort_mode text not null default 'custom',
  sort_direction text not null default 'asc',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint tracker_task_sort_mode_valid
    check (lower(sort_mode) in ('due_date', 'date_created', 'title', 'custom')),
  constraint tracker_task_sort_direction_valid
    check (lower(sort_direction) in ('asc', 'desc')),
  constraint tracker_task_sort_preferences_unique unique (user_id, list_id)
);

create index if not exists tracker_task_sort_preferences_user_list_idx
  on public.tracker_task_sort_preferences(user_id, list_id);

-- ============================================================================
-- Triggers
-- ============================================================================

drop trigger if exists tracker_task_lists_set_updated_at on public.tracker_task_lists;
create trigger tracker_task_lists_set_updated_at
before update on public.tracker_task_lists
for each row execute function public.set_updated_at_timestamp();

drop trigger if exists tracker_tasks_set_updated_at on public.tracker_tasks;
create trigger tracker_tasks_set_updated_at
before update on public.tracker_tasks
for each row execute function public.set_updated_at_timestamp();

drop trigger if exists tracker_task_sort_preferences_set_updated_at on public.tracker_task_sort_preferences;
create trigger tracker_task_sort_preferences_set_updated_at
before update on public.tracker_task_sort_preferences
for each row execute function public.set_updated_at_timestamp();

-- ============================================================================
-- RLS
-- ============================================================================

alter table public.tracker_task_lists enable row level security;
alter table public.tracker_tasks enable row level security;
alter table public.tracker_task_sort_preferences enable row level security;

drop policy if exists "tracker_task_lists_user_owns_row" on public.tracker_task_lists;
create policy "tracker_task_lists_user_owns_row"
  on public.tracker_task_lists
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "tracker_tasks_user_owns_row" on public.tracker_tasks;
create policy "tracker_tasks_user_owns_row"
  on public.tracker_tasks
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "tracker_task_sort_preferences_user_owns_row" on public.tracker_task_sort_preferences;
create policy "tracker_task_sort_preferences_user_owns_row"
  on public.tracker_task_sort_preferences
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
