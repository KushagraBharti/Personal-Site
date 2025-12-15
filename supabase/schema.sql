-- Supabase schema for private tracker
create extension if not exists "pgcrypto";

create table if not exists weekly_task_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  category text not null,
  text text not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists weekly_task_status (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  week_start date not null,
  task_id uuid not null references weekly_task_templates(id) on delete cascade,
  completed boolean not null default false,
  proof_url text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start, task_id)
);

create table if not exists weekly_snapshots (
  user_id uuid not null references auth.users(id),
  week_start date not null,
  build_milestone text,
  best_demo_hook_url text,
  best_demo_walkthrough_url text,
  paid_work_progress text,
  traction_progress text,
  next_week_focus text,
  created_at timestamptz not null default now(),
  primary key (user_id, week_start)
);

create table if not exists pipeline_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  type text not null check (type in ('paid_work', 'relationship', 'traction')),
  name text not null,
  stage text,
  last_touch date,
  next_action text,
  next_action_date date,
  links jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists proof_vault_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  title text not null,
  url text not null,
  tag text,
  pinned boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists evidence_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  date date not null,
  type text not null,
  link text not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists mobility_routes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  route_name text not null,
  is_primary boolean not null default false,
  status text,
  next_missing_item text,
  next_action_date date,
  notes text,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_weekly_task_templates_user on weekly_task_templates (user_id, category, sort_order);
create index if not exists idx_weekly_task_status_week on weekly_task_status (user_id, week_start);
create index if not exists idx_pipeline_items_next_action on pipeline_items (user_id, next_action_date);
create index if not exists idx_proof_vault_pinned on proof_vault_items (user_id, pinned, sort_order);
create index if not exists idx_evidence_log_user_date on evidence_log (user_id, date desc);
create index if not exists idx_mobility_routes_user on mobility_routes (user_id, is_primary desc);

-- Row Level Security
alter table weekly_task_templates enable row level security;
alter table weekly_task_status enable row level security;
alter table weekly_snapshots enable row level security;
alter table pipeline_items enable row level security;
alter table proof_vault_items enable row level security;
alter table evidence_log enable row level security;
alter table mobility_routes enable row level security;

create policy "Select own templates" on weekly_task_templates for select using (auth.uid() = user_id);
create policy "Insert own templates" on weekly_task_templates for insert with check (auth.uid() = user_id);
create policy "Update own templates" on weekly_task_templates for update using (auth.uid() = user_id);
create policy "Delete own templates" on weekly_task_templates for delete using (auth.uid() = user_id);

create policy "Select own status" on weekly_task_status for select using (auth.uid() = user_id);
create policy "Insert own status" on weekly_task_status for insert with check (auth.uid() = user_id);
create policy "Update own status" on weekly_task_status for update using (auth.uid() = user_id);
create policy "Delete own status" on weekly_task_status for delete using (auth.uid() = user_id);

create policy "Select own snapshots" on weekly_snapshots for select using (auth.uid() = user_id);
create policy "Insert own snapshots" on weekly_snapshots for insert with check (auth.uid() = user_id);
create policy "Update own snapshots" on weekly_snapshots for update using (auth.uid() = user_id);
create policy "Delete own snapshots" on weekly_snapshots for delete using (auth.uid() = user_id);

create policy "Select own pipeline" on pipeline_items for select using (auth.uid() = user_id);
create policy "Insert own pipeline" on pipeline_items for insert with check (auth.uid() = user_id);
create policy "Update own pipeline" on pipeline_items for update using (auth.uid() = user_id);
create policy "Delete own pipeline" on pipeline_items for delete using (auth.uid() = user_id);

create policy "Select own proof" on proof_vault_items for select using (auth.uid() = user_id);
create policy "Insert own proof" on proof_vault_items for insert with check (auth.uid() = user_id);
create policy "Update own proof" on proof_vault_items for update using (auth.uid() = user_id);
create policy "Delete own proof" on proof_vault_items for delete using (auth.uid() = user_id);

create policy "Select own evidence" on evidence_log for select using (auth.uid() = user_id);
create policy "Insert own evidence" on evidence_log for insert with check (auth.uid() = user_id);
create policy "Update own evidence" on evidence_log for update using (auth.uid() = user_id);
create policy "Delete own evidence" on evidence_log for delete using (auth.uid() = user_id);

create policy "Select own mobility" on mobility_routes for select using (auth.uid() = user_id);
create policy "Insert own mobility" on mobility_routes for insert with check (auth.uid() = user_id);
create policy "Update own mobility" on mobility_routes for update using (auth.uid() = user_id);
create policy "Delete own mobility" on mobility_routes for delete using (auth.uid() = user_id);
