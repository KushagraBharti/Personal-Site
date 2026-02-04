import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFinanceModule } from "../hooks";
import { FinanceTab, FinanceCategory, FinanceTransaction } from "../types";
import "../../../styles/neo-brutal.css";

// ============================================================================
// Tab Configuration
// ============================================================================

const TABS: { id: FinanceTab; label: string; icon: string }[] = [
  { id: "inbox", label: "INBOX", icon: "📥" },
  { id: "month", label: "MONTH", icon: "📅" },
  { id: "history", label: "HISTORY", icon: "🔍" },
  { id: "accounts", label: "ACCOUNTS", icon: "🏦" },
];

const MONTH_NAMES = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
];

// ============================================================================
// Floating Money Elements
// ============================================================================

const FloatingMoney: React.FC = () => (
  <div className="pointer-events-none fixed inset-0 overflow-hidden opacity-15">
    {["💰", "💵", "💳", "🪙", "💎", "📊", "📈", "🏦", "💸", "🤑"].map((emoji, i) => (
      <motion.div
        key={i}
        className="absolute text-3xl"
        initial={{
          x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
          y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
        }}
        animate={{
          y: [0, -20, 0],
          rotate: [0, 15, -15, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 3 + Math.random() * 3,
          repeat: Infinity,
          delay: i * 0.4,
        }}
        style={{
          left: `${5 + (i * 10)}%`,
          top: `${10 + (i % 5) * 20}%`,
        }}
      >
        {emoji}
      </motion.div>
    ))}
  </div>
);

// ============================================================================
// Confetti Explosion for Inbox Zero
// ============================================================================

const InboxZeroConfetti: React.FC = () => {
  const [particles] = useState(() =>
    [...Array(30)].map((_, i) => ({
      id: i,
      x: Math.random() * 100 - 50,
      y: Math.random() * -100 - 50,
      rotation: Math.random() * 720,
      scale: 0.5 + Math.random() * 0.5,
      emoji: ["🎉", "✨", "💫", "⭐", "🌟", "💰", "🎊"][Math.floor(Math.random() * 7)],
    }))
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute left-1/2 top-1/2 text-2xl"
          initial={{ x: 0, y: 0, rotate: 0, scale: 0, opacity: 1 }}
          animate={{
            x: p.x * 5,
            y: p.y * 3,
            rotate: p.rotation,
            scale: p.scale,
            opacity: 0,
          }}
          transition={{ duration: 2, ease: "easeOut" }}
        >
          {p.emoji}
        </motion.div>
      ))}
    </div>
  );
};

// ============================================================================
// Money Counter with Animation
// ============================================================================

