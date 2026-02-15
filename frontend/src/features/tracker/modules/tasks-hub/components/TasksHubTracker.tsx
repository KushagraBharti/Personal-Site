
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
  { value: "due_date", label: "Due date" },
  { value: "date_created", label: "Date created" },
  { value: "title", label: "Title" },
  { value: "custom", label: "Custom order" },
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
  const [newListColor, setNewListColor] = useState("#00FFFF");
  const [listRenameById, setListRenameById] = useState<Record<string, string>>({});
  const [taskDraftByKey, setTaskDraftByKey] = useState<Record<string, TaskDraft>>({});
  const [expandedTaskIds, setExpandedTaskIds] = useState<Record<string, boolean>>({});
  const [taskEditsById, setTaskEditsById] = useState<Record<string, TaskEditDraft>>({});
  const [completedSectionOpenByList, setCompletedSectionOpenByList] = useState<Record<string, boolean>>({});
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
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
    if (!draggingTaskId) return;

    const fromIndex = currentOrder.indexOf(draggingTaskId);
    const toIndex = currentOrder.indexOf(targetTaskId);
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
      setDraggingTaskId(null);
      setDragOverTaskId(null);
      return;
    }

    const nextOrder = [...currentOrder];
    nextOrder.splice(fromIndex, 1);
    nextOrder.splice(toIndex, 0, draggingTaskId);
    await reorderTasks(listId, nextOrder, parentTaskId);

    setDraggingTaskId(null);
    setDragOverTaskId(null);
  };

  return (
    <div className="tasks-hub space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="tasks-surface p-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="neo-label" style={{ color: "var(--neo-cyan)" }}>
              PRIVATE TRACKER
            </p>
            <h2 className="tasks-header-title text-3xl">TASKS</h2>
            <p className="tasks-muted text-sm">
              {totalOpenCount} open | {totalCompletedCount} completed | {totalTaskCount} total
            </p>
          </div>

          <div className="tasks-toolbar">
            <div className="flex items-center gap-2">
              <label className="neo-label" style={{ color: "var(--neo-cyan)" }}>
                Sort
              </label>
              <select
                className="tasks-select"
                style={{ width: 150 }}
                value={sortMode}
                onChange={(e) => setSortForCurrentView(e.target.value as TaskSortMode, sortDirection)}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                className="neo-btn neo-btn-sm neo-btn-white"
                onClick={() =>
                  setSortForCurrentView(sortMode, sortDirection === "asc" ? "desc" : "asc")
                }
              >
                {sortDirection === "asc" ? "ASC" : "DESC"}
              </button>
              <button
                className="neo-btn neo-btn-sm neo-btn-cyan"
                onClick={() => setShowCompleted((prev) => !prev)}
              >
                {showCompleted ? "Hide completed" : "Show completed"}
              </button>
            </div>
          </div>
        </div>

        {sortMode === "custom" && (
          <p className="tasks-muted mt-2 text-xs">Drag tasks to customize order in each list.</p>
        )}
      </motion.div>

      <div className="tasks-shell">
        <aside className="tasks-sidebar">
          <div className="mb-2 flex items-center justify-between">
            <h3>Lists</h3>
            <span className="neo-label" style={{ color: "var(--neo-cyan)" }}>
              {lists.length}
            </span>
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
            const renameValue =
              listRenameById[list.id] !== undefined ? listRenameById[list.id] : list.name;

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
                  <button
                    className="tasks-icon-btn"
                    onClick={() => setListRenameById((prev) => ({ ...prev, [list.id]: renameValue }))}
                  >
                    Edit
                  </button>
                  <button
                    className="tasks-icon-btn"
                    onClick={async () => {
                      if (lists.length <= 1) {
                        return;
                      }
                      await removeList(list.id);
                    }}
                    disabled={lists.length <= 1}
                    title={lists.length <= 1 ? "At least one list is required" : "Delete list"}
                  >
                    Del
                  </button>
                </div>

                {listRenameById[list.id] !== undefined && (
                  <div className="tasks-add-list mb-2 space-y-2">
                    <input
                      className="tasks-input"
                      value={renameValue}
                      onChange={(e) =>
                        setListRenameById((prev) => ({ ...prev, [list.id]: e.target.value }))
                      }
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={list.color_hex}
                        onChange={(e) => saveList(list.id, { color_hex: e.target.value })}
                      />
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
            <p className="neo-label" style={{ color: "var(--neo-cyan)" }}>
              Add list
            </p>
            <input
              className="tasks-input"
              placeholder="List name"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key !== "Enter") return;
                const created = await createList(newListName, newListColor);
                if (created) {
                  setNewListName("");
                }
              }}
            />
            <div className="flex items-center gap-2">
              <input type="color" value={newListColor} onChange={(e) => setNewListColor(e.target.value)} />
              <button
                className="neo-btn neo-btn-sm neo-btn-cyan"
                onClick={async () => {
                  const created = await createList(newListName, newListColor);
                  if (created) {
                    setNewListName("");
                  }
                }}
              >
                Create
              </button>
            </div>
          </div>
        </aside>

        <section className="tasks-board">
          {errorMessage && (
            <div className="neo-card mb-3" style={{ background: "var(--neo-red)", color: "var(--neo-white)" }}>
              <p className="neo-label" style={{ color: "var(--neo-white)" }}>
                {errorMessage}
              </p>
            </div>
          )}

          <div className="tasks-cards">
            {listsToRender.map((list) => {
              const allRootTasks = rootTasksByList[list.id] ?? [];
              const activeRootTasks = allRootTasks.filter((task) => !task.is_completed);
              const completedRootTasks = allRootTasks.filter((task) => task.is_completed);
              const topDraft = getDraft(list.id, null);
              const completedOpen = completedSectionOpenByList[list.id] ?? false;

              return (
                <motion.div
                  key={list.id}
                  className="tasks-card"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="tasks-card-header">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="tasks-card-title">{list.name}</h3>
                      <span className="neo-label" style={{ color: list.color_hex }}>
                        {countsByList[list.id]?.open ?? 0} open
                      </span>
                    </div>

                    <div className="mt-2 grid gap-2">
                      <input
                        className="tasks-input"
                        placeholder="Add a task"
                        value={topDraft.title}
                        onChange={(e) => setDraft(list.id, null, { title: e.target.value })}
                        onKeyDown={async (e) => {
                          if (e.key !== "Enter") return;
                          const created = await createTaskFromDraft(topDraft);
                          if (created) {
                            resetDraft(list.id, null);
                          }
                        }}
                      />

                      <div className="grid gap-2 md:grid-cols-2">
                        <input
                          className="tasks-input"
                          type="datetime-local"
                          value={topDraft.due_at}
                          onChange={(e) => setDraft(list.id, null, { due_at: e.target.value })}
                        />
                        <button
                          className="neo-btn neo-btn-sm neo-btn-lime"
                          onClick={async () => {
                            const created = await createTaskFromDraft(topDraft);
                            if (created) {
                              resetDraft(list.id, null);
                            }
                          }}
                        >
                          Add task
                        </button>
                      </div>

                      <TaskRecurrenceFields
                        value={{
                          recurrence_type: topDraft.recurrence_type,
                          recurrence_interval: topDraft.recurrence_interval,
                          recurrence_unit: topDraft.recurrence_unit,
                          recurrence_ends_at: topDraft.recurrence_ends_at,
                        }}
                        onChange={(patch) => setDraft(list.id, null, patch)}
                      />
                    </div>
                  </div>

                  <div>
                    {activeRootTasks.length === 0 && completedRootTasks.length === 0 && (
                      <div className="tasks-empty">No tasks in this list yet.</div>
                    )}

                    {activeRootTasks.map((task) => {
                      const expanded = !!expandedTaskIds[task.id];
                      const edit = taskEditsById[task.id] ?? createTaskEditDraft(task);
                      const subtasks = tasksByParent[task.id] || [];
                      const visibleSubtasks = showCompleted
                        ? subtasks
                        : subtasks.filter((subtask) => !subtask.is_completed);
                      const subtaskDraft = getDraft(list.id, task.id);
                      const canDrag = sortMode === "custom";

                      return (
                        <div
                          key={task.id}
                          className={`tasks-task-row ${draggingTaskId === task.id ? "dragging" : ""} ${
                            dragOverTaskId === task.id ? "drop-target" : ""
                          }`}
                          draggable={canDrag}
                          onDragStart={() => setDraggingTaskId(task.id)}
                          onDragOver={(e) => {
                            if (!canDrag) return;
                            e.preventDefault();
                            setDragOverTaskId(task.id);
                          }}
                          onDragLeave={() => {
                            if (!canDrag) return;
                            setDragOverTaskId((current) => (current === task.id ? null : current));
                          }}
                          onDrop={async (e) => {
                            if (!canDrag) return;
                            e.preventDefault();
                            await handleTaskDrop(
                              list.id,
                              null,
                              activeRootTasks.map((item) => item.id),
                              task.id
                            );
                          }}
                          onDragEnd={() => {
                            setDraggingTaskId(null);
                            setDragOverTaskId(null);
                          }}
                        >
                          <div className="tasks-task-main">
                            <button
                              className={`tasks-checkbox ${task.is_completed ? "done" : ""}`}
                              onClick={async () => {
                                await toggleTaskCompletion(task);
                              }}
                            >
                              {task.is_completed ? "✓" : ""}
                            </button>

                            <div className="min-w-0">
                              <button
                                className={`tasks-title-btn ${task.is_completed ? "done" : ""}`}
                                onClick={() => toggleExpandedTask(task)}
                              >
                                {task.title}
                              </button>

                              <div className="tasks-meta">
                                {task.due_at && <span className="tasks-chip">{formatDue(task.due_at)}</span>}
                                {recurrenceLabel(task) && (
                                  <span className="tasks-chip">{recurrenceLabel(task)}</span>
                                )}
                                {subtasks.length > 0 && (
                                  <span className="tasks-chip">{subtasks.length} subtasks</span>
                                )}
                              </div>
                            </div>

                            <button
                              className="tasks-icon-btn tasks-danger"
                              onClick={async () => {
                                await removeTask(task.id);
                              }}
                            >
                              Delete
                            </button>
                          </div>

                          <AnimatePresence>
                            {expanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="tasks-expansion"
                              >
                                <input
                                  className="tasks-input"
                                  value={edit.title}
                                  onChange={(e) => updateTaskEdit(task.id, { title: e.target.value })}
                                />

                                <textarea
                                  className="tasks-textarea"
                                  placeholder="Task details"
                                  value={edit.details}
                                  onChange={(e) => updateTaskEdit(task.id, { details: e.target.value })}
                                />

                                <div className="grid gap-2 md:grid-cols-2">
                                  <div>
                                    <label className="neo-label">Due</label>
                                    <input
                                      className="tasks-input"
                                      type="datetime-local"
                                      value={edit.due_at}
                                      onChange={(e) => updateTaskEdit(task.id, { due_at: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <label className="neo-label">Created</label>
                                    <input
                                      className="tasks-input"
                                      disabled
                                      value={new Date(task.created_at).toLocaleString()}
                                    />
                                  </div>
                                </div>

                                <TaskRecurrenceFields
                                  value={{
                                    recurrence_type: edit.recurrence_type,
                                    recurrence_interval: edit.recurrence_interval,
                                    recurrence_unit: edit.recurrence_unit,
                                    recurrence_ends_at: edit.recurrence_ends_at,
                                  }}
                                  onChange={(patch) => updateTaskEdit(task.id, patch)}
                                />

                                <div className="flex flex-wrap gap-2">
                                  <button
                                    className="neo-btn neo-btn-sm neo-btn-lime"
                                    onClick={async () => {
                                      await saveTaskEdit(task);
                                    }}
                                  >
                                    Save task
                                  </button>
                                  <button
                                    className="neo-btn neo-btn-sm neo-btn-white"
                                    onClick={() => {
                                      setExpandedTaskIds((prev) => ({ ...prev, [task.id]: false }));
                                      setTaskEditsById((prev) => ({
                                        ...prev,
                                        [task.id]: createTaskEditDraft(task),
                                      }));
                                    }}
                                  >
                                    Cancel
                                  </button>
                                </div>

                                <div>
                                  <label className="neo-label" style={{ color: "var(--neo-cyan)" }}>
                                    Add subtask
                                  </label>
                                  <div className="mt-1 grid gap-2 md:grid-cols-[1fr_auto]">
                                    <input
                                      className="tasks-input"
                                      placeholder="Subtask title"
                                      value={subtaskDraft.title}
                                      onChange={(e) =>
                                        setDraft(list.id, task.id, { title: e.target.value })
                                      }
                                      onKeyDown={async (e) => {
                                        if (e.key !== "Enter") return;
                                        const created = await createTaskFromDraft(subtaskDraft);
                                        if (created) {
                                          resetDraft(list.id, task.id);
                                        }
                                      }}
                                    />
                                    <button
                                      className="neo-btn neo-btn-sm neo-btn-cyan"
                                      onClick={async () => {
                                        const created = await createTaskFromDraft(subtaskDraft);
                                        if (created) {
                                          resetDraft(list.id, task.id);
                                        }
                                      }}
                                    >
                                      Add subtask
                                    </button>
                                  </div>
                                </div>

                                {visibleSubtasks.length > 0 && (
                                  <div className="tasks-subtasks">
                                    {visibleSubtasks.map((subtask) => (
                                      <div key={subtask.id} className="tasks-task-row">
                                        <div className="tasks-task-main">
                                          <button
                                            className={`tasks-checkbox ${subtask.is_completed ? "done" : ""}`}
                                            onClick={async () => {
                                              await toggleTaskCompletion(subtask);
                                            }}
                                          >
                                            {subtask.is_completed ? "✓" : ""}
                                          </button>

                                          <div className="min-w-0">
                                            <button
                                              className={`tasks-title-btn ${
                                                subtask.is_completed ? "done" : ""
                                              }`}
                                              onClick={() => toggleExpandedTask(subtask)}
                                            >
                                              {subtask.title}
                                            </button>
                                            {subtask.due_at && (
                                              <div className="tasks-meta">
                                                <span className="tasks-chip">{formatDue(subtask.due_at)}</span>
                                              </div>
                                            )}
                                          </div>

                                          <button
                                            className="tasks-icon-btn tasks-danger"
                                            onClick={async () => {
                                              await removeTask(subtask.id);
                                            }}
                                          >
                                            Delete
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}

                    {showCompleted && completedRootTasks.length > 0 && (
                      <>
                        <button
                          className="tasks-completed-toggle"
                          onClick={() =>
                            setCompletedSectionOpenByList((prev) => ({
                              ...prev,
                              [list.id]: !completedOpen,
                            }))
                          }
                        >
                          {completedOpen ? "▼" : "▶"} Completed ({completedRootTasks.length})
                        </button>

                        {completedOpen &&
                          completedRootTasks.map((task) => (
                            <div key={task.id} className="tasks-task-row">
                              <div className="tasks-task-main">
                                <button
                                  className="tasks-checkbox done"
                                  onClick={async () => {
                                    await toggleTaskCompletion(task);
                                  }}
                                >
                                  ✓
                                </button>

                                <div className="min-w-0">
                                  <button className="tasks-title-btn done" onClick={() => toggleExpandedTask(task)}>
                                    {task.title}
                                  </button>
                                  <div className="tasks-meta">
                                    {task.due_at && <span className="tasks-chip">{formatDue(task.due_at)}</span>}
                                  </div>
                                </div>

                                <button
                                  className="tasks-icon-btn tasks-danger"
                                  onClick={async () => {
                                    await removeTask(task.id);
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
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
