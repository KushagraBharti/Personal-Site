import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "../../../../../components/ui/GlassCard";
import GlassButton from "../../../../../components/ui/GlassButton";
import { inputBase, sectionTitle } from "../../../shared/styles";
import { useFinanceModule } from "../hooks";
import { FinanceTab, FinanceCategory, FinanceTransaction } from "../types";

// ============================================================================
// Tab Configuration
// ============================================================================

const TABS: { id: FinanceTab; label: string; icon: string }[] = [
  { id: "inbox", label: "Inbox", icon: "inbox" },
  { id: "month", label: "Month", icon: "calendar" },
  { id: "history", label: "History", icon: "clock" },
  { id: "accounts", label: "Accounts", icon: "bank" },
];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ============================================================================
// Helper Components
// ============================================================================

const TabIcon: React.FC<{ name: string; className?: string }> = ({ name, className = "" }) => {
  const icons: Record<string, JSX.Element> = {
    inbox: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-17.5 0v5.25A2.25 2.25 0 004.5 21h15a2.25 2.25 0 002.25-2.25v-5.25m-17.5 0V6.75A2.25 2.25 0 014.5 4.5h15a2.25 2.25 0 012.25 2.25v6.75" />
      </svg>
    ),
    calendar: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
    clock: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bank: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" />
      </svg>
    ),
  };
  return icons[name] ?? null;
};

const formatAmount = (amount: number, currency?: string | null): string => {
  const absAmount = Math.abs(amount);
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(absAmount);
  return amount < 0 ? `-${formatted}` : formatted;
};

const CategoryChip: React.FC<{
  category: FinanceCategory;
  onClick?: () => void;
  selected?: boolean;
  compact?: boolean;
}> = ({ category, onClick, selected = false, compact = false }) => (
  <button
    onClick={onClick}
    className={`
      inline-flex items-center gap-1.5 rounded-full transition-all duration-200
      ${compact ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm"}
      ${selected
        ? "bg-white/30 text-white ring-1 ring-white/40"
        : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
      }
    `}
  >
    <span>{category.icon}</span>
    <span className="font-medium">{category.name}</span>
  </button>
);

const TransactionRow: React.FC<{
  transaction: FinanceTransaction;
  category: FinanceCategory | null;
  categories: FinanceCategory[];
  onCategorize?: (categoryId: string) => void;
  onUncategorize?: () => void;
  showCategory?: boolean;
}> = ({ transaction, category, categories, onCategorize, onUncategorize, showCategory = false }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="group rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm transition-colors hover:bg-white/8"
    >
      <div
        className="flex cursor-pointer items-center gap-4 p-4"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Date */}
        <div className="w-14 shrink-0 text-center">
          <p className="text-xs font-medium text-white/50 uppercase">
            {new Date(transaction.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" })}
          </p>
          <p className="text-lg font-semibold text-white">
            {new Date(transaction.date + "T00:00:00").getDate()}
          </p>
        </div>

        {/* Details */}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-white">
            {transaction.merchant_name || transaction.name}
          </p>
          <p className="truncate text-sm text-white/50">
            {transaction.merchant_name ? transaction.name : ""}
          </p>
        </div>

        {/* Category Badge (if showing) */}
        {showCategory && category && (
          <div className="hidden sm:block">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-xs text-white/70">
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </span>
          </div>
        )}

        {/* Amount */}
        <div className="text-right">
          <p className={`text-lg font-semibold tabular-nums ${transaction.amount > 0 ? "text-emerald-400" : "text-white"}`}>
            {formatAmount(transaction.amount, transaction.iso_currency_code)}
          </p>
          {transaction.pending && (
            <p className="text-xs text-amber-400/80">Pending</p>
          )}
        </div>

        {/* Expand indicator */}
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          className="text-white/40"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </div>

      {/* Expanded content with category chips */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/10 p-4">
              {onCategorize && (
                <>
                  <p className="mb-3 text-sm font-medium text-white/70">Categorize as:</p>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <CategoryChip
                        key={cat.id}
                        category={cat}
                        compact
                        onClick={() => onCategorize(cat.id)}
                      />
                    ))}
                  </div>
                </>
              )}
              {onUncategorize && category && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white/50">Category:</span>
                    <span className="inline-flex items-center gap-1 text-white">
                      <span>{category.icon}</span>
                      <span>{category.name}</span>
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUncategorize();
                    }}
                    className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/20 hover:text-white"
                  >
                    Move to Inbox
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ============================================================================
// Tab Views
// ============================================================================

