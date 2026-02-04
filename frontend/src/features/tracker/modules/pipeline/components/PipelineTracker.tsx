import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PipelineItem, PipelineType } from "../../../shared/types";
import { toChicagoDate } from "../../../shared/utils/date";
import { usePipelineModule } from "../hooks";
import "../../../styles/neo-brutal.css";

// ============================================================================
// Type Configuration with Neo Colors
// ============================================================================

const TYPE_CONFIG: Record<PipelineType, { color: string; bgColor: string; icon: string; label: string }> = {
  internship: {
    color: "var(--neo-lime)",
    bgColor: "rgba(191, 255, 0, 0.2)",
    icon: "💼",
    label: "INTERNSHIP"
  },
  traction: {
    color: "var(--neo-pink)",
    bgColor: "rgba(255, 107, 157, 0.2)",
    icon: "🚀",
    label: "TRACTION"
  },
  relationship: {
    color: "var(--neo-cyan)",
    bgColor: "rgba(0, 255, 255, 0.2)",
    icon: "🤝",
    label: "RELATIONSHIP"
  },
};

// ============================================================================
// Floating Decorative Elements
// ============================================================================

const FloatingDeals: React.FC = () => (
  <div className="pointer-events-none fixed inset-0 overflow-hidden opacity-20">
    {[...Array(8)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute text-4xl"
        initial={{
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
        }}
        animate={{
          y: [0, -30, 0],
          rotate: [0, 10, -10, 0],
        }}
        transition={{
          duration: 4 + Math.random() * 2,
          repeat: Infinity,
          delay: i * 0.5,
        }}
        style={{
          left: `${10 + (i * 12)}%`,
          top: `${20 + (i % 3) * 30}%`,
        }}
      >
        {["💰", "📈", "🎯", "⚡", "💎", "🔥", "✨", "🌟"][i]}
      </motion.div>
    ))}
  </div>
);

// ============================================================================
// Urgency Indicator
// ============================================================================

const UrgencyBadge: React.FC<{ date: Date | null; archived: boolean }> = ({ date, archived }) => {
  if (archived) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-500/20 px-2 py-1 text-xs font-bold text-gray-400">
        📦 ARCHIVED
      </span>
    );
  }

  if (!date) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-xs font-bold text-white/60">
        📅 NO DATE
      </span>
    );
  }

  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return (
      <motion.span
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="inline-flex items-center gap-1 rounded-full bg-red-500/30 px-2 py-1 text-xs font-bold text-red-400"
        style={{ border: "2px solid var(--neo-pink)" }}
      >
        🔥 OVERDUE
      </motion.span>
    );
  }

  if (diffDays <= 1) {
    return (
      <motion.span
        animate={{ x: [-2, 2, -2] }}
        transition={{ duration: 0.2, repeat: Infinity }}
        className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold"
        style={{ background: "var(--neo-yellow)", color: "var(--neo-black)" }}
      >
        ⚡ TODAY
      </motion.span>
    );
  }

  if (diffDays <= 3) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold"
        style={{ background: "var(--neo-orange)", color: "var(--neo-black)" }}
      >
        🔔 {diffDays}d
      </span>
    );
  }

  if (diffDays <= 7) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold"
        style={{ background: "var(--neo-lime)", color: "var(--neo-black)" }}
      >
        📅 {diffDays}d
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-xs font-bold text-white/60">
      📆 {diffDays}d
    </span>
  );
};

// ============================================================================
// Animated Counter
// ============================================================================

