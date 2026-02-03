// Finance module types

export type FinanceTab = "inbox" | "month" | "history" | "accounts";

export interface FinanceItem {
  id: string;
  user_id: string;
  provider: string;
  institution_name: string | null;
  status: string;
  last_synced_at: string | null;
  last_error: string | null;
  created_at: string;
}

export interface FinanceAccount {
  id: string;
  user_id: string;
  item_id: string;
  plaid_account_id: string;
  name: string;
  mask: string | null;
  type: string | null;
  subtype: string | null;
  iso_currency_code: string | null;
  created_at: string;
}

export interface FinanceCategory {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  sort_order: number;
  created_at: string;
}

export interface FinanceTransaction {
  id: string;
  user_id: string;
  account_id: string;
  plaid_transaction_id: string;
  date: string;
  authorized_date: string | null;
  name: string;
  merchant_name: string | null;
  amount: number;
  iso_currency_code: string | null;
  pending: boolean;
  category_id: string | null;
  reviewed: boolean;
  reviewed_at: string | null;
  deleted_at: string | null;
  created_at: string;
}

export interface CategoryTotal {
  category: FinanceCategory | null;
  total: number;
  count: number;
}

export interface HistoryFilters {
  startDate: string;
  endDate: string;
  categoryId: string | null;
  merchantSearch: string;
}

export const DEFAULT_CATEGORIES: Array<{ name: string; icon: string; sort_order: number }> = [
  { name: "Food & Dining", icon: "🍽️", sort_order: 0 },
  { name: "Transportation", icon: "🚗", sort_order: 1 },
  { name: "Shopping", icon: "🛍️", sort_order: 2 },
  { name: "Entertainment", icon: "🎬", sort_order: 3 },
  { name: "Bills & Utilities", icon: "💡", sort_order: 4 },
  { name: "Health & Fitness", icon: "💪", sort_order: 5 },
  { name: "Travel", icon: "✈️", sort_order: 6 },
  { name: "Education", icon: "📚", sort_order: 7 },
  { name: "Subscriptions", icon: "📱", sort_order: 8 },
  { name: "Income", icon: "💰", sort_order: 9 },
  { name: "Transfer", icon: "🔄", sort_order: 10 },
  { name: "Other", icon: "📦", sort_order: 11 },
];
