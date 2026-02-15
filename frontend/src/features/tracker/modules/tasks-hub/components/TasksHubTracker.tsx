
import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTasksHubModule } from "../hooks";
import {
  RecurrenceType,
  RecurrenceUnit,
  TaskDraft,
  TaskSortMode,
  TrackerTask,
} from "../types";
import "../../../styles/neo-brutal.css";
import "./tasks-hub.css";

const SORT_OPTIONS: Array<{ value: TaskSortMode; label: string }> = [
  { value: "due_date", label: "Due" },
  { value: "date_created", label: "Created" },
  { value: "title", label: "Title" },
  { value: "custom", label: "Custom" },
];

const RECURRENCE_OPTIONS: Array<{ value: RecurrenceType; label: string }> = [
  { value: "none", label: "No repeat" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Biweekly" },
  { value: "custom", label: "Custom" },
];

const toLocalDateTimeInput = (isoString: string | null | undefined) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const toIsoOrNull = (dateTimeLocal: string) => {
  const trimmed = dateTimeLocal.trim();
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
};

const toLocalInputFromDate = (date: Date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const quickDue = (kind: "later" | "tonight" | "tomorrow" | "nextweek") => {
  const base = new Date();
  if (kind === "later") {
    base.setHours(base.getHours() + 2, 0, 0, 0);
    return toLocalInputFromDate(base);
  }
  if (kind === "tonight") {
    base.setHours(20, 0, 0, 0);
    return toLocalInputFromDate(base);
  }
  if (kind === "tomorrow") {
    base.setDate(base.getDate() + 1);
    base.setHours(9, 0, 0, 0);
    return toLocalInputFromDate(base);
  }
  base.setDate(base.getDate() + 7);
  base.setHours(9, 0, 0, 0);
  return toLocalInputFromDate(base);
};

const formatDue = (isoString: string | null) => {
  if (!isoString) return "No due date";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "No due date";
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const toDueDayKey = (isoString: string | null) => {
  if (!isoString) return "no-date";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "no-date";
  return date.toDateString();
};

const dueGroupLabel = (isoString: string | null) => {
  if (!isoString) return "No date";
  const due = new Date(isoString);
  if (Number.isNaN(due.getTime())) return "No date";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const dayDiff = Math.round((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));

  if (dayDiff === 0) return "Today";
  if (dayDiff === 1) return "Tomorrow";
  if (dayDiff === -1) return "Yesterday";

  return due.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const setTimeToTenPm = (localDateTimeValue: string) => {
  const trimmed = localDateTimeValue.trim();
  if (!trimmed || !trimmed.includes("T")) return "";
  const datePart = trimmed.split("T")[0];
  return `${datePart}T22:00`;
};

const isDueWithinThreeDays = (isoString: string | null) => {
  if (!isoString) return false;
  const due = new Date(isoString);
  if (Number.isNaN(due.getTime())) return false;
  const now = new Date();
  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
  return due.getTime() - now.getTime() <= threeDaysMs;
};

const dueChipClassName = (isoString: string | null) =>
  `tasks-chip tasks-chip-due ${isDueWithinThreeDays(isoString) ? "tasks-chip-due-urgent" : "tasks-chip-due-normal"}`;

const recurrenceLabel = (task: TrackerTask) => {
  if (task.recurrence_type === "none") return "";
  if (task.recurrence_type === "daily") return "Repeats daily";
  if (task.recurrence_type === "weekly") return "Repeats weekly";
  if (task.recurrence_type === "biweekly") return "Repeats biweekly";
  const interval = Math.max(task.recurrence_interval ?? 1, 1);
  const unit = task.recurrence_unit ?? "week";
  return `Every ${interval} ${unit}${interval === 1 ? "" : "s"}`;
};

type TaskEditDraft = {
  title: string;
  details: string;
  due_at: string;
  recurrence_type: RecurrenceType;
  recurrence_interval: number;
  recurrence_unit: RecurrenceUnit;
  recurrence_ends_at: string;
};

const createTaskEditDraft = (task: TrackerTask): TaskEditDraft => ({
  title: task.title,
  details: task.details ?? "",
  due_at: toLocalDateTimeInput(task.due_at),
  recurrence_type: task.recurrence_type,
  recurrence_interval: Math.max(task.recurrence_interval ?? 1, 1),
  recurrence_unit: task.recurrence_unit ?? "week",
  recurrence_ends_at: toLocalDateTimeInput(task.recurrence_ends_at),
});

const draftKey = (listId: string, parentTaskId: string | null) => `${listId}:${parentTaskId ?? "root"}`;

const TaskRecurrenceFields: React.FC<{
  value: {
    recurrence_type: RecurrenceType;
    recurrence_interval: number;
    recurrence_unit: RecurrenceUnit;
    recurrence_ends_at: string;
  };
  onChange: (patch: {
    recurrence_type?: RecurrenceType;
    recurrence_interval?: number;
    recurrence_unit?: RecurrenceUnit;
    recurrence_ends_at?: string;
  }) => void;
}> = ({ value, onChange }) => {
  return (
    <div className="grid gap-2 md:grid-cols-4">
      <div>
        <label className="neo-label">Repeat</label>
        <select
          className="tasks-select"
          value={value.recurrence_type}
          onChange={(e) => onChange({ recurrence_type: e.target.value as RecurrenceType })}
        >
          {RECURRENCE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {value.recurrence_type === "custom" && (
        <>
          <div>
            <label className="neo-label">Every</label>
            <input
              className="tasks-input"
              type="number"
              min={1}
              value={value.recurrence_interval}
              onChange={(e) =>
                onChange({ recurrence_interval: Math.max(Number(e.target.value) || 1, 1) })
              }
            />
          </div>
          <div>
            <label className="neo-label">Unit</label>
            <select
              className="tasks-select"
              value={value.recurrence_unit}
              onChange={(e) => onChange({ recurrence_unit: e.target.value as RecurrenceUnit })}
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
          </div>
        </>
      )}

      {value.recurrence_type !== "none" && (
        <div>
          <label className="neo-label">Repeat until</label>
          <input
            className="tasks-input"
            type="datetime-local"
            value={value.recurrence_ends_at}
            onChange={(e) => onChange({ recurrence_ends_at: e.target.value })}
          />
        </div>
      )}
    </div>
  );
};

const DueQuickButtons: React.FC<{
  onPick: (value: string) => void;
  onSetTenPm: () => void;
  canSetTenPm: boolean;
}> = ({ onPick, onSetTenPm, canSetTenPm }) => {
  return (
    <div className="tasks-quick-due">
      <button
        type="button"
        className="tasks-quick-pill"
        onClick={onSetTenPm}
        disabled={!canSetTenPm}
        title={canSetTenPm ? "Set selected task date to 10:00 PM" : "Pick a date first, then use 10pm"}
      >
        10pm
      </button>
      <button type="button" className="tasks-quick-pill" onClick={() => onPick(quickDue("later"))}>
        +2h
      </button>
      <button type="button" className="tasks-quick-pill" onClick={() => onPick(quickDue("tonight"))}>
        Tonight
      </button>
      <button type="button" className="tasks-quick-pill" onClick={() => onPick(quickDue("tomorrow"))}>
        Tomorrow 9a
      </button>
      <button type="button" className="tasks-quick-pill" onClick={() => onPick(quickDue("nextweek"))}>
        +1 week
      </button>
    </div>
  );
};

const TasksHubTracker: React.FC = () => {
  const {
    allListsKey,
    lists,
    tasksByParent,
    rootTasksByList,
    countsByList,
    totalOpenCount,
    totalCompletedCount,
    totalTaskCount,
    selectedListId,
    setSelectedListId,
    sortMode,
    sortDirection,
    setSortForCurrentView,
    showCompleted,
    setShowCompleted,
    errorMessage,
    createList,
    saveList,
    removeList,
    createTaskFromDraft,
    saveTask,
    removeTask,
    toggleTaskCompletion,
    reorderTasks,
    buildTaskDraft,
  } = useTasksHubModule();

  const [newListName, setNewListName] = useState("");
  const [listRenameById, setListRenameById] = useState<Record<string, string>>({});
  const [taskDraftByKey, setTaskDraftByKey] = useState<Record<string, TaskDraft>>({});
  const [expandedTaskIds, setExpandedTaskIds] = useState<Record<string, boolean>>({});
  const [taskEditsById, setTaskEditsById] = useState<Record<string, TaskEditDraft>>({});
  const [completedSectionOpenByList, setCompletedSectionOpenByList] = useState<Record<string, boolean>>({});
  const [addTaskOpenByList, setAddTaskOpenByList] = useState<Record<string, boolean>>({});
  const [addSubtaskOpenByParent, setAddSubtaskOpenByParent] = useState<Record<string, boolean>>({});
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [draggingParentId, setDraggingParentId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);

  const listsToRender = useMemo(() => {
    if (selectedListId === allListsKey) return lists;
    return lists.filter((list) => list.id === selectedListId);
  }, [allListsKey, lists, selectedListId]);

  const getDraft = (listId: string, parentTaskId: string | null) => {
    const key = draftKey(listId, parentTaskId);
    return taskDraftByKey[key] ?? buildTaskDraft(listId, parentTaskId);
  };

  const setDraft = (listId: string, parentTaskId: string | null, patch: Partial<TaskDraft>) => {
    const key = draftKey(listId, parentTaskId);
    setTaskDraftByKey((prev) => {
      const current = prev[key] ?? buildTaskDraft(listId, parentTaskId);
      return {
        ...prev,
        [key]: {
          ...current,
          ...patch,
        },
      };
    });
  };

  const resetDraft = (listId: string, parentTaskId: string | null) => {
    const key = draftKey(listId, parentTaskId);
    setTaskDraftByKey((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const toggleExpandedTask = (task: TrackerTask) => {
    setExpandedTaskIds((prev) => {
      const next = !prev[task.id];
      if (next) {
        setTaskEditsById((edits) => ({
          ...edits,
          [task.id]: edits[task.id] ?? createTaskEditDraft(task),
        }));
      }
      return {
        ...prev,
        [task.id]: next,
      };
    });
  };

  const updateTaskEdit = (taskId: string, patch: Partial<TaskEditDraft>) => {
    setTaskEditsById((prev) => ({
      ...prev,
      [taskId]: {
        ...(prev[taskId] || {
          title: "",
          details: "",
          due_at: "",
          recurrence_type: "none",
          recurrence_interval: 1,
          recurrence_unit: "week",
          recurrence_ends_at: "",
        }),
        ...patch,
      },
    }));
  };

  const saveTaskEdit = async (task: TrackerTask) => {
    const edit = taskEditsById[task.id];
    if (!edit) return;

    const recurrenceType = edit.recurrence_type;
    const success = await saveTask(task.id, {
      title: edit.title,
      details: edit.details.trim() || null,
      due_at: toIsoOrNull(edit.due_at),
      recurrence_type: recurrenceType,
      recurrence_interval: recurrenceType === "custom" ? Math.max(edit.recurrence_interval || 1, 1) : null,
      recurrence_unit: recurrenceType === "custom" ? edit.recurrence_unit : null,
      recurrence_ends_at: recurrenceType !== "none" ? toIsoOrNull(edit.recurrence_ends_at) : null,
    });

    if (success) {
      setExpandedTaskIds((prev) => ({ ...prev, [task.id]: false }));
    }
  };

  const handleTaskDrop = async (
    listId: string,
    parentTaskId: string | null,
    currentOrder: string[],
    targetTaskId: string
  ) => {
    if (!draggingTaskId || draggingParentId !== parentTaskId) return;

    const fromIndex = currentOrder.indexOf(draggingTaskId);
    const toIndex = currentOrder.indexOf(targetTaskId);
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
      setDraggingTaskId(null);
      setDraggingParentId(null);
      setDragOverTaskId(null);
      return;
    }

    const nextOrder = [...currentOrder];
    nextOrder.splice(fromIndex, 1);
    nextOrder.splice(toIndex, 0, draggingTaskId);
    await reorderTasks(listId, nextOrder, parentTaskId);

    setDraggingTaskId(null);
    setDraggingParentId(null);
    setDragOverTaskId(null);
  };

  return (
    <div className="tasks-hub">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="tasks-surface tasks-surface-compact">
        <div className="tasks-top-row">
          <div className="tasks-top-left">
            <span className="tasks-top-title">Tasks</span>
            <span className="tasks-top-stats">{totalOpenCount} open • {totalCompletedCount} done • {totalTaskCount} total</span>
          </div>

          <div className="tasks-toolbar tasks-toolbar-compact">
            <label className="neo-label" style={{ color: "var(--neo-cyan)" }}>Sort</label>
            <select
              className="tasks-select"
              style={{ width: 128 }}
              value={sortMode}
              onChange={(e) => setSortForCurrentView(e.target.value as TaskSortMode, sortDirection)}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <button
              className="neo-btn neo-btn-sm neo-btn-white"
              onClick={() => setSortForCurrentView(sortMode, sortDirection === "asc" ? "desc" : "asc")}
            >
              {sortDirection === "asc" ? "ASC" : "DESC"}
            </button>
            <button className="neo-btn neo-btn-sm neo-btn-cyan" onClick={() => setShowCompleted((prev) => !prev)}>
              {showCompleted ? "Hide Done" : "Show Done"}
            </button>
          </div>
        </div>

        {sortMode === "custom" && <p className="tasks-muted tasks-helper-note">Drag to reorder</p>}
      </motion.div>

      <div className="tasks-shell">
        <aside className="tasks-sidebar">
          <div className="mb-2 flex items-center justify-between">
            <h3>Lists</h3>
            <span className="neo-label" style={{ color: "var(--neo-cyan)" }}>{lists.length}</span>
          </div>

          <button
            className={`tasks-list-row ${selectedListId === allListsKey ? "active" : ""}`}
            onClick={() => setSelectedListId(allListsKey)}
          >
            <span className="flex items-center gap-2">
              <span className="tasks-list-dot" style={{ background: "var(--neo-lime)" }} />
              All tasks
            </span>
            <span>{totalOpenCount}</span>
          </button>

          {lists.map((list) => {
            const counts = countsByList[list.id] || { open: 0, completed: 0, total: 0 };
            const renameValue = listRenameById[list.id] !== undefined ? listRenameById[list.id] : list.name;

            return (
              <div key={list.id} className="mt-1">
                <button
                  className={`tasks-list-row ${selectedListId === list.id ? "active" : ""}`}
                  onClick={() => setSelectedListId(list.id)}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="tasks-list-dot" style={{ background: list.color_hex }} />
                    <span className="truncate">{list.name}</span>
                  </span>
                  <span>{counts.open}</span>
                </button>

                <div className="tasks-list-actions mb-2 mt-1 justify-end">
                  <button className="tasks-icon-btn" onClick={() => setListRenameById((prev) => ({ ...prev, [list.id]: renameValue }))}>
                    Edit
                  </button>
                  <button
                    className="tasks-icon-btn"
                    onClick={async () => {
                      if (lists.length <= 1) return;
                      await removeList(list.id);
                    }}
                    disabled={lists.length <= 1}
                  >
                    Del
                  </button>
                </div>

                {listRenameById[list.id] !== undefined && (
                  <div className="tasks-add-list mb-2 space-y-2">
                    <input
                      className="tasks-input"
                      value={renameValue}
                      onChange={(e) => setListRenameById((prev) => ({ ...prev, [list.id]: e.target.value }))}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        className="neo-btn neo-btn-sm neo-btn-lime"
                        onClick={async () => {
                          const ok = await saveList(list.id, { name: renameValue });
                          if (ok) {
                            setListRenameById((prev) => {
                              const next = { ...prev };
                              delete next[list.id];
                              return next;
                            });
                          }
                        }}
                      >
                        Save
                      </button>
                      <button
                        className="neo-btn neo-btn-sm neo-btn-white"
                        onClick={() => {
                          setListRenameById((prev) => {
                            const next = { ...prev };
                            delete next[list.id];
                            return next;
                          });
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div className="tasks-add-list mt-3 space-y-2">
            <p className="neo-label" style={{ color: "var(--neo-cyan)" }}>Add list</p>
            <input
              className="tasks-input"
              placeholder="List name"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key !== "Enter") return;
                const created = await createList(newListName);
                if (created) setNewListName("");
              }}
            />
            <button
              className="neo-btn neo-btn-sm neo-btn-cyan"
              onClick={async () => {
                const created = await createList(newListName);
                if (created) setNewListName("");
              }}
            >
              Create
            </button>
          </div>
        </aside>

        <section className="tasks-board">
          {errorMessage && (
            <div className="neo-card mb-2 py-2" style={{ background: "var(--neo-red)", color: "var(--neo-white)" }}>
              <p className="neo-label" style={{ color: "var(--neo-white)", letterSpacing: "0.08em" }}>{errorMessage}</p>
            </div>
          )}

          <div className="tasks-cards">
            {listsToRender.map((list) => {
              const allRootTasks = rootTasksByList[list.id] ?? [];
              const activeRootTasks = allRootTasks.filter((task) => !task.is_completed);
              const completedRootTasks = allRootTasks.filter((task) => task.is_completed);
              const activeRootTasksByDue = [...activeRootTasks].sort((a, b) => {
                const aTime = a.due_at ? new Date(a.due_at).getTime() : Number.MAX_SAFE_INTEGER;
                const bTime = b.due_at ? new Date(b.due_at).getTime() : Number.MAX_SAFE_INTEGER;
                if (aTime === bTime) {
                  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                }
                return aTime - bTime;
              });
              const dueHeaderByTaskId = new Map<string, string>();
              let previousDueKey = "";
              activeRootTasksByDue.forEach((task) => {
                const dueKey = toDueDayKey(task.due_at);
                if (dueKey !== previousDueKey) {
                  dueHeaderByTaskId.set(task.id, dueGroupLabel(task.due_at));
                  previousDueKey = dueKey;
                }
              });
              const completedSubtasks = allRootTasks.flatMap((rootTask) =>
                (tasksByParent[rootTask.id] || [])
                  .filter((subtask) => subtask.is_completed)
                  .map((subtask) => ({ task: subtask, parentTitle: rootTask.title }))
              );
              const completedOpen = completedSectionOpenByList[list.id] ?? false;
              const addTaskOpen = addTaskOpenByList[list.id] ?? false;
              const topDraft = getDraft(list.id, null);

              return (
                <motion.div key={list.id} className="tasks-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="tasks-card-header tasks-card-header-compact">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="tasks-card-title">{list.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="neo-label" style={{ color: list.color_hex }}>{countsByList[list.id]?.open ?? 0} open</span>
                        <button
                          className="neo-btn neo-btn-sm neo-btn-lime"
                          onClick={() => setAddTaskOpenByList((prev) => ({ ...prev, [list.id]: !addTaskOpen }))}
                        >
                          {addTaskOpen ? "−" : "+"}
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {addTaskOpen && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="tasks-quick-form mt-2">
                          <input
                            className="tasks-input"
                            placeholder="Task title"
                            value={topDraft.title}
                            onChange={(e) => setDraft(list.id, null, { title: e.target.value })}
                          />
                          <textarea
                            className="tasks-textarea"
                            placeholder="Details (optional)"
                            value={topDraft.details}
                            onChange={(e) => setDraft(list.id, null, { details: e.target.value })}
                          />
                          <input
                            className="tasks-input"
                            type="datetime-local"
                            value={topDraft.due_at}
                            onChange={(e) => setDraft(list.id, null, { due_at: e.target.value })}
                          />
                          <DueQuickButtons
                            onPick={(value) => setDraft(list.id, null, { due_at: value })}
                            onSetTenPm={() => {
                              const next = setTimeToTenPm(topDraft.due_at);
                              if (next) setDraft(list.id, null, { due_at: next });
                            }}
                            canSetTenPm={!!setTimeToTenPm(topDraft.due_at)}
                          />

                          <TaskRecurrenceFields
                            value={{
                              recurrence_type: topDraft.recurrence_type,
                              recurrence_interval: topDraft.recurrence_interval,
                              recurrence_unit: topDraft.recurrence_unit,
                              recurrence_ends_at: topDraft.recurrence_ends_at,
                            }}
                            onChange={(patch) => setDraft(list.id, null, patch)}
                          />

                          <div className="flex gap-2">
                            <button
                              className="neo-btn neo-btn-sm neo-btn-cyan"
                              onClick={async () => {
                                const created = await createTaskFromDraft(topDraft);
                                if (created) {
                                  resetDraft(list.id, null);
                                  setAddTaskOpenByList((prev) => ({ ...prev, [list.id]: false }));
                                }
                              }}
                            >
                              Add task
                            </button>
                            <button
                              className="neo-btn neo-btn-sm neo-btn-white"
                              onClick={() => {
                                resetDraft(list.id, null);
                                setAddTaskOpenByList((prev) => ({ ...prev, [list.id]: false }));
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div>
                    {activeRootTasks.length === 0 && completedRootTasks.length === 0 && completedSubtasks.length === 0 && (
                      <div className="tasks-empty">No tasks in this list yet.</div>
                    )}

                    {activeRootTasksByDue.map((task) => {
                      const expanded = !!expandedTaskIds[task.id];
                      const edit = taskEditsById[task.id] ?? createTaskEditDraft(task);
                      const subtasks = tasksByParent[task.id] || [];
                      const activeSubtasks = subtasks.filter((subtask) => !subtask.is_completed);
                      const doneSubtaskCount = subtasks.length - activeSubtasks.length;
                      const subtaskDraft = getDraft(list.id, task.id);
                      const addSubtaskOpen = addSubtaskOpenByParent[task.id] ?? false;
                      const canDrag = sortMode === "custom";

                      return (
                        <React.Fragment key={task.id}>
                          {dueHeaderByTaskId.get(task.id) && (
                            <div className="tasks-due-group-label">{dueHeaderByTaskId.get(task.id)}</div>
                          )}
                          <div
                            className={`tasks-task-row ${draggingTaskId === task.id ? "dragging" : ""} ${dragOverTaskId === task.id ? "drop-target" : ""}`}
                            draggable={canDrag}
                            onDragStart={() => {
                              setDraggingTaskId(task.id);
                              setDraggingParentId(null);
                            }}
                            onDragOver={(e) => {
                              if (!canDrag) return;
                              e.preventDefault();
                              setDragOverTaskId(task.id);
                            }}
                            onDrop={async (e) => {
                              if (!canDrag) return;
                              e.preventDefault();
                              await handleTaskDrop(list.id, null, activeRootTasksByDue.map((item) => item.id), task.id);
                            }}
                            onDragEnd={() => {
                              setDraggingTaskId(null);
                              setDraggingParentId(null);
                              setDragOverTaskId(null);
                            }}
                          >
                          <div className="tasks-task-main">
                            <button className={`tasks-checkbox ${task.is_completed ? "done" : ""}`} onClick={async () => { await toggleTaskCompletion(task); }}>
                              {task.is_completed ? "✓" : ""}
                            </button>

                            <div className="min-w-0">
                              <button className={`tasks-title-btn ${task.is_completed ? "done" : ""}`} onClick={() => toggleExpandedTask(task)}>
                                {task.title}
                              </button>
                              <div className="tasks-meta">
                                {task.due_at && <span className={dueChipClassName(task.due_at)}>{formatDue(task.due_at)}</span>}
                                {recurrenceLabel(task) && <span className="tasks-chip">{recurrenceLabel(task)}</span>}
                                {subtasks.length > 0 && <span className="tasks-chip">{activeSubtasks.length}/{subtasks.length} subtasks</span>}
                                {doneSubtaskCount > 0 && <span className="tasks-chip">{doneSubtaskCount} done</span>}
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <button className="tasks-icon-btn" onClick={() => setAddSubtaskOpenByParent((prev) => ({ ...prev, [task.id]: !addSubtaskOpen }))}>
                                {addSubtaskOpen ? "−" : "+"}
                              </button>
                              <button className="tasks-icon-btn tasks-danger" onClick={async () => { await removeTask(task.id); }}>
                                Del
                              </button>
                            </div>
                          </div>

                          {activeSubtasks.length > 0 && (
                            <div className="tasks-subtasks">
                              {activeSubtasks.map((subtask) => (
                                <div
                                  key={subtask.id}
                                  className={`tasks-subtask-row ${draggingTaskId === subtask.id ? "dragging" : ""} ${dragOverTaskId === subtask.id ? "drop-target" : ""}`}
                                  draggable={canDrag}
                                  onDragStart={() => {
                                    setDraggingTaskId(subtask.id);
                                    setDraggingParentId(task.id);
                                  }}
                                  onDragOver={(e) => {
                                    if (!canDrag) return;
                                    e.preventDefault();
                                    setDragOverTaskId(subtask.id);
                                  }}
                                  onDrop={async (e) => {
                                    if (!canDrag) return;
                                    e.preventDefault();
                                    await handleTaskDrop(list.id, task.id, activeSubtasks.map((item) => item.id), subtask.id);
                                  }}
                                  onDragEnd={() => {
                                    setDraggingTaskId(null);
                                    setDraggingParentId(null);
                                    setDragOverTaskId(null);
                                  }}
                                >
                                  <button className={`tasks-checkbox ${subtask.is_completed ? "done" : ""}`} onClick={async () => { await toggleTaskCompletion(subtask); }}>
                                    {subtask.is_completed ? "✓" : ""}
                                  </button>
                                  <div className="min-w-0">
                                    <button className={`tasks-title-btn ${subtask.is_completed ? "done" : ""}`} onClick={() => toggleExpandedTask(subtask)}>
                                      {subtask.title}
                                    </button>
                                    <div className="tasks-meta">
                                      {subtask.due_at && <span className={dueChipClassName(subtask.due_at)}>{formatDue(subtask.due_at)}</span>}
                                    </div>
                                  </div>
                                  <button className="tasks-icon-btn tasks-danger" onClick={async () => { await removeTask(subtask.id); }}>
                                    Del
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          <AnimatePresence>
                            {addSubtaskOpen && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="tasks-quick-form mt-2 tasks-subtask-form">
                                <input
                                  className="tasks-input"
                                  placeholder="Subtask title"
                                  value={subtaskDraft.title}
                                  onChange={(e) => setDraft(list.id, task.id, { title: e.target.value })}
                                />
                                <input
                                  className="tasks-input"
                                  type="datetime-local"
                                  value={subtaskDraft.due_at}
                                  onChange={(e) => setDraft(list.id, task.id, { due_at: e.target.value })}
                                />
                                <DueQuickButtons
                                  onPick={(value) => setDraft(list.id, task.id, { due_at: value })}
                                  onSetTenPm={() => {
                                    const next = setTimeToTenPm(subtaskDraft.due_at);
                                    if (next) setDraft(list.id, task.id, { due_at: next });
                                  }}
                                  canSetTenPm={!!setTimeToTenPm(subtaskDraft.due_at)}
                                />
                                <TaskRecurrenceFields
                                  value={{
                                    recurrence_type: subtaskDraft.recurrence_type,
                                    recurrence_interval: subtaskDraft.recurrence_interval,
                                    recurrence_unit: subtaskDraft.recurrence_unit,
                                    recurrence_ends_at: subtaskDraft.recurrence_ends_at,
                                  }}
                                  onChange={(patch) => setDraft(list.id, task.id, patch)}
                                />
                                <div className="flex gap-2">
                                  <button
                                    className="neo-btn neo-btn-sm neo-btn-cyan"
                                    onClick={async () => {
                                      const created = await createTaskFromDraft(subtaskDraft);
                                      if (created) {
                                        resetDraft(list.id, task.id);
                                        setAddSubtaskOpenByParent((prev) => ({ ...prev, [task.id]: false }));
                                      }
                                    }}
                                  >
                                    Add subtask
                                  </button>
                                  <button
                                    className="neo-btn neo-btn-sm neo-btn-white"
                                    onClick={() => {
                                      resetDraft(list.id, task.id);
                                      setAddSubtaskOpenByParent((prev) => ({ ...prev, [task.id]: false }));
                                    }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <AnimatePresence>
                            {expanded && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="tasks-expansion">
                                <input className="tasks-input" value={edit.title} onChange={(e) => updateTaskEdit(task.id, { title: e.target.value })} />
                                <textarea className="tasks-textarea" placeholder="Task details" value={edit.details} onChange={(e) => updateTaskEdit(task.id, { details: e.target.value })} />
                                <input className="tasks-input" type="datetime-local" value={edit.due_at} onChange={(e) => updateTaskEdit(task.id, { due_at: e.target.value })} />
                                <DueQuickButtons
                                  onPick={(value) => updateTaskEdit(task.id, { due_at: value })}
                                  onSetTenPm={() => {
                                    const next = setTimeToTenPm(edit.due_at);
                                    if (next) updateTaskEdit(task.id, { due_at: next });
                                  }}
                                  canSetTenPm={!!setTimeToTenPm(edit.due_at)}
                                />
                                <TaskRecurrenceFields
                                  value={{
                                    recurrence_type: edit.recurrence_type,
                                    recurrence_interval: edit.recurrence_interval,
                                    recurrence_unit: edit.recurrence_unit,
                                    recurrence_ends_at: edit.recurrence_ends_at,
                                  }}
                                  onChange={(patch) => updateTaskEdit(task.id, patch)}
                                />
                                <div className="flex gap-2">
                                  <button className="neo-btn neo-btn-sm neo-btn-lime" onClick={async () => { await saveTaskEdit(task); }}>
                                    Save
                                  </button>
                                  <button
                                    className="neo-btn neo-btn-sm neo-btn-white"
                                    onClick={() => {
                                      setExpandedTaskIds((prev) => ({ ...prev, [task.id]: false }));
                                      setTaskEditsById((prev) => ({ ...prev, [task.id]: createTaskEditDraft(task) }));
                                    }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          </div>
                        </React.Fragment>
                      );
                    })}

                    {showCompleted && (completedRootTasks.length > 0 || completedSubtasks.length > 0) && (
                      <>
                        <button className="tasks-completed-toggle" onClick={() => setCompletedSectionOpenByList((prev) => ({ ...prev, [list.id]: !completedOpen }))}>
                          {completedOpen ? "▼" : "▶"} Completed ({completedRootTasks.length + completedSubtasks.length})
                        </button>

                        {completedOpen && (
                          <div className="tasks-completed-list">
                            {completedRootTasks.map((task) => (
                              <div key={task.id} className="tasks-subtask-row">
                                <button className="tasks-checkbox done" onClick={async () => { await toggleTaskCompletion(task); }}>✓</button>
                                <div className="min-w-0">
                                  <button className="tasks-title-btn done" onClick={() => toggleExpandedTask(task)}>{task.title}</button>
                                  <div className="tasks-meta">{task.due_at && <span className={dueChipClassName(task.due_at)}>{formatDue(task.due_at)}</span>}</div>
                                </div>
                                <button className="tasks-icon-btn tasks-danger" onClick={async () => { await removeTask(task.id); }}>Del</button>
                              </div>
                            ))}

                            {completedSubtasks.map(({ task, parentTitle }) => (
                              <div key={task.id} className="tasks-subtask-row tasks-completed-subtask">
                                <button className="tasks-checkbox done" onClick={async () => { await toggleTaskCompletion(task); }}>✓</button>
                                <div className="min-w-0">
                                  <button className="tasks-title-btn done" onClick={() => toggleExpandedTask(task)}>{task.title}</button>
                                  <div className="tasks-meta">
                                    <span className="tasks-chip">Subtask of {parentTitle}</span>
                                    {task.due_at && <span className={dueChipClassName(task.due_at)}>{formatDue(task.due_at)}</span>}
                                  </div>
                                </div>
                                <button className="tasks-icon-btn tasks-danger" onClick={async () => { await removeTask(task.id); }}>Del</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default TasksHubTracker;