const InboxView: React.FC<{
  transactions: FinanceTransaction[];
  categories: FinanceCategory[];
  loading: boolean;
  onCategorize: (transactionId: string, categoryId: string) => void;
}> = ({ transactions, categories, loading, onCategorize }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="mb-4 text-5xl">✓</div>
        <h3 className="text-xl font-medium text-white">Inbox Zero</h3>
        <p className="mt-2 text-white/60">All transactions have been categorized</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-white/60">
        {transactions.length} transaction{transactions.length !== 1 ? "s" : ""} to review
      </p>
      <AnimatePresence mode="popLayout">
        {transactions.map((txn) => (
          <TransactionRow
            key={txn.id}
            transaction={txn}
            category={null}
            categories={categories}
            onCategorize={(categoryId) => onCategorize(txn.id, categoryId)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

const MonthView: React.FC<{
  transactions: FinanceTransaction[];
  categories: FinanceCategory[];
  totals: Array<{ category: FinanceCategory | null; total: number; count: number }>;
  selectedYear: number;
  selectedMonth: number;
  setSelectedYear: (y: number) => void;
  setSelectedMonth: (m: number) => void;
  loading: boolean;
  getCategoryById: (id: string | null) => FinanceCategory | null;
  onUncategorize: (transactionId: string) => void;
}> = ({
  transactions,
  categories,
  totals,
  selectedYear,
  selectedMonth,
  setSelectedYear,
  setSelectedMonth,
  loading,
  getCategoryById,
  onUncategorize,
}) => {
  const [showTransactions, setShowTransactions] = useState(false);

  const grandTotal = useMemo(() => {
    return totals.reduce((sum, t) => sum + t.total, 0);
  }, [totals]);

  const expenses = useMemo(() => {
    return totals.filter((t) => t.total > 0).reduce((sum, t) => sum + t.total, 0);
  }, [totals]);

  const income = useMemo(() => {
    return totals.filter((t) => t.total < 0).reduce((sum, t) => sum + Math.abs(t.total), 0);
  }, [totals]);

  return (
    <div className="space-y-6">
      {/* Month Picker */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          className={`${inputBase} w-auto`}
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
        >
          {MONTH_NAMES.map((name, idx) => (
            <option key={idx} value={idx + 1}>{name}</option>
          ))}
        </select>
        <select
          className={`${inputBase} w-auto`}
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
        >
          {[2024, 2025, 2026, 2027].map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-4">
              <p className="text-sm text-white/60">Expenses</p>
              <p className="mt-1 text-2xl font-bold text-white">{formatAmount(expenses)}</p>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-4">
              <p className="text-sm text-emerald-400/80">Income</p>
              <p className="mt-1 text-2xl font-bold text-emerald-400">{formatAmount(income)}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-4">
              <p className="text-sm text-white/60">Net</p>
              <p className={`mt-1 text-2xl font-bold ${grandTotal > 0 ? "text-red-400" : "text-emerald-400"}`}>
                {formatAmount(Math.abs(income - expenses))}
              </p>
            </div>
          </div>

          {/* Category Breakdown */}
          <div>
            <h4 className="mb-4 text-lg font-medium text-white">By Category</h4>
            <div className="space-y-2">
              {totals.map((item, idx) => {
                const pct = expenses > 0 && item.total > 0 ? (item.total / expenses) * 100 : 0;
                return (
                  <div key={idx} className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{item.category?.icon || "📦"}</span>
                        <span className="font-medium text-white">
                          {item.category?.name || "Uncategorized"}
                        </span>
                        <span className="text-xs text-white/50">({item.count})</span>
                      </div>
                      <span className={`font-semibold tabular-nums ${item.total < 0 ? "text-emerald-400" : "text-white"}`}>
                        {formatAmount(item.total)}
                      </span>
                    </div>
                    {item.total > 0 && (
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className="h-full rounded-full bg-gradient-to-r from-blue-400 to-purple-400"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Transaction List Toggle */}
          <div>
            <button
              onClick={() => setShowTransactions(!showTransactions)}
              className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition"
            >
              <motion.span animate={{ rotate: showTransactions ? 90 : 0 }}>→</motion.span>
              {showTransactions ? "Hide" : "Show"} all {transactions.length} transactions
            </button>

            <AnimatePresence>
              {showTransactions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-4 space-y-2 overflow-hidden"
                >
                  {transactions.map((txn) => (
                    <TransactionRow
                      key={txn.id}
                      transaction={txn}
                      category={getCategoryById(txn.category_id)}
                      categories={categories}
                      showCategory
                      onUncategorize={() => onUncategorize(txn.id)}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
};

const HistoryView: React.FC<{
  transactions: FinanceTransaction[];
  categories: FinanceCategory[];
  filters: {
    startDate: string;
    endDate: string;
    categoryId: string | null;
    merchantSearch: string;
  };
  setFilters: React.Dispatch<React.SetStateAction<{
    startDate: string;
    endDate: string;
    categoryId: string | null;
    merchantSearch: string;
  }>>;
  loading: boolean;
  getCategoryById: (id: string | null) => FinanceCategory | null;
  onSearch: () => void;
  onUncategorize: (transactionId: string) => void;
}> = ({ transactions, categories, filters, setFilters, loading, getCategoryById, onSearch, onUncategorize }) => {
  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs text-white/60">Start Date</label>
          <input
            type="date"
            className={inputBase}
            value={filters.startDate}
            onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/60">End Date</label>
          <input
            type="date"
            className={inputBase}
            value={filters.endDate}
            onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/60">Category</label>
          <select
            className={inputBase}
            value={filters.categoryId || ""}
            onChange={(e) => setFilters((f) => ({ ...f, categoryId: e.target.value || null }))}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/60">Search Merchant</label>
          <input
            type="text"
            className={inputBase}
            placeholder="Search..."
            value={filters.merchantSearch}
            onChange={(e) => setFilters((f) => ({ ...f, merchantSearch: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
          />
        </div>
      </div>

      <GlassButton onClick={onSearch} className="px-6 py-2">
        Search
      </GlassButton>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
        </div>
      ) : transactions.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-white/60">No transactions found matching your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-white/60">{transactions.length} transaction{transactions.length !== 1 ? "s" : ""}</p>
          {transactions.map((txn) => (
            <TransactionRow
              key={txn.id}
              transaction={txn}
              category={getCategoryById(txn.category_id)}
              categories={categories}
              showCategory
              onUncategorize={() => onUncategorize(txn.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const AccountsView: React.FC<{
  financeItems: Array<{
    id: string;
    institution_name: string | null;
    status: string;
    last_synced_at: string | null;
    last_error: string | null;
  }>;
  accounts: Array<{
    id: string;
    item_id: string;
    name: string;
    mask: string | null;
    type: string | null;
    subtype: string | null;
  }>;
  syncing: boolean;
  connecting: boolean;
  onConnect: () => void;
  onSync: () => void;
}> = ({ financeItems, accounts, syncing, connecting, onConnect, onSync }) => {
  return (
    <div className="space-y-6">
      {/* Connected Institutions */}
      {financeItems.length > 0 ? (
        <div className="space-y-4">
          {financeItems.map((item) => {
            const itemAccounts = accounts.filter((a) => a.item_id === item.id);
            const lastSynced = item.last_synced_at
              ? new Date(item.last_synced_at).toLocaleString()
              : "Never";

            return (
              <div key={item.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🏦</span>
                      <h4 className="text-lg font-medium text-white">
                        {item.institution_name || "Unknown Institution"}
                      </h4>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-sm">
                      <span className={`inline-flex items-center gap-1 ${
                        item.status === "active" ? "text-emerald-400" : "text-amber-400"
                      }`}>
                        <span className={`h-2 w-2 rounded-full ${
                          item.status === "active" ? "bg-emerald-400" : "bg-amber-400"
                        }`}></span>
                        {item.status}
                      </span>
                      <span className="text-white/50">Last synced: {lastSynced}</span>
                    </div>
                    {item.last_error && (
                      <p className="mt-2 text-sm text-red-400">{item.last_error}</p>
                    )}
                  </div>
                </div>

                {/* Accounts List */}
                {itemAccounts.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {itemAccounts.map((acct) => (
                      <div
                        key={acct.id}
                        className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"
                      >
                        <div>
                          <p className="font-medium text-white">{acct.name}</p>
                          <p className="text-xs text-white/50">
                            {acct.type} {acct.subtype && `· ${acct.subtype}`}
                          </p>
                        </div>
                        {acct.mask && (
                          <span className="font-mono text-sm text-white/50">••••{acct.mask}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-8 text-center">
          <div className="mb-4 text-5xl">🏦</div>
          <h3 className="text-xl font-medium text-white">No banks connected</h3>
          <p className="mt-2 text-white/60">Connect your bank account to start tracking transactions</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <GlassButton onClick={onConnect} className="px-6 py-3">
          {connecting ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
              Connecting...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span>+</span>
              Connect Bank
            </span>
          )}
        </GlassButton>

        {financeItems.length > 0 && (
          <GlassButton onClick={onSync} className="px-6 py-3">
            {syncing ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                Syncing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sync Now
              </span>
            )}
          </GlassButton>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const FinanceTracker: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    categories,
    financeItems,
    accounts,
    error,
    setError,
    hasConnectedBanks,
    connecting,
    handleConnectBank,
    syncing,
    handleSyncNow,
    inboxTransactions,
    inboxLoading,
    inboxCount,
    handleCategorize,
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    monthTransactions,
    monthLoading,
    monthTotals,
    historyFilters,
    setHistoryFilters,
    historyTransactions,
    historyLoading,
    loadHistory,
    handleUncategorize,
    getCategoryById,
  } = useFinanceModule();

  return (
    <div className="space-y-6">
      {/* Header */}
      <GlassCard className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className={sectionTitle}>Finance Tracker</h3>
            <p className="mt-1 text-sm text-white/60">
              {hasConnectedBanks
                ? `${financeItems.length} bank${financeItems.length !== 1 ? "s" : ""} connected`
                : "Connect a bank to get started"}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            {hasConnectedBanks && (
              <button
                onClick={handleSyncNow}
                disabled={syncing}
                className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm text-white/80 transition hover:bg-white/20 hover:text-white disabled:opacity-50"
              >
                <svg className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {syncing ? "Syncing..." : "Sync"}
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200
                ${activeTab === tab.id
                  ? "bg-white text-gray-900 shadow-lg"
                  : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                }
              `}
            >
              <TabIcon name={tab.icon} className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.id === "inbox" && inboxCount > 0 && (
                <span className={`
                  ml-1 rounded-full px-2 py-0.5 text-xs font-bold
                  ${activeTab === "inbox" ? "bg-gray-900/10 text-gray-900" : "bg-white/20 text-white"}
                `}>
                  {inboxCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-xl border border-red-500/30 bg-red-500/10 p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-300">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-300 hover:text-red-200"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connect Bank Prompt (if no banks connected and not on accounts tab) */}
      {!hasConnectedBanks && activeTab !== "accounts" && (
        <GlassCard className="p-6">
          <div className="text-center">
            <div className="mb-4 text-4xl">🏦</div>
            <h4 className="text-lg font-medium text-white">Connect Your Bank</h4>
            <p className="mt-2 text-sm text-white/60">
              Link your bank account to automatically import and categorize transactions
            </p>
            <GlassButton onClick={handleConnectBank} className="mt-4 px-6 py-3">
              {connecting ? "Connecting..." : "Connect Bank"}
            </GlassButton>
          </div>
        </GlassCard>
      )}

      {/* Tab Content */}
      <GlassCard className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "inbox" && (
              <InboxView
                transactions={inboxTransactions}
                categories={categories}
                loading={inboxLoading}
                onCategorize={handleCategorize}
              />
            )}

            {activeTab === "month" && (
              <MonthView
                transactions={monthTransactions}
                categories={categories}
                totals={monthTotals()}
                selectedYear={selectedYear}
                selectedMonth={selectedMonth}
                setSelectedYear={setSelectedYear}
                setSelectedMonth={setSelectedMonth}
                loading={monthLoading}
                getCategoryById={getCategoryById}
                onUncategorize={handleUncategorize}
              />
            )}

            {activeTab === "history" && (
              <HistoryView
                transactions={historyTransactions}
                categories={categories}
                filters={historyFilters}
                setFilters={setHistoryFilters}
                loading={historyLoading}
                getCategoryById={getCategoryById}
                onSearch={loadHistory}
                onUncategorize={handleUncategorize}
              />
            )}

            {activeTab === "accounts" && (
              <AccountsView
                financeItems={financeItems}
                accounts={accounts}
                syncing={syncing}
                connecting={connecting}
                onConnect={handleConnectBank}
                onSync={handleSyncNow}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </GlassCard>
    </div>
  );
};

export default FinanceTracker;
