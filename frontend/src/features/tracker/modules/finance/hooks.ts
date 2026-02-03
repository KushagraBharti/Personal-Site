import { useCallback, useEffect, useState } from "react";
import { useTrackerContext } from "../../shared/hooks/useTrackerContext";
import {
  FinanceTab,
  FinanceItem,
  FinanceAccount,
  FinanceCategory,
  FinanceTransaction,
  HistoryFilters,
  CategoryTotal,
} from "./types";
import {
  ensureCategories,
  fetchFinanceItems,
  fetchAccounts,
  fetchInboxTransactions,
  fetchMonthTransactions,
  fetchHistoryTransactions,
  categorizeTransaction,
  uncategorizeTransaction,
  createPlaidLinkToken,
  exchangePlaidToken,
  triggerSync,
} from "./api";

export const useFinanceModule = () => {
  const { supabase, userId, session, startLoading, stopLoading } = useTrackerContext();

  // Core state
  const [activeTab, setActiveTab] = useState<FinanceTab>("inbox");
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [financeItems, setFinanceItems] = useState<FinanceItem[]>([]);
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Inbox state
  const [inboxTransactions, setInboxTransactions] = useState<FinanceTransaction[]>([]);
  const [inboxLoading, setInboxLoading] = useState(false);

  // Month state
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1);
  const [monthTransactions, setMonthTransactions] = useState<FinanceTransaction[]>([]);
  const [monthLoading, setMonthLoading] = useState(false);

  // History state
  const [historyFilters, setHistoryFilters] = useState<HistoryFilters>(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      startDate: start.toISOString().split("T")[0],
      endDate: now.toISOString().split("T")[0],
      categoryId: null,
      merchantSearch: "",
    };
  });
  const [historyTransactions, setHistoryTransactions] = useState<FinanceTransaction[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ============================================================================
  // Initial Load
  // ============================================================================

  const loadCoreData = useCallback(async () => {
    if (!supabase || !userId) return;
    startLoading();
    setError(null);
    try {
      const [cats, items, accts] = await Promise.all([
        ensureCategories(supabase, userId),
        fetchFinanceItems(supabase, userId),
        fetchAccounts(supabase, userId),
      ]);
      setCategories(cats);
      setFinanceItems(items);
      setAccounts(accts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load finance data");
    } finally {
      stopLoading();
    }
  }, [supabase, userId, startLoading, stopLoading]);

  useEffect(() => {
    loadCoreData();
  }, [loadCoreData]);

  // ============================================================================
  // Inbox
  // ============================================================================

  const loadInbox = useCallback(async () => {
    if (!supabase || !userId) return;
    setInboxLoading(true);
    try {
      const txns = await fetchInboxTransactions(supabase, userId);
      setInboxTransactions(txns);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load inbox");
    } finally {
      setInboxLoading(false);
    }
  }, [supabase, userId]);

  useEffect(() => {
    if (activeTab === "inbox") {
      loadInbox();
    }
  }, [activeTab, loadInbox]);

  const handleCategorize = useCallback(
    async (transactionId: string, categoryId: string) => {
      if (!supabase) return;
      // Optimistic update
      const removed = inboxTransactions.find((t) => t.id === transactionId);
      setInboxTransactions((prev) => prev.filter((t) => t.id !== transactionId));

      try {
        await categorizeTransaction(supabase, transactionId, categoryId);
      } catch (err) {
        // Rollback
        if (removed) {
          setInboxTransactions((prev) => [removed, ...prev]);
        }
        setError(err instanceof Error ? err.message : "Failed to categorize");
      }
    },
    [supabase, inboxTransactions]
  );

  // ============================================================================
  // Month
  // ============================================================================

  const loadMonth = useCallback(async () => {
    if (!supabase || !userId) return;
    setMonthLoading(true);
    try {
      const txns = await fetchMonthTransactions(supabase, userId, selectedYear, selectedMonth);
      setMonthTransactions(txns);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load month data");
    } finally {
      setMonthLoading(false);
    }
  }, [supabase, userId, selectedYear, selectedMonth]);

  useEffect(() => {
    if (activeTab === "month") {
      loadMonth();
    }
  }, [activeTab, loadMonth]);

  const monthTotals = useCallback((): CategoryTotal[] => {
    const totalsMap = new Map<string | null, { total: number; count: number }>();

    for (const txn of monthTransactions) {
      const key = txn.category_id;
      const existing = totalsMap.get(key) ?? { total: 0, count: 0 };
      existing.total += txn.amount;
      existing.count += 1;
      totalsMap.set(key, existing);
    }

    const result: CategoryTotal[] = [];
    for (const [catId, data] of totalsMap) {
      const category = categories.find((c) => c.id === catId) ?? null;
      result.push({ category, ...data });
    }

    return result.sort((a, b) => b.total - a.total);
  }, [monthTransactions, categories]);

  // ============================================================================
  // History
  // ============================================================================

  const loadHistory = useCallback(async () => {
    if (!supabase || !userId) return;
    setHistoryLoading(true);
    try {
      const txns = await fetchHistoryTransactions(supabase, userId, {
        startDate: historyFilters.startDate || undefined,
        endDate: historyFilters.endDate || undefined,
        categoryId: historyFilters.categoryId,
        merchantSearch: historyFilters.merchantSearch || undefined,
      });
      setHistoryTransactions(txns);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setHistoryLoading(false);
    }
  }, [supabase, userId, historyFilters]);

  useEffect(() => {
    if (activeTab === "history") {
      loadHistory();
    }
  }, [activeTab, loadHistory]);

  const handleUncategorize = useCallback(
    async (transactionId: string) => {
      if (!supabase) return;
      try {
        await uncategorizeTransaction(supabase, transactionId);
        // Refresh data
        if (activeTab === "history") {
          loadHistory();
        } else if (activeTab === "month") {
          loadMonth();
        }
        loadInbox();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to uncategorize");
      }
    },
    [supabase, activeTab, loadHistory, loadMonth, loadInbox]
  );

  // ============================================================================
  // Sync
  // ============================================================================

  const handleSyncNow = useCallback(async () => {
    if (!session?.access_token) {
      setError("No active session");
      return;
    }

    setSyncing(true);
    setError(null);

    try {
      await triggerSync(session.access_token);
      await loadCoreData();
      // Refresh current tab data
      if (activeTab === "inbox") loadInbox();
      if (activeTab === "month") loadMonth();
      if (activeTab === "history") loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync");
    } finally {
      setSyncing(false);
    }
  }, [session, loadCoreData, activeTab, loadInbox, loadMonth, loadHistory]);

  // ============================================================================
  // Plaid Link
  // ============================================================================

  const handleConnectBank = useCallback(async () => {
    if (!session?.access_token) {
      setError("No active session");
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      const { link_token } = await createPlaidLinkToken(session.access_token);

      // Dynamically load Plaid Link
      const Plaid = (window as unknown as { Plaid?: { create: (config: PlaidLinkConfig) => PlaidLinkHandler } }).Plaid;
      if (!Plaid) {
        throw new Error("Plaid Link SDK not loaded. Add the script to your HTML.");
      }

      const handler = Plaid.create({
        token: link_token,
        onSuccess: async (publicToken: string) => {
          try {
            await exchangePlaidToken(session.access_token, publicToken);
            await loadCoreData();
            // Optionally trigger sync after connecting
            handleSyncNow();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to connect bank");
          }
        },
        onExit: (err: PlaidLinkError | null) => {
          if (err) {
            console.error("Plaid Link exit error:", err);
          }
          setConnecting(false);
        },
      });

      handler.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start bank connection");
      setConnecting(false);
    }
  }, [session, loadCoreData, handleSyncNow]);

  // ============================================================================
  // Helpers
  // ============================================================================

  const getCategoryById = useCallback(
    (id: string | null): FinanceCategory | null => {
      if (!id) return null;
      return categories.find((c) => c.id === id) ?? null;
    },
    [categories]
  );

  const hasConnectedBanks = financeItems.length > 0;
  const inboxCount = inboxTransactions.length;

  return {
    // Tab state
    activeTab,
    setActiveTab,

    // Core data
    categories,
    financeItems,
    accounts,
    error,
    setError,

    // Connection
    hasConnectedBanks,
    connecting,
    handleConnectBank,

    // Sync
    syncing,
    handleSyncNow,

    // Inbox
    inboxTransactions,
    inboxLoading,
    inboxCount,
    handleCategorize,
    loadInbox,

    // Month
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    monthTransactions,
    monthLoading,
    monthTotals,

    // History
    historyFilters,
    setHistoryFilters,
    historyTransactions,
    historyLoading,
    loadHistory,
    handleUncategorize,

    // Helpers
    getCategoryById,
  };
};

// Plaid Link types (minimal)
interface PlaidLinkConfig {
  token: string;
  onSuccess: (publicToken: string, metadata: unknown) => void;
  onExit: (err: PlaidLinkError | null, metadata: unknown) => void;
}

interface PlaidLinkHandler {
  open: () => void;
  exit: () => void;
}

interface PlaidLinkError {
  error_code: string;
  error_message: string;
  display_message: string | null;
}
