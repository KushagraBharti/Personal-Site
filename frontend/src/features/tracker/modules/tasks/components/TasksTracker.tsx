import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TaskTemplate, TaskStatus, WeeklySnapshot } from "../../../shared/types";
import { earliestWeekStart, useTasksModule } from "../hooks";
import { startOfWeekMondayChicago } from "../../../shared/utils/date";

// ============================================================================
// CONFETTI EXPLOSION
// ============================================================================

const Confetti: React.FC<{ trigger: boolean }> = ({ trigger }) => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; color: string }>>([]);

  useEffect(() => {
    if (trigger) {
      const colors = ["var(--neo-lime)", "var(--neo-pink)", "var(--neo-cyan)", "var(--neo-yellow)"];
      const newParticles = Array.from({ length: 12 }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 100 - 50,
        color: colors[Math.floor(Math.random() * colors.length)],
      }));
      setParticles(newParticles);
      setTimeout(() => setParticles([]), 1000);
    }
  }, [trigger]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-3 h-3"
          style={{ background: p.color, border: "2px solid var(--neo-black)", left: "50%" }}
          initial={{ y: 0, x: 0, opacity: 1, rotate: 0 }}
          animate={{
            y: -100 - Math.random() * 50,
            x: p.x,
            opacity: 0,
            rotate: Math.random() * 360,
          }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      ))}
    </div>
  );
};

// ============================================================================
// PROGRESS RING
// ============================================================================

const ProgressRing: React.FC<{ progress: number; size?: number }> = ({ progress, size = 100 }) => {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--neo-black)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--neo-lime)"
          strokeWidth={strokeWidth}
          strokeLinecap="square"
          initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span
          className="text-2xl font-black"
          style={{ fontFamily: "var(--neo-font-display)" }}
          key={progress}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          {Math.round(progress)}%
        </motion.span>
      </div>
    </div>
  );
};

// ============================================================================
// TASK CHECKBOX
// ============================================================================

