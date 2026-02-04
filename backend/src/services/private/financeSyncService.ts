import { createClient } from "@supabase/supabase-js";
import { decryptFromBase64 } from "./encryptionService";
import { fetchTransactionsSync } from "./plaidService";

type FinanceItemPublic = {
  id: string;
  user_id: string;
  status: string;
};

type FinanceItemSecrets = {
  id: string;
  item_public_id: string;
  plaid_access_token: string;
  plaid_cursor: string | null;
};

type FinanceAccount = {
  id: string;
  plaid_account_id: string;
};

type TransactionRow = {
  plaid_transaction_id: string;
  reviewed: boolean;
  category_id: string | null;
};

const getSupabaseAdmin = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
};

const normalizeError = (error: unknown) => {
  if (!error) return "Unknown error";
  if (error instanceof Error) return error.message;
  return String(error);
};

const syncItem = async (supabaseAdmin: ReturnType<typeof getSupabaseAdmin>, item: FinanceItemPublic) => {
  try {
    const { data: secrets, error: secretsError } = await supabaseAdmin
      .from("finance_items_secrets")
      .select("id, item_public_id, plaid_access_token, plaid_cursor")
      .eq("item_public_id", item.id)
      .maybeSingle();

    if (secretsError || !secrets) {
      throw new Error(secretsError?.message || "Missing finance item secrets");
    }

    const accessToken = decryptFromBase64(secrets.plaid_access_token);

    let cursor = secrets.plaid_cursor ?? null;
    let hasMore = true;
    const added: any[] = [];
    const modified: any[] = [];
    const removed: { transaction_id: string }[] = [];

    while (hasMore) {
      const sync = await fetchTransactionsSync(accessToken, cursor);
      added.push(...sync.added);
      modified.push(...sync.modified);
      removed.push(...sync.removed);
      cursor = sync.next_cursor;
      hasMore = sync.has_more;
    }

    const { data: accounts, error: accountsError } = await supabaseAdmin
      .from("finance_accounts")
      .select("id, plaid_account_id")
      .eq("user_id", item.user_id)
      .eq("item_id", item.id);

    if (accountsError) {
      throw new Error(accountsError.message);
    }

    const accountMap = new Map<string, FinanceAccount>();
    (accounts ?? []).forEach((acct) => accountMap.set(acct.plaid_account_id, acct));

    const modifiedIds = modified.map((t) => t.transaction_id);
    let existingMap = new Map<string, TransactionRow>();
    if (modifiedIds.length) {
      const { data: existingRows, error: existingError } = await supabaseAdmin
        .from("finance_transactions")
        .select("plaid_transaction_id, reviewed, category_id")
        .eq("user_id", item.user_id)
        .in("plaid_transaction_id", modifiedIds);

      if (existingError) {
        throw new Error(existingError.message);
      }

      (existingRows ?? []).forEach((row) => existingMap.set(row.plaid_transaction_id, row));
    }

    const buildPayload = (t: any, overrides?: Partial<{ reviewed: boolean; category_id: string | null }>) => {
      const account = accountMap.get(t.account_id);
      if (!account) return null;
      return {
        user_id: item.user_id,
        account_id: account.id,
        plaid_transaction_id: t.transaction_id,
        date: t.date,
        authorized_date: t.authorized_date ?? null,
        name: t.name,
        merchant_name: t.merchant_name ?? null,
        amount: t.amount,
        iso_currency_code: t.iso_currency_code ?? null,
        pending: t.pending ?? false,
        reviewed: overrides?.reviewed ?? false,
        category_id: overrides?.category_id ?? null,
        deleted_at: null,
      };
    };

    const addedRows = added
      .map((t) => buildPayload(t, { reviewed: false, category_id: null }))
      .filter(Boolean) as any[];

    const modifiedRows = modified
      .map((t) => {
        const existing = existingMap.get(t.transaction_id);
        return buildPayload(t, {
          reviewed: existing?.reviewed ?? false,
          category_id: existing?.category_id ?? null,
        });
      })
      .filter(Boolean) as any[];

    const upsertRows = [...addedRows, ...modifiedRows];
    if (upsertRows.length) {
      const { error: upsertError } = await supabaseAdmin
        .from("finance_transactions")
        .upsert(upsertRows, { onConflict: "plaid_transaction_id" });

      if (upsertError) {
        throw new Error(upsertError.message);
      }
    }

    if (removed.length) {
      const removedIds = removed.map((r) => r.transaction_id);
      const { error: removedError } = await supabaseAdmin
        .from("finance_transactions")
        .update({ deleted_at: new Date().toISOString() })
        .eq("user_id", item.user_id)
        .in("plaid_transaction_id", removedIds);

      if (removedError) {
        throw new Error(removedError.message);
      }
    }

    const { error: cursorError } = await supabaseAdmin
      .from("finance_items_secrets")
      .update({ plaid_cursor: cursor })
      .eq("id", secrets.id);

    if (cursorError) {
      throw new Error(cursorError.message);
    }

    const { error: publicUpdateError } = await supabaseAdmin
      .from("finance_items_public")
      .update({
        last_synced_at: new Date().toISOString(),
        last_error: null,
        status: "active",
      })
      .eq("id", item.id);

    if (publicUpdateError) {
      throw new Error(publicUpdateError.message);
    }

    return { ok: true, itemId: item.id };
  } catch (error) {
    const message = normalizeError(error);
    console.error("Finance sync failed", { itemId: item.id, message });

    await supabaseAdmin
      .from("finance_items_public")
      .update({
        status: "error",
        last_error: message,
      })
      .eq("id", item.id);

    return { ok: false, itemId: item.id, error: message };
  }
};

export const syncUserFinance = async (userId: string) => {
  const supabaseAdmin = getSupabaseAdmin();
  const { data: items, error } = await supabaseAdmin
    .from("finance_items_public")
    .select("id, user_id, status")
    .eq("user_id", userId)
    .eq("status", "active");

  if (error) {
    throw new Error(error.message);
  }

  const results = [] as Array<{ ok: boolean; itemId: string; error?: string }>;
  for (const item of items ?? []) {
    results.push(await syncItem(supabaseAdmin, item));
  }

  return results;
};

export const syncAllFinance = async () => {
  const supabaseAdmin = getSupabaseAdmin();
  const { data: items, error } = await supabaseAdmin
    .from("finance_items_public")
    .select("id, user_id, status")
    .eq("status", "active");

  if (error) {
    throw new Error(error.message);
  }

  const results = [] as Array<{ ok: boolean; itemId: string; error?: string }>;
  for (const item of items ?? []) {
    results.push(await syncItem(supabaseAdmin, item));
  }

  return results;
};
