-- Finance Tracker Phase A (database only)
-- Row Level Security policies for client-accessible finance tables.

alter table public.finance_items_public enable row level security;
alter table public.finance_items_secrets enable row level security;
alter table public.finance_accounts enable row level security;
alter table public.finance_categories enable row level security;
alter table public.finance_transactions enable row level security;

-- Client-accessible tables: user can only read/write their own rows.
create policy "finance_items_public_user_owns_row"
  on public.finance_items_public
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "finance_accounts_user_owns_row"
  on public.finance_accounts
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "finance_categories_user_owns_row"
  on public.finance_categories
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "finance_transactions_user_owns_row"
  on public.finance_transactions
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Secrets table intentionally has NO policies.
-- Only the Supabase service role (or other privileged server code) should access it.
