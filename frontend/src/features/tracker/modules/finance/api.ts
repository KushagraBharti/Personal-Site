import { SupabaseClient } from "@supabase/supabase-js";
import {
  FinanceCategory,
  FinanceItem,
  FinanceAccount,
  FinanceTransaction,
  DEFAULT_CATEGORIES,
} from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

// ============================================================================
// Categories
// ============================================================================

export const fetchCategories = async (
  supabase: SupabaseClient,
  userId: string
): Promise<FinanceCategory[]> => {
  const { data, error } = await supabase
    .from("finance_categories")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
};

export const insertDefaultCategories = async (
  supabase: SupabaseClient,
  userId: string
): Promise<FinanceCategory[]> => {
  const rows = DEFAULT_CATEGORIES.map((cat) => ({
    user_id: userId,
    name: cat.name,
    icon: cat.icon,
    sort_order: cat.sort_order,
  }));

  const { data, error } = await supabase
    .from("finance_categories")
    .insert(rows)
    .select();

  if (error) throw new Error(error.message);
  return data ?? [];
};

export const ensureCategories = async (
  supabase: SupabaseClient,
  userId: string
): Promise<FinanceCategory[]> => {
  const existing = await fetchCategories(supabase, userId);
  if (existing.length > 0) return existing;
  return insertDefaultCategories(supabase, userId);
};

// ============================================================================
// Finance Items (Connected Institutions)
// ============================================================================

export const fetchFinanceItems = async (
  supabase: SupabaseClient,
  userId: string
): Promise<FinanceItem[]> => {
  const { data, error } = await supabase
    .from("finance_items_public")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
};

// ============================================================================
// Accounts
// ============================================================================

export const fetchAccounts = async (
  supabase: SupabaseClient,
  userId: string
): Promise<FinanceAccount[]> => {
  const { data, error } = await supabase
    .from("finance_accounts")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
};

// ============================================================================
// Transactions
// ============================================================================

export const fetchInboxTransactions = async (
  supabase: SupabaseClient,
  userId: string
): Promise<FinanceTransaction[]> => {
  const { data, error } = await supabase
    .from("finance_transactions")
    .select("*")
    .eq("user_id", userId)
    .eq("reviewed", false)
    .is("deleted_at", null)
    .order("date", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
};

export const fetchMonthTransactions = async (
  supabase: SupabaseClient,
  userId: string,
  year: number,
  month: number
): Promise<FinanceTransaction[]> => {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = new Date(year, month, 0).toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("finance_transactions")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
};

export const fetchHistoryTransactions = async (
  supabase: SupabaseClient,
  userId: string,
  filters: {
    startDate?: string;
    endDate?: string;
    categoryId?: string | null;
    merchantSearch?: string;
  }
): Promise<FinanceTransaction[]> => {
  let query = supabase
    .from("finance_transactions")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null);

  if (filters.startDate) {
    query = query.gte("date", filters.startDate);
  }
  if (filters.endDate) {
    query = query.lte("date", filters.endDate);
  }
  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }
  if (filters.merchantSearch) {
    query = query.or(
      `name.ilike.%${filters.merchantSearch}%,merchant_name.ilike.%${filters.merchantSearch}%`
    );
  }

  const { data, error } = await query.order("date", { ascending: false }).limit(500);

  if (error) throw new Error(error.message);
  return data ?? [];
};

export const categorizeTransaction = async (
  supabase: SupabaseClient,
  transactionId: string,
  categoryId: string
): Promise<void> => {
  const { error } = await supabase
    .from("finance_transactions")
    .update({
      category_id: categoryId,
      reviewed: true,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", transactionId);

  if (error) throw new Error(error.message);
};

export const uncategorizeTransaction = async (
  supabase: SupabaseClient,
  transactionId: string
): Promise<void> => {
  const { error } = await supabase
    .from("finance_transactions")
    .update({
      category_id: null,
      reviewed: false,
      reviewed_at: null,
    })
    .eq("id", transactionId);

  if (error) throw new Error(error.message);
};

// ============================================================================
// Backend API Calls (Plaid Integration)
// ============================================================================

const getAuthHeaders = (accessToken: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${accessToken}`,
});

export const createPlaidLinkToken = async (
  accessToken: string
): Promise<{ link_token: string }> => {
  const res = await fetch(`${API_BASE}/api/private/finance/plaid/link-token`, {
    method: "POST",
    headers: getAuthHeaders(accessToken),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to create link token");
  }

  return res.json();
};

export const exchangePlaidToken = async (
  accessToken: string,
  publicToken: string
): Promise<{ ok: boolean; institution_name: string; accounts_count: number }> => {
  const res = await fetch(`${API_BASE}/api/private/finance/plaid/exchange-token`, {
    method: "POST",
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify({ public_token: publicToken }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to exchange token");
  }

  return res.json();
};

export const triggerSync = async (
  accessToken: string
): Promise<{ ok: boolean; results: Array<{ ok: boolean; itemId: string; error?: string }> }> => {
  const res = await fetch(`${API_BASE}/api/private/finance/sync`, {
    method: "POST",
    headers: getAuthHeaders(accessToken),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to sync");
  }

  return res.json();
};