const TaskCheckbox: React.FC<{
  checked: boolean;
  onChange: () => void;
}> = ({ checked, onChange }) => {
  const [justChecked, setJustChecked] = useState(false);

  const handleClick = () => {
    if (!checked) setJustChecked(true);
    onChange();
  };

  useEffect(() => {
    if (justChecked) {
      const timer = setTimeout(() => setJustChecked(false), 500);
      return () => clearTimeout(timer);
    }
  }, [justChecked]);

  return (
    <div className="relative">
      <Confetti trigger={justChecked} />
      <motion.button
        onClick={handleClick}
        className="w-8 h-8 flex items-center justify-center"
        style={{
          background: checked ? "var(--neo-lime)" : "var(--neo-white)",
          border: "4px solid var(--neo-black)",
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <AnimatePresence>
          {checked && (
            <motion.span
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              className="text-xl font-black"
            >
              ✓
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};

// ============================================================================
// WEEK NAVIGATOR
// ============================================================================

const WeekNavigator: React.FC<{
  weekLabel: string;
  weekStart: string;
  onPrev: () => void;
  onNext: () => void;
  canGoPrev: boolean;
  onDateChange: (date: string) => void;
}> = ({ weekLabel, weekStart, onPrev, onNext, canGoPrev, onDateChange }) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <motion.button
        onClick={onPrev}
        disabled={!canGoPrev}
        className="neo-btn neo-btn-sm neo-btn-white"
        style={{ opacity: canGoPrev ? 1 : 0.4 }}
        whileHover={canGoPrev ? { x: -4 } : {}}
        whileTap={canGoPrev ? { scale: 0.9 } : {}}
      >
        ← PREV
      </motion.button>

      <motion.div
        key={weekLabel}
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="neo-card p-3"
        style={{ background: "var(--neo-cyan)" }}
      >
      <input
        type="date"
        className="neo-input w-auto"
        onChange={(e) => onDateChange(e.target.value)}
        value={weekStart}
        style={{
          background: "var(--neo-white)",
          border: "4px solid var(--neo-black)",
          padding: "8px",
          borderRadius: "4px",
          fontFamily: "inherit",
          fontSize: "16px",
        }}
      />
      </motion.div>

      <motion.button
        onClick={onNext}
        className="neo-btn neo-btn-sm neo-btn-white"
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.9 }}
      >
        NEXT →
      </motion.button>

    </div>
  );
};

// ============================================================================
// TASK ROW
// ============================================================================

const TaskRow: React.FC<{
  template: TaskTemplate;
  status: TaskStatus | undefined;
  onToggle: () => void;
  onProofChange: (url: string) => void;
  onNoteChange: (note: string) => void;
  index: number;
}> = ({ template, status, onToggle, onProofChange, onNoteChange, index }) => {
  const [expanded, setExpanded] = useState(false);
  const completed = status?.completed ?? false;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="neo-card"
      style={{
        background: completed ? "var(--neo-lime)" : "var(--neo-white)",
        padding: "16px",
        boxShadow: "4px 4px 0 var(--neo-black)",
      }}
    >
      <div className="flex items-start gap-4">
        <TaskCheckbox checked={completed} onChange={onToggle} />

        <div className="flex-1 min-w-0">
          <p
            className="font-bold text-sm"
            style={{
              fontFamily: "var(--neo-font-mono)",
              textDecoration: completed ? "line-through" : "none",
            }}
          >
            {template.text}
          </p>

          <motion.button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 neo-label text-xs flex items-center gap-1 hover:underline"
          >
            <motion.span animate={{ rotate: expanded ? 90 : 0 }}>→</motion.span>
            {expanded ? "HIDE" : "DETAILS"}
          </motion.button>
        </div>

        {completed && (
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            className="neo-tag neo-tag-yellow text-xs"
          >
            DONE!
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t-4 border-black space-y-3">
              <div>
                <label className="neo-label text-xs block mb-1">PROOF URL</label>
                <input
                  type="url"
                  className="neo-input"
                  placeholder="https://..."
                  value={status?.proof_url ?? ""}
                  onChange={(e) => onProofChange(e.target.value)}
                />
              </div>
              <div>
                <label className="neo-label text-xs block mb-1">NOTES</label>
                <textarea
                  className="neo-input"
                  rows={2}
                  placeholder="Additional notes..."
                  value={status?.note ?? ""}
                  onChange={(e) => onNoteChange(e.target.value)}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ============================================================================
// CATEGORY SECTION
// ============================================================================

const CategorySection: React.FC<{
  category: string;
  templates: TaskTemplate[];
  statusByTask: Record<string, TaskStatus>;
  onToggle: (templateId: string) => void;
  onProofChange: (templateId: string, url: string) => void;
  onNoteChange: (templateId: string, note: string) => void;
  categoryIndex: number;
}> = ({
  category,
  templates,
  statusByTask,
  onToggle,
  onProofChange,
  onNoteChange,
  categoryIndex,
}) => {
  const completedCount = templates.filter((t) => statusByTask[t.id]?.completed).length;
  const totalCount = templates.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const colors = [
    "var(--neo-yellow)",
    "var(--neo-pink)",
    "var(--neo-cyan)",
    "var(--neo-purple)",
    "var(--neo-orange)",
  ];
  const color = colors[categoryIndex % colors.length];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: categoryIndex * 0.1 }}
      className="neo-card"
      style={{ background: color }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <motion.div
            className="neo-label-rotated"
            style={{ background: "var(--neo-white)" }}
            whileHover={{ rotate: [-3, 3, -3] }}
            transition={{ duration: 0.3 }}
          >
            {category.toUpperCase()}
          </motion.div>
          <span className="neo-label text-xs">
            {completedCount}/{totalCount}
          </span>
        </div>

        <div className="w-32 h-5 border-4 border-black bg-white overflow-hidden">
          <motion.div
            className="h-full"
            style={{ background: "var(--neo-lime)" }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {templates.map((template, index) => (
          <TaskRow
            key={template.id}
            template={template}
            status={statusByTask[template.id]}
            onToggle={() => onToggle(template.id)}
            onProofChange={(url) => onProofChange(template.id, url)}
            onNoteChange={(note) => onNoteChange(template.id, note)}
            index={index}
          />
        ))}
      </div>
    </motion.section>
  );
};

// ============================================================================
// SNAPSHOT MODAL
// ============================================================================

const SnapshotModal: React.FC<{
  weekLabel: string;
  draft: WeeklySnapshot;
  setDraft: React.Dispatch<React.SetStateAction<WeeklySnapshot>>;
  onClose: () => void;
  onSave: () => void;
}> = ({ weekLabel, draft, setDraft, onClose, onSave }) => {
  const fields = [
    { key: "build_milestone", label: "BUILD MILESTONE", placeholder: "What did you ship?" },
    { key: "best_demo_hook_url", label: "DEMO HOOK URL", placeholder: "https://..." },
    { key: "best_demo_walkthrough_url", label: "DEMO WALKTHROUGH URL", placeholder: "https://..." },
    { key: "paid_work_progress", label: "PAID WORK PROGRESS", placeholder: "Revenue, clients...", textarea: true },
    { key: "traction_progress", label: "TRACTION PROGRESS", placeholder: "Users, growth...", textarea: true },
    { key: "next_week_focus", label: "NEXT WEEK FOCUS", placeholder: "Top priorities...", textarea: true },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20, rotate: -2 }}
        animate={{ scale: 1, y: 0, rotate: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="neo-card w-full max-w-2xl max-h-[90vh] overflow-auto"
        style={{ background: "var(--neo-yellow)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="neo-label-rotated inline-block mb-2" style={{ background: "var(--neo-pink)" }}>
              CLOSE WEEK
            </div>
            <h2
              className="text-2xl font-black"
              style={{ fontFamily: "var(--neo-font-display)" }}
            >
              WEEKLY SNAPSHOT
            </h2>
            <p className="neo-label text-xs mt-1">{weekLabel}</p>
          </div>
          <motion.button
            onClick={onClose}
            className="neo-btn neo-btn-sm neo-btn-pink"
            whileTap={{ scale: 0.9 }}
          >
            ✕
          </motion.button>
        </div>

        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="neo-label text-xs block mb-2">{field.label}</label>
              {field.textarea ? (
                <textarea
                  className="neo-input"
                  rows={3}
                  placeholder={field.placeholder}
                  value={(draft as any)[field.key] ?? ""}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                />
              ) : (
                <input
                  className="neo-input"
                  placeholder={field.placeholder}
                  value={(draft as any)[field.key] ?? ""}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <motion.button
            onClick={onSave}
            className="neo-btn neo-btn-lime flex-1"
            whileTap={{ scale: 0.95 }}
          >
            💾 SAVE SNAPSHOT
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============================================================================
// TEMPLATE MANAGER MODAL
// ============================================================================

const TemplateManagerModal: React.FC<{
  templates: TaskTemplate[];
  newTemplate: { category: string; text: string };
  setNewTemplate: React.Dispatch<React.SetStateAction<{ category: string; text: string }>>;
  showArchived: boolean;
  setShowArchived: React.Dispatch<React.SetStateAction<boolean>>;
  onClose: () => void;
  onCreate: () => void;
  onUpdate: (template: TaskTemplate, updates: Partial<TaskTemplate>) => void;
  onDelete: (template: TaskTemplate) => void;
  onCategoryMove: (category: string, direction: "up" | "down") => void;
  onTaskMove: (templateId: string, direction: "up" | "down") => void;
  orderingBusy: boolean;
  templateGroups: Array<{ category: string; tasks: TaskTemplate[] }>;
}> = ({
  templates,
  newTemplate,
  setNewTemplate,
  showArchived,
  setShowArchived,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  onCategoryMove,
  onTaskMove,
  orderingBusy,
  templateGroups,
}) => {
  const activeCount = templates.filter((t) => t.active).length;
  const archivedCount = templates.length - activeCount;

  const visibleGroups = templateGroups.filter((group) =>
    showArchived ? true : group.tasks.some((t) => t.active)
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-start justify-center p-4 z-50 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="neo-card w-full max-w-4xl my-8"
        style={{ background: "var(--neo-pink)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2
              className="text-2xl font-black"
              style={{ fontFamily: "var(--neo-font-display)" }}
            >
              MANAGE TEMPLATES
            </h2>
            <p className="neo-label text-xs mt-1">
              {activeCount} ACTIVE • {archivedCount} ARCHIVED
            </p>
          </div>
          <div className="flex gap-2">
            <motion.button
              onClick={() => setShowArchived(!showArchived)}
              className="neo-btn neo-btn-sm neo-btn-white"
              whileTap={{ scale: 0.9 }}
            >
              {showArchived ? "HIDE ARCHIVED" : "SHOW ARCHIVED"}
            </motion.button>
            <motion.button
              onClick={onClose}
              className="neo-btn neo-btn-sm neo-btn-yellow"
              whileTap={{ scale: 0.9 }}
            >
              ✕
            </motion.button>
          </div>
        </div>

        {/* Add new template */}
        <div className="neo-card mb-6" style={{ background: "var(--neo-white)" }}>
          <p className="neo-label text-xs mb-3">ADD NEW TEMPLATE</p>
          <div className="grid gap-3 md:grid-cols-[1fr_2fr_auto]">
            <input
              className="neo-input"
              placeholder="Category"
              value={newTemplate.category}
              onChange={(e) => setNewTemplate((prev) => ({ ...prev, category: e.target.value }))}
            />
            <input
              className="neo-input"
              placeholder="Task description"
              value={newTemplate.text}
              onChange={(e) => setNewTemplate((prev) => ({ ...prev, text: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && onCreate()}
            />
            <motion.button
              onClick={onCreate}
              className="neo-btn neo-btn-lime"
              whileTap={{ scale: 0.9 }}
            >
              + ADD
            </motion.button>
          </div>
        </div>

        {/* Existing templates */}
        <div className="space-y-6">
          {visibleGroups.map((group, groupIndex) => {
            const tasks = showArchived ? group.tasks : group.tasks.filter((t) => t.active);
            return (
              <div key={group.category}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="neo-label">{group.category.toUpperCase()}</span>
                    <span className="text-xs">({tasks.length} tasks)</span>
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => onCategoryMove(group.category, "up")}
                      disabled={orderingBusy || groupIndex === 0}
                      className="neo-btn neo-btn-sm neo-btn-white"
                      style={{ opacity: groupIndex === 0 ? 0.4 : 1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      ↑
                    </motion.button>
                    <motion.button
                      onClick={() => onCategoryMove(group.category, "down")}
                      disabled={orderingBusy || groupIndex === visibleGroups.length - 1}
                      className="neo-btn neo-btn-sm neo-btn-white"
                      style={{ opacity: groupIndex === visibleGroups.length - 1 ? 0.4 : 1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      ↓
                    </motion.button>
                  </div>
                </div>

                <div className="space-y-2">
                  {tasks.map((template, idx) => (
                    <div
                      key={template.id}
                      className="neo-card p-3 flex items-center gap-3"
                      style={{
                        background: template.active ? "var(--neo-white)" : "var(--neo-white)",
                        opacity: template.active ? 1 : 0.6,
                      }}
                    >
                      <div className="flex flex-col gap-1">
                        <motion.button
                          onClick={() => onTaskMove(template.id, "up")}
                          disabled={orderingBusy || idx === 0}
                          className="text-xs px-2 py-1 border-2 border-black bg-white hover:bg-gray-100"
                          style={{ opacity: idx === 0 ? 0.4 : 1 }}
                        >
                          ↑
                        </motion.button>
                        <motion.button
                          onClick={() => onTaskMove(template.id, "down")}
                          disabled={orderingBusy || idx === tasks.length - 1}
                          className="text-xs px-2 py-1 border-2 border-black bg-white hover:bg-gray-100"
                          style={{ opacity: idx === tasks.length - 1 ? 0.4 : 1 }}
                        >
                          ↓
                        </motion.button>
                      </div>
                      <span
                        className="flex-1 font-mono text-sm"
                        style={{ textDecoration: template.active ? "none" : "line-through" }}
                      >
                        {template.text}
                      </span>
                      <div className="flex gap-2">
                        <motion.button
                          onClick={() => onUpdate(template, { active: !template.active })}
                          className="neo-btn neo-btn-sm neo-btn-cyan"
                          whileTap={{ scale: 0.9 }}
                        >
                          {template.active ? "ARCHIVE" : "RESTORE"}
                        </motion.button>
                        <motion.button
                          onClick={() => onDelete(template)}
                          className="neo-btn neo-btn-sm"
                          style={{ background: "var(--neo-red)", color: "white" }}
                          whileTap={{ scale: 0.9 }}
                        >
                          🗑
                        </motion.button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {visibleGroups.length === 0 && (
            <p className="neo-label text-center py-8">NO TEMPLATES YET</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const TasksTracker: React.FC = () => {
  const {
    templates,
    templatesLoading,
    templateGroups,
    activeWeekStart,
    setActiveWeekStart,
    isSnapshotModalOpen,
    setIsSnapshotModalOpen,
    snapshotDraft,
    setSnapshotDraft,
    snapshots,
    manageTemplatesOpen,
    setManageTemplatesOpen,
    showArchivedTemplates,
    setShowArchivedTemplates,
    newTemplate,
    setNewTemplate,
    orderingBusy,
    statusByTask,
    handleTemplateCreate,
    handleTemplateUpdate,
    handleTemplateDelete,
    handleCategoryMove,
    handleTaskMove,
    handleSnapshotSave,
    upsertTaskStatus,
    clampWeekStart,
    formatWeekLabel,
    shiftWeek,
  } = useTasksModule();

  // Filter for active templates only
  const activeGroups = templateGroups
    .map((group) => ({ ...group, tasks: group.tasks.filter((t) => t.active) }))
    .filter((group) => group.tasks.length);

  // Calculate overall progress
  const activeTasks = templates.filter((t) => t.active);
  const completedTasks = activeTasks.filter((t) => statusByTask[t.id]?.completed);
  const overallProgress = activeTasks.length > 0 ? (completedTasks.length / activeTasks.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="neo-card"
        style={{ background: "var(--neo-lime)" }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="neo-label-rotated inline-block mb-2" style={{ background: "var(--neo-pink)" }}>
              WEEKLY EXECUTION
            </div>
            <h2
              className="text-3xl font-black"
              style={{ fontFamily: "var(--neo-font-display)" }}
            >
              TASK TRACKER
            </h2>
            <p className="neo-label text-sm mt-2">
              {completedTasks.length} OF {activeTasks.length} TASKS COMPLETE
            </p>
          </div>

          <div className="flex items-center gap-6">
            <ProgressRing progress={overallProgress} />

            <div className="flex flex-col gap-2">
              <motion.button
                onClick={() => setIsSnapshotModalOpen(true)}
                className="neo-btn neo-btn-sm neo-btn-yellow"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                📸 CLOSE WEEK
              </motion.button>
              <motion.button
                onClick={() => setManageTemplatesOpen(true)}
                className="neo-btn neo-btn-sm neo-btn-cyan"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ⚙️ TEMPLATES
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Week Navigator */}
      <WeekNavigator
        weekLabel={formatWeekLabel(activeWeekStart)}
        weekStart={activeWeekStart}
        onPrev={() => setActiveWeekStart((week) => clampWeekStart(shiftWeek(week, -1)))}
        onNext={() => setActiveWeekStart((week) => clampWeekStart(shiftWeek(week, 1)))}
        canGoPrev={activeWeekStart > earliestWeekStart}
        onDateChange={(date) =>
          setActiveWeekStart(clampWeekStart(startOfWeekMondayChicago(new Date(`${date}T00:00:00`))))
        }
      />

      {/* Snapshot saved notice */}
      {snapshots[activeWeekStart] && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="neo-card p-4"
          style={{ background: "var(--neo-cyan)" }}
        >
          <p className="neo-label text-xs">SNAPSHOT SAVED</p>
          <p className="font-mono text-sm mt-1">{snapshots[activeWeekStart]?.next_week_focus}</p>
        </motion.div>
      )}

      {/* Loading state */}
      {templatesLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-black"
            style={{ borderTopColor: "var(--neo-lime)" }}
          />
          <p className="neo-label mt-4">LOADING TASKS...</p>
        </div>
      ) : (
        /* Categories */
        <div className="grid gap-6 lg:grid-cols-2">
          {activeGroups.map((group, index) => (
            <CategorySection
              key={group.category}
              category={group.category}
              templates={group.tasks}
              statusByTask={statusByTask}
              onToggle={(templateId) =>
                upsertTaskStatus(templateId, { completed: !statusByTask[templateId]?.completed })
              }
              onProofChange={(templateId, url) => upsertTaskStatus(templateId, { proof_url: url })}
              onNoteChange={(templateId, note) => upsertTaskStatus(templateId, { note })}
              categoryIndex={index}
            />
          ))}

          {activeGroups.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="neo-card text-center py-12 lg:col-span-2"
              style={{ background: "var(--neo-yellow)" }}
            >
              <p className="text-5xl mb-4">📝</p>
              <h3
                className="text-xl font-black mb-2"
                style={{ fontFamily: "var(--neo-font-display)" }}
              >
                NO TEMPLATES YET
              </h3>
              <p className="neo-label mb-4">Create templates to start tracking your weekly tasks</p>
              <motion.button
                onClick={() => setManageTemplatesOpen(true)}
                className="neo-btn neo-btn-pink"
                whileTap={{ scale: 0.95 }}
              >
                + ADD TEMPLATES
              </motion.button>
            </motion.div>
          )}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {isSnapshotModalOpen && (
          <SnapshotModal
            weekLabel={formatWeekLabel(activeWeekStart)}
            draft={snapshotDraft}
            setDraft={setSnapshotDraft}
            onClose={() => setIsSnapshotModalOpen(false)}
            onSave={handleSnapshotSave}
          />
        )}
        {manageTemplatesOpen && (
          <TemplateManagerModal
            templates={templates}
            newTemplate={newTemplate}
            setNewTemplate={setNewTemplate}
            showArchived={showArchivedTemplates}
            setShowArchived={setShowArchivedTemplates}
            onClose={() => setManageTemplatesOpen(false)}
            onCreate={handleTemplateCreate}
            onUpdate={handleTemplateUpdate}
            onDelete={handleTemplateDelete}
            onCategoryMove={handleCategoryMove}
            onTaskMove={handleTaskMove}
            orderingBusy={orderingBusy}
            templateGroups={templateGroups}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TasksTracker;
