-- Finance Tracker Phase A (database only)
-- Minimal schema for Plaid-backed items/accounts/transactions with strict RLS in a separate file.

-- UUID generation
create extension if not exists pgcrypto;

-- 1) Plaid item metadata that is safe for client access (RLS-protected by user_id)
create table if not exists public.finance_items_public (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  provider text not null default 'plaid',
  institution_name text,
  status text not null default 'active',
  last_synced_at timestamptz,
  last_error text,

  created_at timestamptz not null default now()
);

-- 2) Plaid item secrets (NO client policies; intended for service-role only)
create table if not exists public.finance_items_secrets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_public_id uuid not null unique references public.finance_items_public(id) on delete cascade,

  plaid_item_id text not null,
  plaid_access_token text not null,
  plaid_cursor text,

  created_at timestamptz not null default now(),

  constraint finance_items_secrets_plaid_item_id_unique unique (plaid_item_id)
);

-- 3) Accounts (safe-ish metadata; RLS-protected by user_id)
create table if not exists public.finance_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.finance_items_public(id) on delete cascade,

  plaid_account_id text not null,
  name text not null,
  mask text,
  type text,
  subtype text,
  iso_currency_code text,

  created_at timestamptz not null default now(),

  constraint finance_accounts_plaid_account_id_unique unique (plaid_account_id)
);

-- 4) User-defined categories (RLS-protected by user_id)
create table if not exists public.finance_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  name text not null,
  icon text not null default '📦',
  sort_order integer not null default 0,

  created_at timestamptz not null default now(),

  constraint finance_categories_user_id_name_unique unique (user_id, name)
);

-- 5) Transactions (RLS-protected by user_id)
create table if not exists public.finance_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.finance_accounts(id) on delete cascade,

  plaid_transaction_id text not null,

  date date not null,
  authorized_date date,

  name text not null,
  merchant_name text,

  amount numeric(12, 2) not null,
  iso_currency_code text,
  pending boolean not null default false,

  category_id uuid references public.finance_categories(id),

  reviewed boolean not null default false,
  reviewed_at timestamptz,
  deleted_at timestamptz,

  created_at timestamptz not null default now(),

  constraint finance_transactions_plaid_transaction_id_unique unique (plaid_transaction_id)
);

-- Minimal indexes
-- Inbox: unreviewed + not deleted, newest first
create index if not exists finance_transactions_inbox_idx
  on public.finance_transactions (user_id, date desc)
  where reviewed = false and deleted_at is null;

-- History: all transactions, newest first
create index if not exists finance_transactions_history_idx
  on public.finance_transactions (user_id, date desc);
