# Finance DB Setup (Phases A-D)

This phase adds the minimal database schema + RLS policies for the Finance Tracker.

## Prereqs
- A Supabase project (Postgres)
- Access to the Supabase **SQL Editor**

## Apply Schema
1. Open Supabase Dashboard → **SQL Editor**.
2. Create a new query.
3. Paste and run `backend/sql/finance_schema.sql`.

Notes:
- The schema uses UUID primary keys with `gen_random_uuid()` and enables `pgcrypto` if needed.

## Apply RLS
1. Create a second query.
2. Paste and run `backend/sql/finance_rls.sql`.

Notes:
- RLS is enabled for all finance tables.
- `finance_items_secrets` intentionally has **no policies**; the client should never be able to access it.

## Expected Tables
After running both scripts, you should see these tables under the `public` schema:
- `finance_items_public`
- `finance_items_secrets`
- `finance_accounts`
- `finance_categories`
- `finance_transactions`

## Quick Sanity Checks
- Verify constraints exist:
  - `finance_categories`: unique `(user_id, name)`
  - `finance_items_secrets`: unique `plaid_item_id`
  - `finance_accounts`: unique `plaid_account_id`
  - `finance_transactions`: unique `plaid_transaction_id`
- Verify indexes exist:
  - Partial inbox index on `finance_transactions(user_id, date desc)` where `reviewed=false` and `deleted_at is null`
  - History index on `finance_transactions(user_id, date desc)`
- Verify RLS:
  - For `finance_items_public`, `finance_accounts`, `finance_categories`, `finance_transactions`: authenticated user can only access rows where `user_id = auth.uid()`.
  - For `finance_items_secrets`: RLS enabled and **no policies**.

## Phase D Migration (Frontend MVP)

If you already have the Phase A-C schema applied, run the Phase D migration to add new columns:

1. Open Supabase Dashboard → **SQL Editor**.
2. Create a new query.
3. Paste and run `backend/sql/finance_schema_migration_d.sql`.

This adds:
- `finance_categories.icon` (text, default '📦')
- `finance_categories.sort_order` (integer, default 0)
- `finance_transactions.reviewed_at` (timestamptz, nullable)

If you're setting up fresh, these columns are already in `finance_schema.sql`.
