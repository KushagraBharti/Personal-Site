-- Finance Tracker Phase D Migration
-- Run this if you already have the Phase A-C schema and need to add new columns.

-- Add icon and sort_order to finance_categories
alter table public.finance_categories
  add column if not exists icon text not null default '📦',
  add column if not exists sort_order integer not null default 0;

-- Add reviewed_at to finance_transactions
alter table public.finance_transactions
  add column if not exists reviewed_at timestamptz;
