import React from "react";
import GlassButton from "../../../../../components/ui/GlassButton";
import GlassCard from "../../../../../components/ui/GlassCard";
import { inputBase, sectionTitle } from "../../../shared/styles";
import { startOfWeekMondayChicago } from "../../../shared/utils/date";
import { TaskTemplate } from "../../../shared/types";
import { earliestWeekStart, useTasksModule } from "../hooks";

const TasksTracker: React.FC = () => {
  const {
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

  const renderTaskRow = (template: TaskTemplate) => {
    const status = statusByTask[template.id];
    return (
      <div
        key={template.id}
        className="flex h-full flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-3 md:p-4 shadow-sm"
      >
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 h-5 w-5 cursor-pointer rounded border-white/40 bg-white/10 text-primary focus:ring-primary"
            checked={!!status?.completed}
            onChange={(e) => upsertTaskStatus(template.id, { completed: e.target.checked })}
          />
          <div className="flex flex-col gap-1">
            <span className={`text-sm ${template.active ? "text-white" : "text-white/50 line-through"}`}>
              {template.text}
            </span>
            {!template.active && <span className="text-xs text-white/50">Archived</span>}
          </div>
        </div>
        <div className="grid flex-1 gap-2 sm:grid-cols-2">
          <input
            className={inputBase}
            placeholder="Proof link"
            value={status?.proof_url || ""}
            onChange={(e) => upsertTaskStatus(template.id, { proof_url: e.target.value })}
          />
          <input
            className={inputBase}
            placeholder="Note"
            value={status?.note || ""}
            onChange={(e) => upsertTaskStatus(template.id, { note: e.target.value })}
          />
        </div>
      </div>
    );
  };

  const renderTemplateManager = () => {
    const activeCount = templateGroups.flatMap((group) => group.tasks).filter((t) => t.active).length;
    const archivedCount = templateGroups.flatMap((group) => group.tasks).length - activeCount;
    const visibleGroups = templateGroups.filter((group) =>
      showArchivedTemplates ? true : group.tasks.some((t) => t.active)
    );
    const firstVisibleCategory = visibleGroups[0]?.category;
    const lastVisibleCategory = visibleGroups[visibleGroups.length - 1]?.category;

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-white/60">Manage weekly tasks</p>
            <h3 className="text-2xl font-semibold text-white">Manage Tasks</h3>
            <p className="text-sm text-white/70">Create, reorder, and archive your weekly task templates.</p>
          </div>
          <button
            className="rounded-full bg-white/15 px-4 py-2 text-sm text-white hover:bg-white/25"
            onClick={() => setManageTemplatesOpen(false)}
          >
            Close
          </button>
        </div>

        <div className="grid items-end gap-3 md:grid-cols-[1fr_2fr_auto]">
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wide text-white/70">Category</label>
            <input
              className={inputBase}
              placeholder="Category"
              value={newTemplate.category}
              onChange={(e) => setNewTemplate((prev) => ({ ...prev, category: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wide text-white/70">Task</label>
            <input
              className={inputBase}
              placeholder="Weekly task"
              value={newTemplate.text}
              onChange={(e) => setNewTemplate((prev) => ({ ...prev, text: e.target.value }))}
            />
          </div>
          <button
            className="rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-white"
            onClick={handleTemplateCreate}
          >
            Add Task
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-white/70">
            {activeCount} active • {archivedCount} archived
          </p>
          <button
            className="rounded-full bg-white/10 px-4 py-2 text-xs text-white hover:bg-white/20"
            onClick={() => setShowArchivedTemplates((prev) => !prev)}
          >
            {showArchivedTemplates ? "Hide archived" : "Show archived"}
          </button>
        </div>

        <div className="space-y-6">
          {visibleGroups.map((group) => {
            const tasks = showArchivedTemplates ? group.tasks : group.tasks.filter((t) => t.active);
            return (
              <div key={group.category} className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-white/60">Category</p>
                    <h4 className="text-lg font-semibold text-white">{group.category}</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="rounded bg-white/10 px-3 py-2 text-xs text-white hover:bg-white/20 disabled:opacity-50"
                      onClick={() => handleCategoryMove(group.category, "up")}
                      disabled={orderingBusy || group.category === firstVisibleCategory}
                    >
                      Move up
                    </button>
                    <button
                      className="rounded bg-white/10 px-3 py-2 text-xs text-white hover:bg-white/20 disabled:opacity-50"
                      onClick={() => handleCategoryMove(group.category, "down")}
                      disabled={orderingBusy || group.category === lastVisibleCategory}
                    >
                      Move down
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {tasks.map((template, idx) => (
                    <div
                      key={template.id}
                      className="flex h-full flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-2">
                          <input
                            className={inputBase}
                            value={template.text}
                            placeholder="Task name"
                            onChange={(e) => handleTemplateUpdate(template, { text: e.target.value })}
                          />
                          <div className="grid gap-2 sm:grid-cols-2">
                            <input
                              className={inputBase}
                              value={template.category}
                              placeholder="Category"
                              onChange={(e) => handleTemplateUpdate(template, { category: e.target.value })}
                            />
                            <label className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs text-white/70">
                              <input
                                type="checkbox"
                                checked={template.active}
                                onChange={(e) => handleTemplateUpdate(template, { active: e.target.checked })}
                              />
                              Active
                            </label>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
                            <button
                              className="rounded bg-white/10 px-3 py-1 text-white hover:bg-white/20"
                              onClick={() => handleTemplateUpdate(template, { active: !template.active })}
                            >
                              {template.active ? "Archive" : "Restore"}
                            </button>
                            <button
                              className="rounded bg-red-500/20 px-3 py-1 text-red-100 hover:bg-red-500/30"
                              onClick={() => handleTemplateDelete(template)}
                            >
                              Delete
                            </button>
                            <span className="rounded-full bg-white/5 px-2 py-1">
                              {template.category || "Uncategorized"}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            className="rounded-lg bg-white/10 px-3 py-2 text-xs text-white hover:bg-white/20 disabled:opacity-50"
                            onClick={() => handleTaskMove(template.id, "up")}
                            disabled={orderingBusy || idx === 0}
                          >
                            Move up
                          </button>
                          <button
                            className="rounded-lg bg-white/10 px-3 py-2 text-xs text-white hover:bg-white/20 disabled:opacity-50"
                            onClick={() => handleTaskMove(template.id, "down")}
                            disabled={orderingBusy || idx === tasks.length - 1}
                          >
                            Move down
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {!visibleGroups.length && <p className="text-sm text-white/60">No tasks yet.</p>}
        </div>
      </div>
    );
  };

  const activeGroups = templateGroups
    .map((group) => ({ ...group, tasks: group.tasks.filter((t) => t.active) }))
    .filter((group) => group.tasks.length);

  return (
    <>
      <div className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-white/60">Week</p>
            <p className="text-lg font-semibold text-white">{formatWeekLabel(activeWeekStart)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="rounded bg-white/10 px-3 py-2 text-white hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={() => setActiveWeekStart((week) => clampWeekStart(shiftWeek(week, -1)))}
              disabled={activeWeekStart <= earliestWeekStart}
            >
              Prev
            </button>
            <input
              type="date"
              className={inputBase}
              value={activeWeekStart}
              onChange={(e) =>
                setActiveWeekStart(
                  clampWeekStart(startOfWeekMondayChicago(new Date(`${e.target.value}T00:00:00`)))
                )
              }
            />
            <button
              className="rounded bg-white/10 px-3 py-2 text-white hover:bg-white/20"
              onClick={() => setActiveWeekStart((week) => clampWeekStart(shiftWeek(week, 1)))}
            >
              Next
            </button>
          </div>
          <div className="flex items-center gap-2">
            <GlassButton className="px-3 py-2" onClick={() => setIsSnapshotModalOpen(true)}>
              Close Week
            </GlassButton>
            <GlassButton className="px-3 py-2" onClick={() => setManageTemplatesOpen(true)}>
              Manage Tasks
            </GlassButton>
          </div>
        </div>

        {snapshots[activeWeekStart] && (
          <GlassCard className="p-4">
            <h3 className={sectionTitle}>Snapshot saved</h3>
            <p className="text-sm text-white/70">{snapshots[activeWeekStart]?.next_week_focus}</p>
          </GlassCard>
        )}
        {activeWeekStart <= earliestWeekStart && (
          <GlassCard className="p-4">
            <p className="text-sm text-white/70">
              Earliest tracked week is Feb 2 - Feb 8. You can't go back further.
            </p>
          </GlassCard>
        )}

        <div className="grid gap-5 xl:gap-6 grid-cols-1 lg:grid-cols-[repeat(2,minmax(700px,1fr))]">
          {templatesLoading ? (
            <p className="text-sm text-white/60">Loading templates...</p>
          ) : activeGroups.length ? (
            activeGroups.map((group) => (
              <GlassCard key={group.category} className="w-full max-w-none p-8 md:p-9">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className={sectionTitle}>{group.category}</h3>
                </div>
                <div className="flex flex-col gap-3">
                  {group.tasks.map((template) => renderTaskRow(template))}
                </div>
              </GlassCard>
            ))
          ) : (
            <p className="text-sm text-white/60">No templates yet. Add one to get started.</p>
          )}
        </div>
      </div>

      {manageTemplatesOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-8"
          onClick={() => setManageTemplatesOpen(false)}
        >
          <div
            className="w-full max-w-5xl rounded-2xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {renderTemplateManager()}
          </div>
        </div>
      )}

      {isSnapshotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-xl rounded-2xl bg-white/10 p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Close Week</h3>
              <button
                className="rounded bg-white/10 px-3 py-1 text-white hover:bg-white/20"
                aria-label="Close snapshot modal"
                onClick={() => setIsSnapshotModalOpen(false)}
              >
                x
              </button>
            </div>
            <p className="mt-1 text-sm text-white/70">{formatWeekLabel(activeWeekStart)}</p>
            <div className="mt-4 grid gap-3">
              <input
                className={inputBase}
                placeholder="Build milestone"
                value={snapshotDraft.build_milestone || ""}
                onChange={(e) => setSnapshotDraft((d) => ({ ...d, build_milestone: e.target.value }))}
              />
              <input
                className={inputBase}
                placeholder="Best demo hook URL"
                value={snapshotDraft.best_demo_hook_url || ""}
                onChange={(e) => setSnapshotDraft((d) => ({ ...d, best_demo_hook_url: e.target.value }))}
              />
              <input
                className={inputBase}
                placeholder="Best demo walkthrough URL"
                value={snapshotDraft.best_demo_walkthrough_url || ""}
                onChange={(e) => setSnapshotDraft((d) => ({ ...d, best_demo_walkthrough_url: e.target.value }))}
              />
              <textarea
                className={`${inputBase} min-h-[80px]`}
                placeholder="Internship progress"
                value={snapshotDraft.paid_work_progress || ""}
                onChange={(e) => setSnapshotDraft((d) => ({ ...d, paid_work_progress: e.target.value }))}
              />
              <textarea
                className={`${inputBase} min-h-[80px]`}
                placeholder="Traction progress"
                value={snapshotDraft.traction_progress || ""}
                onChange={(e) => setSnapshotDraft((d) => ({ ...d, traction_progress: e.target.value }))}
              />
              <textarea
                className={`${inputBase} min-h-[80px]`}
                placeholder="Next week focus"
                value={snapshotDraft.next_week_focus || ""}
                onChange={(e) => setSnapshotDraft((d) => ({ ...d, next_week_focus: e.target.value }))}
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="rounded bg-white/10 px-4 py-2 text-white hover:bg-white/20"
                onClick={() => setIsSnapshotModalOpen(false)}
              >
                Cancel
              </button>
              <GlassButton className="px-4 py-2" onClick={handleSnapshotSave}>
                Save Snapshot
              </GlassButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TasksTracker;