const AnimatedCount: React.FC<{ count: number; label: string; color: string }> = ({ count, label, color }) => (
  <motion.div
    className="neo-card flex flex-col items-center justify-center p-4"
    whileHover={{ scale: 1.05, rotate: [-1, 1, -1, 0] }}
    style={{ borderColor: color }}
  >
    <motion.span
      key={count}
      initial={{ scale: 1.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="text-3xl font-black"
      style={{ color, fontFamily: "'Archivo Black', sans-serif" }}
    >
      {count}
    </motion.span>
    <span className="text-xs font-bold uppercase tracking-wider text-white/60">{label}</span>
  </motion.div>
);

// ============================================================================
// Pipeline Card
// ============================================================================

const PipelineCard: React.FC<{
  item: PipelineItem;
  edits: Partial<PipelineItem>;
  onUpdateEdit: (updates: Partial<PipelineItem>) => void;
  onArchive: () => void;
  onDelete: () => void;
  index: number;
}> = ({ item, edits, onUpdateEdit, onArchive, onDelete, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const typeConfig = TYPE_CONFIG[(edits.type ?? item.type) as PipelineType] || TYPE_CONFIG.internship;

  const actionDate = (edits.next_action_date ?? item.next_action_date)
    ? new Date(`${edits.next_action_date ?? item.next_action_date}T00:00:00`)
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -50, rotate: -2 }}
      animate={{ opacity: 1, x: 0, rotate: 0 }}
      exit={{ opacity: 0, x: 50, scale: 0.8 }}
      transition={{ delay: index * 0.05 }}
      className="neo-card group relative overflow-hidden"
      style={{
        borderColor: typeConfig.color,
        background: `linear-gradient(135deg, ${typeConfig.bgColor} 0%, transparent 50%)`,
      }}
    >
      {/* Decorative corner */}
      <div
        className="absolute -right-8 -top-8 h-16 w-16 rotate-45"
        style={{ background: typeConfig.color, opacity: 0.3 }}
      />

      {/* Header */}
      <div
        className="flex cursor-pointer items-center justify-between p-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <motion.span
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
            className="text-2xl"
          >
            {typeConfig.icon}
          </motion.span>
          <div>
            <h4 className="font-black text-white" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
              {edits.name ?? item.name}
            </h4>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span
                className="neo-tag"
                style={{ background: typeConfig.color, color: "var(--neo-black)" }}
              >
                {typeConfig.label}
              </span>
              {(edits.stage ?? item.stage) && (
                <span className="neo-tag neo-tag-ghost">
                  📍 {edits.stage ?? item.stage}
                </span>
              )}
              <UrgencyBadge date={actionDate} archived={item.archived ?? false} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); onArchive(); }}
            className="neo-btn neo-btn-sm"
            style={{
              background: item.archived ? "var(--neo-lime)" : "transparent",
              color: item.archived ? "var(--neo-black)" : "white",
            }}
          >
            {item.archived ? "📤" : "📥"}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 10 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="neo-btn neo-btn-sm neo-btn-danger"
          >
            🗑️
          </motion.button>
          <motion.span
            animate={{ rotate: isExpanded ? 180 : 0 }}
            className="text-xl text-white/60"
          >
            ▼
          </motion.span>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div
              className="border-t-3 p-4"
              style={{ borderColor: typeConfig.color }}
            >
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="neo-label">NAME</label>
                  <input
                    className="neo-input"
                    placeholder="Deal name"
                    value={edits.name ?? item.name ?? ""}
                    onChange={(e) => onUpdateEdit({ name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="neo-label">TYPE</label>
                  <select
                    className="neo-select"
                    value={(edits.type ?? item.type) as PipelineType}
                    onChange={(e) => onUpdateEdit({ type: e.target.value as PipelineType })}
                  >
                    <option value="internship">💼 Internship</option>
                    <option value="traction">🚀 Traction</option>
                    <option value="relationship">🤝 Relationship</option>
                  </select>
                </div>
                <div>
                  <label className="neo-label">STAGE</label>
                  <input
                    className="neo-input"
                    placeholder="Current stage"
                    value={edits.stage ?? item.stage ?? ""}
                    onChange={(e) => onUpdateEdit({ stage: e.target.value })}
                  />
                </div>
                <div>
                  <label className="neo-label">NEXT ACTION DATE</label>
                  <input
                    className="neo-input"
                    type="date"
                    value={edits.next_action_date ?? item.next_action_date ?? ""}
                    onChange={(e) => onUpdateEdit({ next_action_date: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="neo-label">NEXT ACTION</label>
                  <input
                    className="neo-input"
                    placeholder="What's the next step?"
                    value={edits.next_action ?? item.next_action ?? ""}
                    onChange={(e) => onUpdateEdit({ next_action: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="neo-label">NOTES</label>
                  <textarea
                    className="neo-input min-h-[80px] resize-y"
                    placeholder="Additional notes..."
                    value={edits.notes ?? item.notes ?? ""}
                    onChange={(e) => onUpdateEdit({ notes: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="neo-label">LINKS</label>
                  <textarea
                    className="neo-input min-h-[60px] resize-y font-mono text-sm"
                    placeholder="One link per line..."
                    value={
                      Array.isArray(edits.links)
                        ? edits.links.join("\n")
                        : Array.isArray(item.links)
                        ? item.links.join("\n")
                        : ""
                    }
                    onChange={(e) =>
                      onUpdateEdit({ links: e.target.value.split("\n").filter(Boolean) })
                    }
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ============================================================================
// Add Deal Form
// ============================================================================

const AddDealForm: React.FC<{
  draft: Partial<PipelineItem>;
  setDraft: React.Dispatch<React.SetStateAction<Partial<PipelineItem>>>;
  onSubmit: () => void;
  error: string;
}> = ({ draft, setDraft, onSubmit, error }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      className="neo-card overflow-hidden"
      style={{ borderColor: "var(--neo-lime)" }}
    >
      {/* Toggle Header */}
      <motion.button
        className="flex w-full items-center justify-between p-4"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ x: 5 }}
      >
        <div className="flex items-center gap-3">
          <motion.span
            animate={{ rotate: isOpen ? 45 : 0, scale: isOpen ? 1.2 : 1 }}
            className="flex h-10 w-10 items-center justify-center text-2xl font-black"
            style={{
              background: "var(--neo-lime)",
              color: "var(--neo-black)",
              border: "3px solid var(--neo-black)",
            }}
          >
            +
          </motion.span>
          <span
            className="text-xl font-black tracking-wide"
            style={{ fontFamily: "'Archivo Black', sans-serif" }}
          >
            ADD NEW DEAL
          </span>
        </div>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          className="text-2xl"
        >
          ▼
        </motion.span>
      </motion.button>

      {/* Form Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div
              className="border-t-3 p-4"
              style={{ borderColor: "var(--neo-lime)" }}
            >
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="neo-label">NAME *</label>
                  <input
                    className="neo-input"
                    placeholder="Company / Opportunity"
                    value={draft.name || ""}
                    onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="neo-label">TYPE</label>
                  <select
                    className="neo-select"
                    value={draft.type || "internship"}
                    onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value as PipelineType }))}
                  >
                    <option value="internship">💼 Internship</option>
                    <option value="traction">🚀 Traction</option>
                    <option value="relationship">🤝 Relationship</option>
                  </select>
                </div>
                <div>
                  <label className="neo-label">STAGE</label>
                  <input
                    className="neo-input"
                    placeholder="Applied / Interview / etc."
                    value={draft.stage || ""}
                    onChange={(e) => setDraft((d) => ({ ...d, stage: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="neo-label">NEXT ACTION DATE</label>
                  <input
                    className="neo-input"
                    type="date"
                    value={draft.next_action_date || ""}
                    onChange={(e) => setDraft((d) => ({ ...d, next_action_date: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="neo-label">NEXT ACTION</label>
                  <input
                    className="neo-input"
                    placeholder="What's the next step?"
                    value={draft.next_action || ""}
                    onChange={(e) => setDraft((d) => ({ ...d, next_action: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="neo-label">NOTES</label>
                  <textarea
                    className="neo-input min-h-[80px] resize-y"
                    placeholder="Additional notes..."
                    value={draft.notes || ""}
                    onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="neo-label">LINKS</label>
                  <textarea
                    className="neo-input min-h-[60px] resize-y font-mono text-sm"
                    placeholder="One link per line..."
                    value={Array.isArray(draft.links) ? draft.links.join("\n") : draft.links || ""}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, links: e.target.value.split("\n").filter(Boolean) }))
                    }
                  />
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 font-bold"
                  style={{ color: "var(--neo-pink)" }}
                >
                  ⚠️ {error}
                </motion.p>
              )}

              <motion.button
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={onSubmit}
                className="neo-btn neo-btn-primary mt-4 w-full"
              >
                <span className="text-lg">🚀</span>
                ADD DEAL
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ============================================================================
// Empty State
// ============================================================================

const EmptyState: React.FC<{ isArchive: boolean }> = ({ isArchive }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="neo-card flex flex-col items-center justify-center p-12 text-center"
    style={{ borderStyle: "dashed" }}
  >
    <motion.span
      animate={{
        y: [0, -10, 0],
        rotate: [0, 5, -5, 0],
      }}
      transition={{ duration: 2, repeat: Infinity }}
      className="text-6xl"
    >
      {isArchive ? "📦" : "🎯"}
    </motion.span>
    <h3
      className="mt-4 text-2xl font-black"
      style={{ fontFamily: "'Archivo Black', sans-serif" }}
    >
      {isArchive ? "NO ARCHIVED DEALS" : "NO ACTIVE DEALS"}
    </h3>
    <p className="mt-2 text-white/60">
      {isArchive
        ? "Archived deals will appear here"
        : "Add a new deal to get started!"}
    </p>
  </motion.div>
);

// ============================================================================
// Main Component
// ============================================================================

const PipelineTracker: React.FC = () => {
  const {
    pipelineItems,
    setPipelineItems,
    pipelineDraft,
    setPipelineDraft,
    showPastDeals,
    setShowPastDeals,
    handleSavePipelineItem,
    handleDeletePipelineItem,
    resetDraft,
    errorMessage,
  } = usePipelineModule();

  const [draftError, setDraftError] = useState("");
  const [editsById, setEditsById] = useState<Record<string, Partial<PipelineItem>>>({});
  const editsRef = useRef<Record<string, Partial<PipelineItem>>>({});

  const now = toChicagoDate();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() + 14);

  const saveTimeoutRef = useRef<Map<string, number>>(new Map());

  const debouncedSave = useCallback(
    (item: PipelineItem & { type: PipelineType }) => {
      if (!item.id) return;
      const existing = saveTimeoutRef.current.get(item.id);
      if (existing) {
        window.clearTimeout(existing);
      }
      const timeoutId = window.setTimeout(async () => {
        const succeeded = await handleSavePipelineItem(item);
        if (!succeeded) return;
        setPipelineItems((prev) =>
          prev.map((current) => (current.id === item.id ? { ...current, ...item } : current))
        );
        setEditsById((prev) => {
          const next = { ...prev };
          delete next[item.id];
          editsRef.current = next;
          return next;
        });
      }, 400);
      saveTimeoutRef.current.set(item.id, timeoutId);
    },
    [handleSavePipelineItem, setPipelineItems]
  );

  useEffect(() => {
    return () => {
      saveTimeoutRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      saveTimeoutRef.current.clear();
    };
  }, []);

  const normalizeActionDate = useCallback((dateValue?: string | null) => {
    if (!dateValue) return null;
    return toChicagoDate(new Date(`${dateValue}T00:00:00`));
  }, []);

  const updateEdit = useCallback(
    (item: PipelineItem, updates: Partial<PipelineItem>) => {
      const currentEdits = editsRef.current[item.id] ?? {};
      const nextEdits = { ...currentEdits, ...updates };
      editsRef.current = { ...editsRef.current, [item.id]: nextEdits };
      setEditsById((prev) => ({ ...prev, [item.id]: nextEdits }));
      debouncedSave({ ...item, ...nextEdits } as PipelineItem & { type: PipelineType });
    },
    [debouncedSave]
  );

  const sorted = [...pipelineItems].sort((a, b) => {
    const aDate = normalizeActionDate(a.next_action_date)?.getTime() ?? Infinity;
    const bDate = normalizeActionDate(b.next_action_date)?.getTime() ?? Infinity;
    return aDate - bDate;
  });

  const current = sorted.filter((item) => {
    if (item.archived) return false;
    if (!item.next_action_date) return true;
    const d = normalizeActionDate(item.next_action_date);
    if (!d) return true;
    return d <= cutoff;
  });

  const past = sorted.filter((item) => {
    if (item.archived) return true;
    if (!item.next_action_date) return false;
    const d = normalizeActionDate(item.next_action_date);
    if (!d) return false;
    return d > cutoff;
  });

  const visible = showPastDeals ? past : current;

  // Stats
  const totalDeals = pipelineItems.length;
  const activeDeals = pipelineItems.filter(i => !i.archived).length;
  const overdueDeals = pipelineItems.filter(i => {
    if (i.archived || !i.next_action_date) return false;
    const d = normalizeActionDate(i.next_action_date);
    return d && d < now;
  }).length;

  return (
    <div className="relative space-y-6">
      <FloatingDeals />

      {/* Header Stats */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-3 gap-4"
      >
        <AnimatedCount count={totalDeals} label="Total" color="var(--neo-lime)" />
        <AnimatedCount count={activeDeals} label="Active" color="var(--neo-cyan)" />
        <AnimatedCount count={overdueDeals} label="Overdue" color="var(--neo-pink)" />
      </motion.div>

      {/* Add Deal Form */}
      <AddDealForm
        draft={pipelineDraft}
        setDraft={setPipelineDraft}
        error={draftError}
        onSubmit={async () => {
          if (!pipelineDraft.name?.trim()) {
            setDraftError("Name is required!");
            return;
          }
          const succeeded = await handleSavePipelineItem(pipelineDraft as PipelineItem & { type: PipelineType });
          if (succeeded) {
            setDraftError("");
            resetDraft();
          } else {
            setDraftError("Failed to save. Please try again.");
          }
        }}
      />

      {/* Toggle Section */}
      <div className="flex items-center justify-between">
        <motion.h3
          className="text-2xl font-black tracking-wide"
          style={{ fontFamily: "'Archivo Black', sans-serif" }}
          animate={{ x: [0, 3, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {showPastDeals ? "📦 ARCHIVE" : "🎯 ACTIVE DEALS"}
        </motion.h3>

        <div className="neo-tabs">
          <button
            onClick={() => setShowPastDeals(false)}
            className={`neo-tab ${!showPastDeals ? "neo-tab-active" : ""}`}
          >
            CURRENT ({current.length})
          </button>
          <button
            onClick={() => setShowPastDeals(true)}
            className={`neo-tab ${showPastDeals ? "neo-tab-active" : ""}`}
          >
            ARCHIVE ({past.length})
          </button>
        </div>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {(errorMessage || draftError) && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="neo-card p-4"
            style={{ borderColor: "var(--neo-pink)", background: "rgba(255, 107, 157, 0.1)" }}
          >
            <p className="font-bold" style={{ color: "var(--neo-pink)" }}>
              ⚠️ {draftError || errorMessage}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deals List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {visible.map((item, index) => (
            <PipelineCard
              key={item.id}
              item={item}
              edits={editsById[item.id] ?? {}}
              onUpdateEdit={(updates) => updateEdit(item, updates)}
              onArchive={async () => {
                const succeeded = await handleSavePipelineItem({ ...item, archived: !item.archived });
                if (!succeeded) {
                  console.error("Failed to update archive status");
                }
              }}
              onDelete={async () => {
                const succeeded = await handleDeletePipelineItem(item.id);
                if (!succeeded) {
                  console.error("Failed to delete pipeline item");
                }
              }}
              index={index}
            />
          ))}
        </AnimatePresence>

        {visible.length === 0 && <EmptyState isArchive={showPastDeals} />}
      </div>

      {/* Decorative Bottom */}
      <motion.div
        className="mt-8 flex items-center justify-center gap-2 text-white/30"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <span className="h-1 w-8 rounded-full bg-current" />
        <span className="text-xs font-bold tracking-widest">PIPELINE TRACKER</span>
        <span className="h-1 w-8 rounded-full bg-current" />
      </motion.div>
    </div>
  );
};

export default PipelineTracker;