const AnimatedMoney: React.FC<{
  amount: number;
  currency?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  colorPositive?: boolean;
}> = ({ amount, currency = "USD", size = "md", colorPositive = false }) => {
  const [displayAmount, setDisplayAmount] = useState(0);

  useEffect(() => {
    const duration = 500;
    const steps = 20;
    const increment = amount / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current += increment;
      if (step >= steps) {
        setDisplayAmount(amount);
        clearInterval(timer);
      } else {
        setDisplayAmount(current);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [amount]);

  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(Math.abs(displayAmount));

  const isPositive = amount >= 0;
  const color = colorPositive
    ? isPositive
      ? "var(--neo-lime)"
      : "var(--neo-pink)"
    : "white";

  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
    xl: "text-4xl",
  };

  return (
    <motion.span
      key={amount}
      initial={{ scale: 1.2, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`font-black tabular-nums ${sizeClasses[size]}`}
      style={{ color, fontFamily: "'Archivo Black', sans-serif" }}
    >
      {isPositive ? "" : "-"}{formatted}
    </motion.span>
  );
};

// ============================================================================
// Category Chip - Neo Style
// ============================================================================

const CategoryChip: React.FC<{
  category: FinanceCategory;
  onClick?: () => void;
  selected?: boolean;
  compact?: boolean;
}> = ({ category, onClick, selected = false, compact = false }) => (
  <motion.button
    onClick={onClick}
    whileHover={{ scale: 1.05, rotate: [-1, 1, 0] }}
    whileTap={{ scale: 0.95 }}
    className={`
      inline-flex items-center gap-1.5 font-bold transition-all
      ${compact ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm"}
    `}
    style={{
      background: selected ? "var(--neo-lime)" : "var(--neo-black)",
      color: selected ? "var(--neo-black)" : "white",
      border: `3px solid ${selected ? "var(--neo-black)" : "var(--neo-lime)"}`,
      boxShadow: selected ? "3px 3px 0 var(--neo-black)" : "none",
    }}
  >
    <span className="text-base">{category.icon}</span>
    <span className="uppercase tracking-wide">{category.name}</span>
  </motion.button>
);

// ============================================================================
// Transaction Row - Neo Style
// ============================================================================

const TransactionRow: React.FC<{
  transaction: FinanceTransaction;
  category: FinanceCategory | null;
  categories: FinanceCategory[];
  onCategorize?: (categoryId: string) => void;
  onUncategorize?: () => void;
  showCategory?: boolean;
  index: number;
}> = ({ transaction, category, categories, onCategorize, onUncategorize, showCategory = false, index }) => {
  const [expanded, setExpanded] = useState(false);
  const isIncome = transaction.amount < 0;

  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: transaction.iso_currency_code || "USD",
  }).format(Math.abs(transaction.amount));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -30, rotate: -1 }}
      animate={{ opacity: 1, x: 0, rotate: 0 }}
      exit={{ opacity: 0, x: 50, scale: 0.9 }}
      transition={{ delay: index * 0.03 }}
      className="neo-card group relative overflow-hidden"
      style={{
        borderColor: isIncome ? "var(--neo-lime)" : "var(--neo-cyan)",
        background: isIncome
          ? "linear-gradient(135deg, rgba(191, 255, 0, 0.1) 0%, transparent 50%)"
          : "transparent",
      }}
    >
      {/* Pending indicator */}
      {transaction.pending && (
        <motion.div
          className="absolute right-0 top-0 px-2 py-1 text-xs font-bold"
          style={{ background: "var(--neo-yellow)", color: "var(--neo-black)" }}
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          PENDING
        </motion.div>
      )}

      <div
        className="flex cursor-pointer items-center gap-4 p-4"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Date Block */}
        <motion.div
          className="flex h-14 w-14 shrink-0 flex-col items-center justify-center"
          style={{
            background: "var(--neo-black)",
            border: "3px solid white",
          }}
          whileHover={{ rotate: [0, -5, 5, 0] }}
        >
          <span className="text-xs font-bold uppercase" style={{ color: "var(--neo-lime)" }}>
            {new Date(transaction.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" })}
          </span>
          <span className="text-xl font-black text-white">
            {new Date(transaction.date + "T00:00:00").getDate()}
          </span>
        </motion.div>

        {/* Details */}
        <div className="min-w-0 flex-1">
          <p className="truncate font-black text-white" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
            {transaction.merchant_name || transaction.name}
          </p>
          {transaction.merchant_name && (
            <p className="truncate text-sm text-white/50">
              {transaction.name}
            </p>
          )}
          {showCategory && category && (
            <span
              className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold"
              style={{ background: "var(--neo-black)", border: "2px solid var(--neo-lime)" }}
            >
              <span>{category.icon}</span>
              <span className="uppercase">{category.name}</span>
            </span>
          )}
        </div>

        {/* Amount */}
        <div className="text-right">
          <span
            className="text-xl font-black tabular-nums"
            style={{
              color: isIncome ? "var(--neo-lime)" : "white",
              fontFamily: "'Archivo Black', sans-serif",
            }}
          >
            {isIncome ? "+" : "-"}{formattedAmount}
          </span>
        </div>

        {/* Expand Arrow */}
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          className="text-xl text-white/60"
        >
          ▼
        </motion.span>
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div
              className="border-t-3 p-4"
              style={{ borderColor: isIncome ? "var(--neo-lime)" : "var(--neo-cyan)" }}
            >
              {onCategorize && (
                <>
                  <p className="neo-label mb-3">CATEGORIZE AS:</p>
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
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-white/50">CATEGORY:</span>
                    <span className="flex items-center gap-1 font-bold text-white">
                      <span className="text-lg">{category.icon}</span>
                      <span className="uppercase">{category.name}</span>
                    </span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05, x: 3 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onUncategorize();
                    }}
                    className="neo-btn neo-btn-sm"
                    style={{ borderColor: "var(--neo-pink)" }}
                  >
                    📥 MOVE TO INBOX
                  </motion.button>
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
// Loading Spinner - Neo Style
// ============================================================================

const NeoLoader: React.FC<{ text?: string }> = ({ text = "LOADING..." }) => (
  <div className="flex flex-col items-center justify-center py-16">
    <motion.div
      className="relative h-16 w-16"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    >
      <div
        className="absolute inset-0"
        style={{
          border: "4px solid var(--neo-black)",
          borderTopColor: "var(--neo-lime)",
          borderRightColor: "var(--neo-pink)",
        }}
      />
    </motion.div>
    <motion.p
      className="mt-4 font-bold tracking-widest"
      animate={{ opacity: [1, 0.5, 1] }}
      transition={{ duration: 1, repeat: Infinity }}
      style={{ fontFamily: "'Space Mono', monospace" }}
    >
      {text}
    </motion.p>
  </div>
);

// ============================================================================
// Inbox View
// ============================================================================

const InboxView: React.FC<{
  transactions: FinanceTransaction[];
  categories: FinanceCategory[];
  loading: boolean;
  onCategorize: (transactionId: string, categoryId: string) => void;
}> = ({ transactions, categories, loading, onCategorize }) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (transactions.length === 0 && !loading) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [transactions.length, loading]);

  if (loading) {
    return <NeoLoader text="LOADING INBOX..." />;
  }

  if (transactions.length === 0) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="neo-card relative flex flex-col items-center justify-center py-16 text-center"
        style={{ borderColor: "var(--neo-lime)", borderStyle: "dashed" }}
      >
        {showConfetti && <InboxZeroConfetti />}
        <motion.span
          className="text-7xl"
          animate={{
            rotate: [0, 10, -10, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 0.5, repeat: 3 }}
        >
          🎉
        </motion.span>
        <h3
          className="mt-4 text-3xl font-black"
          style={{ fontFamily: "'Archivo Black', sans-serif", color: "var(--neo-lime)" }}
        >
          INBOX ZERO!
        </h3>
        <p className="mt-2 text-white/60">All transactions have been categorized</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <motion.div
        className="flex items-center gap-3"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
      >
        <span
          className="flex h-10 w-10 items-center justify-center text-xl font-black"
          style={{ background: "var(--neo-pink)", color: "var(--neo-black)" }}
        >
          {transactions.length}
        </span>
        <span className="font-bold text-white/60">
          TRANSACTION{transactions.length !== 1 ? "S" : ""} TO REVIEW
        </span>
      </motion.div>

      <AnimatePresence mode="popLayout">
        {transactions.map((txn, index) => (
          <TransactionRow
            key={txn.id}
            transaction={txn}
            category={null}
            categories={categories}
            onCategorize={(categoryId) => onCategorize(txn.id, categoryId)}
            index={index}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// Month View
// ============================================================================

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

  const expenses = useMemo(() => {
    return totals.filter((t) => t.total > 0).reduce((sum, t) => sum + t.total, 0);
  }, [totals]);

  const income = useMemo(() => {
    return totals.filter((t) => t.total < 0).reduce((sum, t) => sum + Math.abs(t.total), 0);
  }, [totals]);

  const net = income - expenses;

  return (
    <div className="space-y-6">
      {/* Month Picker */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="neo-select"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
        >
          {MONTH_NAMES.map((name, idx) => (
            <option key={idx} value={idx + 1}>{name}</option>
          ))}
        </select>
        <select
          className="neo-select"
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
        >
          {[2024, 2025, 2026, 2027].map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <NeoLoader text="CRUNCHING NUMBERS..." />
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <motion.div
              className="neo-card p-6 text-center"
              style={{ borderColor: "var(--neo-pink)" }}
              whileHover={{ scale: 1.02, rotate: -1 }}
            >
              <p className="neo-label">EXPENSES</p>
              <AnimatedMoney amount={expenses} size="lg" />
            </motion.div>
            <motion.div
              className="neo-card p-6 text-center"
              style={{ borderColor: "var(--neo-lime)" }}
              whileHover={{ scale: 1.02, rotate: 1 }}
            >
              <p className="neo-label" style={{ color: "var(--neo-lime)" }}>INCOME</p>
              <AnimatedMoney amount={income} size="lg" />
            </motion.div>
            <motion.div
              className="neo-card p-6 text-center"
              style={{ borderColor: net >= 0 ? "var(--neo-lime)" : "var(--neo-pink)" }}
              whileHover={{ scale: 1.02 }}
            >
              <p className="neo-label">NET</p>
              <AnimatedMoney amount={net} size="lg" colorPositive />
            </motion.div>
          </div>

          {/* Category Breakdown */}
          <div className="neo-card p-6" style={{ borderColor: "var(--neo-cyan)" }}>
            <h4
              className="mb-4 text-xl font-black"
              style={{ fontFamily: "'Archivo Black', sans-serif" }}
            >
              📊 BY CATEGORY
            </h4>
            <div className="space-y-3">
              {totals.map((item, idx) => {
                const pct = expenses > 0 && item.total > 0 ? (item.total / expenses) * 100 : 0;
                const isIncome = item.total < 0;

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="neo-card p-3"
                    style={{
                      borderColor: isIncome ? "var(--neo-lime)" : "var(--neo-black)",
                      borderWidth: "2px",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{item.category?.icon || "📦"}</span>
                        <div>
                          <span className="font-bold uppercase text-white">
                            {item.category?.name || "Uncategorized"}
                          </span>
                          <span className="ml-2 text-sm text-white/50">({item.count})</span>
                        </div>
                      </div>
                      <span
                        className="text-lg font-black tabular-nums"
                        style={{
                          color: isIncome ? "var(--neo-lime)" : "white",
                          fontFamily: "'Archivo Black', sans-serif",
                        }}
                      >
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                        }).format(Math.abs(item.total))}
                      </span>
                    </div>
                    {item.total > 0 && (
                      <div
                        className="mt-2 h-3 overflow-hidden"
                        style={{ background: "var(--neo-black)", border: "2px solid white" }}
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: "easeOut", delay: idx * 0.05 }}
                          className="h-full"
                          style={{
                            background: `linear-gradient(90deg, var(--neo-cyan), var(--neo-pink))`,
                          }}
                        />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Transaction List Toggle */}
          <motion.button
            onClick={() => setShowTransactions(!showTransactions)}
            className="neo-btn w-full"
            whileHover={{ x: 5 }}
          >
            <motion.span animate={{ rotate: showTransactions ? 90 : 0 }}>→</motion.span>
            {showTransactions ? "HIDE" : "SHOW"} ALL {transactions.length} TRANSACTIONS
          </motion.button>

          <AnimatePresence>
            {showTransactions && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-3 overflow-hidden"
              >
                {transactions.map((txn, index) => (
                  <TransactionRow
                    key={txn.id}
                    transaction={txn}
                    category={getCategoryById(txn.category_id)}
                    categories={categories}
                    showCategory
                    onUncategorize={() => onUncategorize(txn.id)}
                    index={index}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
};

// ============================================================================
// History View
// ============================================================================

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
      <div className="neo-card p-4" style={{ borderColor: "var(--neo-yellow)" }}>
        <h4 className="neo-label mb-4" style={{ color: "var(--neo-yellow)" }}>🔍 SEARCH FILTERS</h4>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="neo-label">START DATE</label>
            <input
              type="date"
              className="neo-input"
              value={filters.startDate}
              onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="neo-label">END DATE</label>
            <input
              type="date"
              className="neo-input"
              value={filters.endDate}
              onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="neo-label">CATEGORY</label>
            <select
              className="neo-select"
              value={filters.categoryId || ""}
              onChange={(e) => setFilters((f) => ({ ...f, categoryId: e.target.value || null }))}
            >
              <option value="">ALL CATEGORIES</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="neo-label">MERCHANT</label>
            <input
              type="text"
              className="neo-input"
              placeholder="Search..."
              value={filters.merchantSearch}
              onChange={(e) => setFilters((f) => ({ ...f, merchantSearch: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && onSearch()}
            />
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02, x: 5 }}
          whileTap={{ scale: 0.98 }}
          onClick={onSearch}
          className="neo-btn neo-btn-primary mt-4"
        >
          🔍 SEARCH
        </motion.button>
      </div>

      {/* Results */}
      {loading ? (
        <NeoLoader text="SEARCHING..." />
      ) : transactions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="neo-card flex flex-col items-center justify-center py-12 text-center"
          style={{ borderStyle: "dashed" }}
        >
          <span className="text-5xl">🔍</span>
          <p className="mt-4 text-white/60">No transactions found matching your filters</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 items-center justify-center text-xl font-black"
              style={{ background: "var(--neo-cyan)", color: "var(--neo-black)" }}
            >
              {transactions.length}
            </span>
            <span className="font-bold text-white/60">
              RESULT{transactions.length !== 1 ? "S" : ""}
            </span>
          </div>
          {transactions.map((txn, index) => (
            <TransactionRow
              key={txn.id}
              transaction={txn}
              category={getCategoryById(txn.category_id)}
              categories={categories}
              showCategory
              onUncategorize={() => onUncategorize(txn.id)}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Accounts View
// ============================================================================

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
          {financeItems.map((item, index) => {
            const itemAccounts = accounts.filter((a) => a.item_id === item.id);
            const lastSynced = item.last_synced_at
              ? new Date(item.last_synced_at).toLocaleString()
              : "Never";
            const isActive = item.status === "active";

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20, rotate: -1 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{ delay: index * 0.1 }}
                className="neo-card overflow-hidden"
                style={{ borderColor: isActive ? "var(--neo-lime)" : "var(--neo-orange)" }}
              >
                {/* Institution Header */}
                <div
                  className="flex items-center justify-between p-4"
                  style={{
                    background: isActive
                      ? "linear-gradient(135deg, rgba(191, 255, 0, 0.2) 0%, transparent 50%)"
                      : "linear-gradient(135deg, rgba(255, 165, 0, 0.2) 0%, transparent 50%)",
                  }}
                >
                  <div className="flex items-center gap-4">
                    <motion.span
                      className="text-4xl"
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      🏦
                    </motion.span>
                    <div>
                      <h4
                        className="text-xl font-black"
                        style={{ fontFamily: "'Archivo Black', sans-serif" }}
                      >
                        {item.institution_name || "Unknown Institution"}
                      </h4>
                      <div className="mt-1 flex items-center gap-3 text-sm">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 font-bold uppercase"
                          style={{
                            background: isActive ? "var(--neo-lime)" : "var(--neo-orange)",
                            color: "var(--neo-black)",
                          }}
                        >
                          <motion.span
                            className="h-2 w-2 rounded-full"
                            style={{ background: "var(--neo-black)" }}
                            animate={isActive ? { scale: [1, 1.2, 1] } : {}}
                            transition={{ duration: 1, repeat: Infinity }}
                          />
                          {item.status}
                        </span>
                        <span className="text-white/50">Synced: {lastSynced}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {item.last_error && (
                  <div
                    className="border-t-3 p-3"
                    style={{ borderColor: "var(--neo-pink)", background: "rgba(255, 107, 157, 0.1)" }}
                  >
                    <p className="text-sm font-bold" style={{ color: "var(--neo-pink)" }}>
                      ⚠️ {item.last_error}
                    </p>
                  </div>
                )}

                {/* Accounts List */}
                {itemAccounts.length > 0 && (
                  <div className="border-t-3 p-4" style={{ borderColor: "var(--neo-black)" }}>
                    <p className="neo-label mb-3">ACCOUNTS</p>
                    <div className="space-y-2">
                      {itemAccounts.map((acct) => (
                        <motion.div
                          key={acct.id}
                          className="flex items-center justify-between p-3"
                          style={{
                            background: "var(--neo-black)",
                            border: "2px solid white",
                          }}
                          whileHover={{ x: 5 }}
                        >
                          <div>
                            <p className="font-bold text-white">{acct.name}</p>
                            <p className="text-xs uppercase text-white/50">
                              {acct.type} {acct.subtype && `· ${acct.subtype}`}
                            </p>
                          </div>
                          {acct.mask && (
                            <span
                              className="font-mono text-sm"
                              style={{ color: "var(--neo-lime)" }}
                            >
                              ••••{acct.mask}
                            </span>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="neo-card flex flex-col items-center justify-center py-16 text-center"
          style={{ borderStyle: "dashed", borderColor: "var(--neo-cyan)" }}
        >
          <motion.span
            className="text-7xl"
            animate={{
              y: [0, -10, 0],
              rotate: [0, 5, -5, 0],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🏦
          </motion.span>
          <h3
            className="mt-4 text-2xl font-black"
            style={{ fontFamily: "'Archivo Black', sans-serif" }}
          >
            NO BANKS CONNECTED
          </h3>
          <p className="mt-2 text-white/60">Connect your bank account to start tracking</p>
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <motion.button
          whileHover={{ scale: 1.05, rotate: [-1, 1, 0] }}
          whileTap={{ scale: 0.95 }}
          onClick={onConnect}
          disabled={connecting}
          className="neo-btn neo-btn-primary"
        >
          {connecting ? (
            <span className="flex items-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                ⏳
              </motion.span>
              CONNECTING...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span className="text-lg">+</span>
              CONNECT BANK
            </span>
          )}
        </motion.button>

        {financeItems.length > 0 && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onSync}
            disabled={syncing}
            className="neo-btn"
            style={{ borderColor: "var(--neo-cyan)" }}
          >
            {syncing ? (
              <span className="flex items-center gap-2">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  🔄
                </motion.span>
                SYNCING...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                🔄 SYNC NOW
              </span>
            )}
          </motion.button>
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
    <div className="relative space-y-6">
      <FloatingMoney />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="neo-card p-6"
        style={{ borderColor: "var(--neo-lime)" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <motion.span
              className="text-5xl"
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              💰
            </motion.span>
            <div>
              <h2
                className="text-3xl font-black tracking-wide"
                style={{ fontFamily: "'Archivo Black', sans-serif" }}
              >
                FINANCE TRACKER
              </h2>
              <p className="mt-1 text-sm text-white/60">
                {hasConnectedBanks
                  ? `${financeItems.length} BANK${financeItems.length !== 1 ? "S" : ""} CONNECTED`
                  : "CONNECT A BANK TO GET STARTED"}
              </p>
            </div>
          </div>

          {/* Quick Sync Button */}
          {hasConnectedBanks && (
            <motion.button
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSyncNow}
              disabled={syncing}
              className="neo-btn neo-btn-sm"
              style={{ borderColor: "var(--neo-cyan)" }}
            >
              <motion.span
                animate={syncing ? { rotate: 360 } : {}}
                transition={{ duration: 1, repeat: syncing ? Infinity : 0, ease: "linear" }}
              >
                🔄
              </motion.span>
              {syncing ? "SYNCING..." : "SYNC"}
            </motion.button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="neo-tabs mt-6">
          {TABS.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`neo-tab ${activeTab === tab.id ? "neo-tab-active" : ""}`}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
              {tab.id === "inbox" && inboxCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-2 inline-flex h-6 w-6 items-center justify-center text-xs font-black"
                  style={{
                    background: activeTab === "inbox" ? "var(--neo-black)" : "var(--neo-pink)",
                    color: activeTab === "inbox" ? "var(--neo-lime)" : "var(--neo-black)",
                  }}
                >
                  {inboxCount}
                </motion.span>
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, x: -20, rotate: -1 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="neo-card flex items-center justify-between p-4"
            style={{ borderColor: "var(--neo-pink)", background: "rgba(255, 107, 157, 0.1)" }}
          >
            <p className="font-bold" style={{ color: "var(--neo-pink)" }}>
              ⚠️ {error}
            </p>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setError(null)}
              className="text-xl"
              style={{ color: "var(--neo-pink)" }}
            >
              ✕
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connect Bank Prompt */}
      {!hasConnectedBanks && activeTab !== "accounts" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="neo-card flex flex-col items-center p-8 text-center"
          style={{ borderColor: "var(--neo-cyan)", borderStyle: "dashed" }}
        >
          <motion.span
            className="text-6xl"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🏦
          </motion.span>
          <h4
            className="mt-4 text-2xl font-black"
            style={{ fontFamily: "'Archivo Black', sans-serif" }}
          >
            CONNECT YOUR BANK
          </h4>
          <p className="mt-2 text-white/60">
            Link your bank account to automatically import and categorize transactions
          </p>
          <motion.button
            whileHover={{ scale: 1.05, rotate: [-1, 1, 0] }}
            whileTap={{ scale: 0.95 }}
            onClick={handleConnectBank}
            className="neo-btn neo-btn-primary mt-6"
          >
            {connecting ? "CONNECTING..." : "CONNECT BANK"}
          </motion.button>
        </motion.div>
      )}

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20, rotate: -1 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          exit={{ opacity: 0, y: -20 }}
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

      {/* Decorative Footer */}
      <motion.div
        className="flex items-center justify-center gap-2 pt-8 text-white/30"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <span className="h-1 w-8 rounded-full bg-current" />
        <span className="text-xs font-bold tracking-widest">FINANCE TRACKER</span>
        <span className="h-1 w-8 rounded-full bg-current" />
      </motion.div>
    </div>
  );
};

export default FinanceTracker;
