
import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTasksHubModule } from "../hooks";
import {
  RecurrenceType,
  RecurrenceUnit,
  SortDirection,
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

const DATE_ONLY_MARKER_MS = 777;

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
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const parsedDate = new Date(`${trimmed}T12:00`);
    if (Number.isNaN(parsedDate.getTime())) return null;
    parsedDate.setMilliseconds(DATE_ONLY_MARKER_MS);
    return parsedDate.toISOString();
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setMilliseconds(0);
  return parsed.toISOString();
};

const isDateOnlyIso = (isoString: string | null | undefined) => {
  if (!isoString) return false;
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.getMilliseconds() === DATE_ONLY_MARKER_MS;
};

const toLocalDateInput = (isoString: string | null | undefined) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const toLocalDueInput = (isoString: string | null | undefined) => {
  if (!isoString) return "";
  return isDateOnlyIso(isoString) ? toLocalDateInput(isoString) : toLocalDateTimeInput(isoString);
};

const getDueParts = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return { date: "", time: "" };
  if (trimmed.includes("T")) {
    const [datePart, timePart] = trimmed.split("T");
    return { date: datePart, time: (timePart || "").slice(0, 5) };
  }
  return { date: trimmed.slice(0, 10), time: "" };
};

const setDueDatePart = (current: string, date: string) => {
  const nextDate = date.trim();
  if (!nextDate) return "";
  const { time } = getDueParts(current);
  return time ? `${nextDate}T${time}` : nextDate;
};

const setDueTimePart = (current: string, time: string) => {
  const nextTime = time.trim();
  const { date } = getDueParts(current);
  if (!date) return "";
  return nextTime ? `${date}T${nextTime}` : date;
};

const toLocalInputFromDate = (date: Date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const quickDue = (kind: "today" | "tonight" | "tomorrow" | "sunday") => {
  const base = new Date();
  if (kind === "today") {
    return toLocalInputFromDate(base).slice(0, 10);
  }
  if (kind === "tonight") {
    base.setHours(22, 0, 0, 0);
    return toLocalInputFromDate(base);
  }
  if (kind === "tomorrow") {
    base.setDate(base.getDate() + 1);
    return toLocalInputFromDate(base).slice(0, 10);
  }
  const dayOfWeek = base.getDay();
  const daysUntilSunday = (7 - dayOfWeek) || 7;
  base.setDate(base.getDate() + daysUntilSunday);
  return toLocalInputFromDate(base).slice(0, 10);
};

const formatDue = (isoString: string | null) => {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "";
  if (isDateOnlyIso(isoString)) {
    return d.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
  }
  return d.toLocaleTimeString([], {
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
  if (!trimmed) return "";
  const datePart = trimmed.includes("T") ? trimmed.split("T")[0] : trimmed.slice(0, 10);
  if (!datePart) return "";
  return `${datePart}T22:00`;
};

const getDueUrgency = (isoString: string | null): "overdue" | "soon" | "future" => {
  if (!isoString) return "future";
  const due = new Date(isoString);
  if (Number.isNaN(due.getTime())) return "future";
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  if (diffMs < 0) return "overdue";
  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
  if (diffMs <= threeDaysMs) return "soon";
  return "future";
};

const dueChipClassName = (isoString: string | null) => {
  const urgency = getDueUrgency(isoString);
  if (urgency === "overdue") return "tasks-chip tasks-chip-due tasks-chip-due-overdue";
  if (urgency === "soon") return "tasks-chip tasks-chip-due tasks-chip-due-soon";
  return "tasks-chip tasks-chip-due tasks-chip-due-future";
};

const getTimestamp = (value: string | null | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? fallback : parsed;
};

const compareTasksBySortMode = (a: TrackerTask, b: TrackerTask, mode: TaskSortMode) => {
  if (mode === "title") {
    return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
  }

  if (mode === "date_created") {
    return getTimestamp(a.created_at, 0) - getTimestamp(b.created_at, 0);
  }

  if (mode === "due_date") {
    const aDue = getTimestamp(a.due_at, Number.MAX_SAFE_INTEGER);
    const bDue = getTimestamp(b.due_at, Number.MAX_SAFE_INTEGER);
    if (aDue === bDue) {
      return getTimestamp(a.created_at, 0) - getTimestamp(b.created_at, 0);
    }
    return aDue - bDue;
  }

  if (a.sort_order === b.sort_order) {
    return getTimestamp(a.created_at, 0) - getTimestamp(b.created_at, 0);
  }
  return a.sort_order - b.sort_order;
};

const sortTasksForList = (
  tasks: TrackerTask[],
  mode: TaskSortMode,
  direction: SortDirection
) => {
  const sorted = [...tasks].sort((a, b) => compareTasksBySortMode(a, b, mode));
  return direction === "asc" ? sorted : sorted.reverse();
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
  due_at: toLocalDueInput(task.due_at),
  recurrence_type: task.recurrence_type,
  recurrence_interval: Math.max(task.recurrence_interval ?? 1, 1),
  recurrence_unit: task.recurrence_unit ?? "week",
  recurrence_ends_at: toLocalDateTimeInput(task.recurrence_ends_at),
});

const draftKey = (listId: string, parentTaskId: string | null) => `${listId}:${parentTaskId ?? "root"}`;

// ============================================================================
// CONFETTI EXPLOSION
// ============================================================================

const CONFETTI_COLORS = ["var(--neo-lime)", "var(--neo-pink)", "var(--neo-cyan)", "var(--neo-yellow)"];

const Confetti: React.FC<{ trigger: boolean }> = ({ trigger }) => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; color: string }>>([]);

  useEffect(() => {
    if (trigger) {
      const newParticles = Array.from({ length: 8 }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 60 - 30,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      }));
      setParticles(newParticles);
      setTimeout(() => setParticles([]), 800);
    }
  }, [trigger]);

  return (
    <div className="tasks-confetti-container">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{
            width: 6,
            height: 6,
            background: p.color,
            border: "1px solid var(--neo-black)",
            left: "50%",
            top: "50%",
          }}
          initial={{ y: 0, x: 0, opacity: 1, rotate: 0 }}
          animate={{
            y: -60 - Math.random() * 30,
            x: p.x,
            opacity: 0,
            rotate: Math.random() * 360,
          }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      ))}
    </div>
  );
};

// ============================================================================
// RECURRENCE FIELDS
// ============================================================================

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
  const isCustom = value.recurrence_type === "custom";
  const hasEnd = value.recurrence_type !== "none";
  const recurrenceClassName = isCustom
    ? "tasks-recurrence-fields tasks-recurrence-fields-custom"
    : hasEnd
      ? "tasks-recurrence-fields tasks-recurrence-fields-with-until"
      : "tasks-recurrence-fields tasks-recurrence-fields-basic";

  return (
    <div className={recurrenceClassName}>
      <div className="tasks-recurrence-item">
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

      {isCustom && (
        <>
          <div className="tasks-recurrence-item">
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
          <div className="tasks-recurrence-item">
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

      {hasEnd && (
        <div className="tasks-recurrence-item tasks-recurrence-until">
          <label className="neo-label">Until</label>
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

// ============================================================================
// DUE QUICK BUTTONS
// ============================================================================

const DueQuickButtons: React.FC<{
  onPick: (value: string) => void;
  onSetTenPm: () => void;
  canSetTenPm: boolean;
}> = ({ onPick, onSetTenPm, canSetTenPm }) => {
  return (
    <div className="tasks-quick-due">
      <motion.button
        type="button"
        className="tasks-quick-pill"
        onClick={onSetTenPm}
        disabled={!canSetTenPm}
        title={canSetTenPm ? "Set selected task date to 10:00 PM" : "Pick a date first, then use 10pm"}
        whileHover={canSetTenPm ? { scale: 1.08 } : {}}
        whileTap={canSetTenPm ? { scale: 0.92 } : {}}
      >
        10pm
      </motion.button>
      <motion.button type="button" className="tasks-quick-pill" onClick={() => onPick(quickDue("today"))} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
        Today
      </motion.button>
      <motion.button type="button" className="tasks-quick-pill" onClick={() => onPick(quickDue("tonight"))} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
        Tonight
      </motion.button>
      <motion.button type="button" className="tasks-quick-pill" onClick={() => onPick(quickDue("tomorrow"))} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
        Tomorrow
      </motion.button>
      <motion.button type="button" className="tasks-quick-pill" onClick={() => onPick(quickDue("sunday"))} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
        Sunday
      </motion.button>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const TasksHubTracker: React.FC = () => {
  const {
    allListsKey,
    lists,
    tasksByParent,
    rootTasksByList,
    countsByList,
    selectedListId,
    setSelectedListId,
    getSortForList,
    setSortForList,
    errorMessage,
    createList,
    saveList,
    removeList,
    createTaskFromDraft,
    saveTask,
    removeTask,
    toggleTaskCompletion,
    reorderTasks,
    reorderLists,
    buildTaskDraft,
  } = useTasksHubModule();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [newListName, setNewListName] = useState("");
  const [hiddenListIds, setHiddenListIds] = useState<Record<string, boolean>>({});
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
  const [draggingListId, setDraggingListId] = useState<string | null>(null);
  const [dragOverListId, setDragOverListId] = useState<string | null>(null);
  const [hideCompletedByList, setHideCompletedByList] = useState<Record<string, boolean>>({});
  const [justCheckedIds, setJustCheckedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("tasksHubSidebarOpen");
      if (!raw) return;
      setIsSidebarOpen(raw === "1");
    } catch {
      // no-op
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("tasksHubSidebarOpen", isSidebarOpen ? "1" : "0");
  }, [isSidebarOpen]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("tasksHubHiddenLists");
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, boolean>;
      if (parsed && typeof parsed === "object") {
        setHiddenListIds(parsed);
      }
    } catch {
      // no-op
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("tasksHubHiddenLists", JSON.stringify(hiddenListIds));
  }, [hiddenListIds]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("tasksHubHideCompletedByList");
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, boolean>;
      if (parsed && typeof parsed === "object") {
        setHideCompletedByList(parsed);
      }
    } catch {
      // no-op
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("tasksHubHideCompletedByList", JSON.stringify(hideCompletedByList));
  }, [hideCompletedByList]);

  const visibleLists = useMemo(
    () => lists.filter((list) => !hiddenListIds[list.id]),
    [lists, hiddenListIds]
  );

  useEffect(() => {
    if (selectedListId === allListsKey) return;
    if (hiddenListIds[selectedListId]) {
      setSelectedListId(allListsKey);
    }
  }, [allListsKey, hiddenListIds, selectedListId, setSelectedListId]);

  const listsToRender = useMemo(() => {
    if (selectedListId === allListsKey) return visibleLists;
    return visibleLists.filter((list) => list.id === selectedListId);
  }, [allListsKey, selectedListId, visibleLists]);

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

  const handleToggleCompletion = async (task: TrackerTask) => {
    if (!task.is_completed) {
      setJustCheckedIds((prev) => ({ ...prev, [task.id]: true }));
      setTimeout(() => {
        setJustCheckedIds((prev) => {
          const next = { ...prev };
          delete next[task.id];
          return next;
        });
      }, 600);
    }
    await toggleTaskCompletion(task);
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

  const handleListDrop = async (targetListId: string) => {
    if (!draggingListId || draggingListId === targetListId) {
      setDraggingListId(null);
      setDragOverListId(null);
      return;
    }

    const orderedListIds = lists.map((list) => list.id);
    const fromIndex = orderedListIds.indexOf(draggingListId);
    const toIndex = orderedListIds.indexOf(targetListId);
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
      setDraggingListId(null);
      setDragOverListId(null);
      return;
    }

    const nextOrder = [...orderedListIds];
    nextOrder.splice(fromIndex, 1);
    nextOrder.splice(toIndex, 0, draggingListId);
    await reorderLists(nextOrder);
    setDraggingListId(null);
    setDragOverListId(null);
  };

  const totalOpenCount = useMemo(
    () => Object.values(countsByList).reduce((sum, item) => sum + item.open, 0),
    [countsByList]
  );
  const totalCompletedCount = useMemo(
    () => Object.values(countsByList).reduce((sum, item) => sum + item.completed, 0),
    [countsByList]
  );
  const totalTaskCount = useMemo(
    () => Object.values(countsByList).reduce((sum, item) => sum + item.total, 0),
    [countsByList]
  );
  const totalVisibleOpenCount = useMemo(
    () =>
      visibleLists.reduce((sum, list) => sum + (countsByList[list.id]?.open ?? 0), 0),
    [visibleLists, countsByList]
  );

  return (
    <div className="tasks-hub">
      <div className={`tasks-shell ${isSidebarOpen ? "open" : "collapsed"}`}>
        {/* ================================================================
            SIDEBAR
            ================================================================ */}
        <aside className={`tasks-sidebar ${isSidebarOpen ? "open" : "collapsed"}`}>
          <motion.button
            className="tasks-sidebar-toggle"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            whileTap={{ scale: 0.97 }}
          >
            <span>{isSidebarOpen ? "Hide Lists" : "Lists"}</span>
            <motion.span
              animate={{ rotate: isSidebarOpen ? 0 : 180 }}
              transition={{ duration: 0.2 }}
            >
              {isSidebarOpen ? "\u25C0" : "\u25B6"}
            </motion.span>
          </motion.button>

          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
            >
              <div className="mb-2 mt-2 flex items-center justify-between">
                <h3>Lists</h3>
                <span className="neo-label" style={{ color: "var(--neo-cyan)" }}>{visibleLists.length}/{lists.length}</span>
              </div>
              <p className="tasks-muted tasks-sidebar-stats">
                {totalOpenCount} open &bull; {totalCompletedCount} done &bull; {totalTaskCount} total
              </p>

              <motion.button
                className={`tasks-list-row ${selectedListId === allListsKey ? "active" : ""}`}
                onClick={() => setSelectedListId(allListsKey)}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="flex items-center gap-2">
                  <span className="tasks-list-dot" style={{ background: "var(--neo-lime)" }} />
                  All tasks
                </span>
                <motion.span
                  key={totalVisibleOpenCount}
                  initial={{ scale: 1.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  style={{ fontWeight: 800 }}
                >
                  {totalVisibleOpenCount}
                </motion.span>
              </motion.button>

              {lists.map((list, listIndex) => {
                const counts = countsByList[list.id] || { open: 0, completed: 0, total: 0 };
                const renameValue = listRenameById[list.id] !== undefined ? listRenameById[list.id] : list.name;
                const isVisible = !hiddenListIds[list.id];

                return (
                  <motion.div
                    key={list.id}
                    className="mt-1"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: listIndex * 0.03 }}
                  >
                    <motion.button
                      className={`tasks-list-row ${selectedListId === list.id ? "active" : ""} ${isVisible ? "" : "tasks-list-row-hidden"}`}
                      onClick={() => setSelectedListId(list.id)}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isVisible}
                          className="tasks-list-visibility"
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setHiddenListIds((prev) => {
                              const next = { ...prev };
                              if (checked) delete next[list.id];
                              else next[list.id] = true;
                              return next;
                            });
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <motion.span
                          className="tasks-list-dot"
                          style={{ background: list.color_hex }}
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity, delay: listIndex * 0.3 }}
                        />
                        <span className="truncate">{list.name}</span>
                      </span>
                      <motion.span
                        key={counts.open}
                        initial={{ scale: 1.4, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        style={{ fontWeight: 800 }}
                      >
                        {counts.open}
                      </motion.span>
                    </motion.button>

                    <div className="tasks-list-actions mb-2 mt-1 justify-end">
                      <motion.button
                        className="tasks-icon-btn"
                        onClick={() => setListRenameById((prev) => ({ ...prev, [list.id]: renameValue }))}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        Edit
                      </motion.button>
                      <motion.button
                        className="tasks-icon-btn"
                        onClick={async () => {
                          if (lists.length <= 1) return;
                          await removeList(list.id);
                        }}
                        disabled={lists.length <= 1}
                        whileHover={lists.length > 1 ? { scale: 1.05 } : {}}
                        whileTap={lists.length > 1 ? { scale: 0.9 } : {}}
                      >
                        Del
                      </motion.button>
                    </div>

                    <AnimatePresence>
                      {listRenameById[list.id] !== undefined && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="tasks-add-list mb-2 space-y-2"
                        >
                          <input
                            className="tasks-input"
                            value={renameValue}
                            onChange={(e) => setListRenameById((prev) => ({ ...prev, [list.id]: e.target.value }))}
                          />
                          <div className="flex items-center gap-2">
                            <motion.button
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
                              whileTap={{ scale: 0.93 }}
                            >
                              Save
                            </motion.button>
                            <motion.button
                              className="neo-btn neo-btn-sm neo-btn-white"
                              onClick={() => {
                                setListRenameById((prev) => {
                                  const next = { ...prev };
                                  delete next[list.id];
                                  return next;
                                });
                              }}
                              whileTap={{ scale: 0.93 }}
                            >
                              Cancel
                            </motion.button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
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
                <motion.button
                  className="neo-btn neo-btn-sm neo-btn-cyan"
                  onClick={async () => {
                    const created = await createList(newListName);
                    if (created) setNewListName("");
                  }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.93 }}
                >
                  Create
                </motion.button>
              </div>
            </motion.div>
          )}
        </aside>

        {/* ================================================================
            BOARD
            ================================================================ */}
        <section className="tasks-board">
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="neo-card mb-2 py-2"
                style={{ background: "var(--neo-red)", color: "var(--neo-white)" }}
              >
                <p className="neo-label" style={{ color: "var(--neo-white)", letterSpacing: "0.08em" }}>{errorMessage}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="tasks-cards-scroller">
            <div className="tasks-cards">
              {listsToRender.map((list, cardIndex) => {
                const listSort = getSortForList(list.id);
                const allRootTasks = rootTasksByList[list.id] ?? [];
                const sortedRootTasks = sortTasksForList(allRootTasks, listSort.mode, listSort.direction);
                const activeRootTasks = sortedRootTasks.filter((task) => !task.is_completed);
                const completedRootTasks = sortedRootTasks.filter((task) => task.is_completed);
                const dueHeaderByTaskId = new Map<string, string>();
                if (listSort.mode === "due_date") {
                  let previousDueKey = "";
                  activeRootTasks.forEach((task) => {
                    const dueKey = toDueDayKey(task.due_at);
                    if (dueKey !== previousDueKey) {
                      dueHeaderByTaskId.set(task.id, dueGroupLabel(task.due_at));
                      previousDueKey = dueKey;
                    }
                  });
                }
                const completedSubtasks = sortedRootTasks.flatMap((rootTask) =>
                  (tasksByParent[rootTask.id] || [])
                    .filter((subtask) => subtask.is_completed)
                    .map((subtask) => ({ task: subtask, parentTitle: rootTask.title }))
                );
                const completedOpen = completedSectionOpenByList[list.id] ?? false;
                const addTaskOpen = addTaskOpenByList[list.id] ?? false;
                const topDraft = getDraft(list.id, null);
                const hideCompleted = hideCompletedByList[list.id] ?? false;

                const canDragList = selectedListId === allListsKey && listsToRender.length > 1;

                return (
                  <motion.div
                    key={list.id}
                    className={`tasks-card ${draggingListId === list.id ? "dragging" : ""} ${dragOverListId === list.id ? "drop-target" : ""}`}
                    initial={{ opacity: 0, y: 16, rotate: -1 }}
                    animate={{ opacity: 1, y: 0, rotate: 0 }}
                    transition={{ delay: cardIndex * 0.06, type: "spring", stiffness: 300, damping: 25 }}
                    draggable={canDragList}
                    onDragStart={() => {
                      if (!canDragList) return;
                      setDraggingListId(list.id);
                    }}
                    onDragOver={(e) => {
                      if (!canDragList) return;
                      e.preventDefault();
                      setDragOverListId(list.id);
                    }}
                    onDrop={async (e) => {
                      if (!canDragList) return;
                      e.preventDefault();
                      await handleListDrop(list.id);
                    }}
                    onDragEnd={() => {
                      setDraggingListId(null);
                      setDragOverListId(null);
                    }}
                  >
                    {/* Card Header */}
                    <div className="tasks-card-header tasks-card-header-compact">
                      <div className="tasks-card-title-row">
                        <h3 className="tasks-card-title">{list.name}</h3>
                        <div className="flex items-center gap-2">
                          <motion.span
                            className="neo-label"
                            style={{ color: list.color_hex }}
                            key={countsByList[list.id]?.open ?? 0}
                            initial={{ scale: 1.3, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                          >
                            {countsByList[list.id]?.open ?? 0} open
                          </motion.span>
                          <motion.button
                            className="neo-btn neo-btn-sm neo-btn-lime"
                            onClick={() => setAddTaskOpenByList((prev) => ({ ...prev, [list.id]: !addTaskOpen }))}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <motion.span animate={{ rotate: addTaskOpen ? 45 : 0 }} transition={{ duration: 0.15 }}>
                              +
                            </motion.span>
                          </motion.button>
                        </div>
                      </div>

                      <div className="tasks-card-controls">
                        <label className="neo-label" style={{ color: "var(--tasks-muted)" }}>Sort</label>
                        <select
                          className="tasks-select tasks-select-xs"
                          value={listSort.mode}
                          onChange={async (e) => {
                            await setSortForList(list.id, e.target.value as TaskSortMode, listSort.direction);
                          }}
                        >
                          {SORT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                        <motion.button
                          className="tasks-icon-btn tasks-icon-btn-xs"
                          onClick={async () => {
                            await setSortForList(
                              list.id,
                              listSort.mode,
                              listSort.direction === "asc" ? "desc" : "asc"
                            );
                          }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <motion.span
                            key={listSort.direction}
                            initial={{ rotateX: 90 }}
                            animate={{ rotateX: 0 }}
                            transition={{ duration: 0.15 }}
                          >
                            {listSort.direction === "asc" ? "A\u2191" : "D\u2193"}
                          </motion.span>
                        </motion.button>
                        <motion.button
                          className="tasks-icon-btn tasks-icon-btn-xs"
                          onClick={() => {
                            setHideCompletedByList((prev) => ({
                              ...prev,
                              [list.id]: !hideCompleted,
                            }));
                          }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {hideCompleted ? "Done off" : "Done on"}
                        </motion.button>
                      </div>

                      {/* Add Task Form */}
                      <AnimatePresence>
                        {addTaskOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="tasks-quick-form mt-2"
                          >
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
                            <div className="tasks-due-inputs">
                              <input
                                className="tasks-input"
                                type="date"
                                value={getDueParts(topDraft.due_at).date}
                                onChange={(e) => setDraft(list.id, null, { due_at: setDueDatePart(topDraft.due_at, e.target.value) })}
                              />
                              <input
                                className="tasks-input"
                                type="time"
                                value={getDueParts(topDraft.due_at).time}
                                onChange={(e) => setDraft(list.id, null, { due_at: setDueTimePart(topDraft.due_at, e.target.value) })}
                              />
                            </div>
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
                              <motion.button
                                className="neo-btn neo-btn-sm neo-btn-cyan"
                                onClick={async () => {
                                  const created = await createTaskFromDraft(topDraft);
                                  if (created) {
                                    resetDraft(list.id, null);
                                    setAddTaskOpenByList((prev) => ({ ...prev, [list.id]: false }));
                                  }
                                }}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.93 }}
                              >
                                Add task
                              </motion.button>
                              <motion.button
                                className="neo-btn neo-btn-sm neo-btn-white"
                                onClick={() => {
                                  resetDraft(list.id, null);
                                  setAddTaskOpenByList((prev) => ({ ...prev, [list.id]: false }));
                                }}
                                whileTap={{ scale: 0.93 }}
                              >
                                Cancel
                              </motion.button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Card Body */}
                    <div className="tasks-card-body">
                      {activeRootTasks.length === 0 && completedRootTasks.length === 0 && completedSubtasks.length === 0 && (
                        <motion.div
                          className="tasks-empty"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                        >
                          <motion.span
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            style={{ display: "inline-block", marginRight: 6 }}
                          >
                            {"  "}
                          </motion.span>
                          No tasks in this list yet.
                        </motion.div>
                      )}

                      {/* Active Root Tasks */}
                      {activeRootTasks.map((task, taskIndex) => {
                        const expanded = !!expandedTaskIds[task.id];
                        const edit = taskEditsById[task.id] ?? createTaskEditDraft(task);
                        const subtasks = sortTasksForList(tasksByParent[task.id] || [], listSort.mode, listSort.direction);
                        const activeSubtasks = subtasks.filter((subtask) => !subtask.is_completed);
                        const doneSubtaskCount = subtasks.length - activeSubtasks.length;
                        const subtaskDraft = getDraft(list.id, task.id);
                        const addSubtaskOpen = addSubtaskOpenByParent[task.id] ?? false;
                        const canDrag = listSort.mode === "custom";

                        return (
                          <React.Fragment key={task.id}>
                            {listSort.mode === "due_date" && dueHeaderByTaskId.get(task.id) && (
                              <motion.div
                                className="tasks-due-group-label"
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: taskIndex * 0.02 }}
                              >
                                {dueHeaderByTaskId.get(task.id)}
                              </motion.div>
                            )}
                            <motion.div
                              className={`tasks-task-row ${draggingTaskId === task.id ? "dragging" : ""} ${dragOverTaskId === task.id ? "drop-target" : ""}`}
                              initial={{ opacity: 0, x: -12 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: taskIndex * 0.025 }}
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
                                await handleTaskDrop(list.id, null, activeRootTasks.map((item) => item.id), task.id);
                              }}
                              onDragEnd={() => {
                                setDraggingTaskId(null);
                                setDraggingParentId(null);
                                setDragOverTaskId(null);
                              }}
                            >
                              <div className="tasks-task-main">
                                <div style={{ position: "relative" }}>
                                  <Confetti trigger={!!justCheckedIds[task.id]} />
                                  <motion.button
                                    className={`tasks-checkbox ${task.is_completed ? "done" : ""}`}
                                    onClick={async () => { await handleToggleCompletion(task); }}
                                    whileHover={{ scale: 1.2 }}
                                    whileTap={{ scale: 0.85 }}
                                  >
                                    <AnimatePresence>
                                      {task.is_completed && (
                                        <motion.span
                                          initial={{ scale: 0, rotate: -90 }}
                                          animate={{ scale: 1, rotate: 0 }}
                                          exit={{ scale: 0, rotate: 90 }}
                                          transition={{ duration: 0.15 }}
                                        >
                                          {"\u2713"}
                                        </motion.span>
                                      )}
                                    </AnimatePresence>
                                  </motion.button>
                                </div>

                                <div className="min-w-0">
                                  <motion.button
                                    className={`tasks-title-btn ${task.is_completed ? "done" : ""}`}
                                    onClick={() => toggleExpandedTask(task)}
                                    whileHover={{ x: 1 }}
                                  >
                                    {task.title}
                                  </motion.button>
                                  <div className="tasks-meta">
                                    {task.due_at && <span className={dueChipClassName(task.due_at)}>{formatDue(task.due_at)}</span>}
                                    {recurrenceLabel(task) && <span className="tasks-chip">{recurrenceLabel(task)}</span>}
                                    {subtasks.length > 0 && <span className="tasks-chip">{activeSubtasks.length}/{subtasks.length} subtasks</span>}
                                    {doneSubtaskCount > 0 && <span className="tasks-chip">{doneSubtaskCount} done</span>}
                                  </div>
                                </div>

                                <div className="tasks-row-actions">
                                  <motion.button
                                    className="tasks-icon-btn"
                                    onClick={() => setAddSubtaskOpenByParent((prev) => ({ ...prev, [task.id]: !addSubtaskOpen }))}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    {addSubtaskOpen ? "\u2212" : "+"}
                                  </motion.button>
                                  <motion.button
                                    className="tasks-icon-btn tasks-danger"
                                    onClick={async () => { await removeTask(task.id); }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    Del
                                  </motion.button>
                                </div>
                              </div>

                              {/* Subtasks */}
                              {activeSubtasks.length > 0 && (
                                <div className="tasks-subtasks">
                                  {activeSubtasks.map((subtask, subtaskIndex) => (
                                    <motion.div
                                      key={subtask.id}
                                      className={`tasks-subtask-row ${draggingTaskId === subtask.id ? "dragging" : ""} ${dragOverTaskId === subtask.id ? "drop-target" : ""}`}
                                      initial={{ opacity: 0, x: -8 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: subtaskIndex * 0.02 }}
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
                                      <div style={{ position: "relative" }}>
                                        <Confetti trigger={!!justCheckedIds[subtask.id]} />
                                        <motion.button
                                          className={`tasks-checkbox ${subtask.is_completed ? "done" : ""}`}
                                          onClick={async () => { await handleToggleCompletion(subtask); }}
                                          whileHover={{ scale: 1.2 }}
                                          whileTap={{ scale: 0.85 }}
                                        >
                                          <AnimatePresence>
                                            {subtask.is_completed && (
                                              <motion.span
                                                initial={{ scale: 0, rotate: -90 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                exit={{ scale: 0, rotate: 90 }}
                                                transition={{ duration: 0.15 }}
                                              >
                                                {"\u2713"}
                                              </motion.span>
                                            )}
                                          </AnimatePresence>
                                        </motion.button>
                                      </div>
                                      <div className="min-w-0">
                                        <motion.button
                                          className={`tasks-title-btn ${subtask.is_completed ? "done" : ""}`}
                                          onClick={() => toggleExpandedTask(subtask)}
                                          whileHover={{ x: 1 }}
                                        >
                                          {subtask.title}
                                        </motion.button>
                                        <div className="tasks-meta">
                                          {subtask.due_at && <span className={dueChipClassName(subtask.due_at)}>{formatDue(subtask.due_at)}</span>}
                                        </div>
                                      </div>
                                      <div className="tasks-row-actions">
                                        <motion.button
                                          className="tasks-icon-btn tasks-danger"
                                          onClick={async () => { await removeTask(subtask.id); }}
                                          whileHover={{ scale: 1.1 }}
                                          whileTap={{ scale: 0.9 }}
                                        >
                                          Del
                                        </motion.button>
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              )}

                              {/* Add Subtask Form */}
                              <AnimatePresence>
                                {addSubtaskOpen && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    className="tasks-quick-form mt-2 tasks-subtask-form"
                                  >
                                    <input
                                      className="tasks-input"
                                      placeholder="Subtask title"
                                      value={subtaskDraft.title}
                                      onChange={(e) => setDraft(list.id, task.id, { title: e.target.value })}
                                    />
                                    <div className="tasks-due-inputs">
                                      <input
                                        className="tasks-input"
                                        type="date"
                                        value={getDueParts(subtaskDraft.due_at).date}
                                        onChange={(e) => setDraft(list.id, task.id, { due_at: setDueDatePart(subtaskDraft.due_at, e.target.value) })}
                                      />
                                      <input
                                        className="tasks-input"
                                        type="time"
                                        value={getDueParts(subtaskDraft.due_at).time}
                                        onChange={(e) => setDraft(list.id, task.id, { due_at: setDueTimePart(subtaskDraft.due_at, e.target.value) })}
                                      />
                                    </div>
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
                                      <motion.button
                                        className="neo-btn neo-btn-sm neo-btn-cyan"
                                        onClick={async () => {
                                          const created = await createTaskFromDraft(subtaskDraft);
                                          if (created) {
                                            resetDraft(list.id, task.id);
                                            setAddSubtaskOpenByParent((prev) => ({ ...prev, [task.id]: false }));
                                          }
                                        }}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.93 }}
                                      >
                                        Add subtask
                                      </motion.button>
                                      <motion.button
                                        className="neo-btn neo-btn-sm neo-btn-white"
                                        onClick={() => {
                                          resetDraft(list.id, task.id);
                                          setAddSubtaskOpenByParent((prev) => ({ ...prev, [task.id]: false }));
                                        }}
                                        whileTap={{ scale: 0.93 }}
                                      >
                                        Cancel
                                      </motion.button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {/* Task Edit Expansion */}
                              <AnimatePresence>
                                {expanded && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    className="tasks-expansion"
                                  >
                                    <input className="tasks-input" value={edit.title} onChange={(e) => updateTaskEdit(task.id, { title: e.target.value })} />
                                    <textarea className="tasks-textarea" placeholder="Task details" value={edit.details} onChange={(e) => updateTaskEdit(task.id, { details: e.target.value })} />
                                    <div className="tasks-due-inputs">
                                      <input
                                        className="tasks-input"
                                        type="date"
                                        value={getDueParts(edit.due_at).date}
                                        onChange={(e) => updateTaskEdit(task.id, { due_at: setDueDatePart(edit.due_at, e.target.value) })}
                                      />
                                      <input
                                        className="tasks-input"
                                        type="time"
                                        value={getDueParts(edit.due_at).time}
                                        onChange={(e) => updateTaskEdit(task.id, { due_at: setDueTimePart(edit.due_at, e.target.value) })}
                                      />
                                    </div>
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
                                      <motion.button
                                        className="neo-btn neo-btn-sm neo-btn-lime"
                                        onClick={async () => { await saveTaskEdit(task); }}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.93 }}
                                      >
                                        Save
                                      </motion.button>
                                      <motion.button
                                        className="neo-btn neo-btn-sm neo-btn-white"
                                        onClick={() => {
                                          setExpandedTaskIds((prev) => ({ ...prev, [task.id]: false }));
                                          setTaskEditsById((prev) => ({ ...prev, [task.id]: createTaskEditDraft(task) }));
                                        }}
                                        whileTap={{ scale: 0.93 }}
                                      >
                                        Cancel
                                      </motion.button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          </React.Fragment>
                        );
                      })}

                      {/* Completed Section */}
                      {!hideCompleted && (completedRootTasks.length > 0 || completedSubtasks.length > 0) && (
                        <>
                          <motion.button
                            className="tasks-completed-toggle"
                            onClick={() => setCompletedSectionOpenByList((prev) => ({ ...prev, [list.id]: !completedOpen }))}
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <motion.span
                              animate={{ rotate: completedOpen ? 90 : 0 }}
                              transition={{ duration: 0.15 }}
                              style={{ display: "inline-block", marginRight: 4 }}
                            >
                              {"\u25B6"}
                            </motion.span>
                            Completed ({completedRootTasks.length + completedSubtasks.length})
                          </motion.button>

                          <AnimatePresence>
                            {completedOpen && (
                              <motion.div
                                className="tasks-completed-list"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                {completedRootTasks.map((task) => (
                                  <motion.div
                                    key={task.id}
                                    className="tasks-subtask-row"
                                    initial={{ opacity: 0, x: -6 }}
                                    animate={{ opacity: 1, x: 0 }}
                                  >
                                    <div style={{ position: "relative" }}>
                                      <motion.button
                                        className="tasks-checkbox done"
                                        onClick={async () => { await handleToggleCompletion(task); }}
                                        whileHover={{ scale: 1.15 }}
                                        whileTap={{ scale: 0.85 }}
                                      >
                                        {"\u2713"}
                                      </motion.button>
                                    </div>
                                    <div className="min-w-0">
                                      <motion.button
                                        className="tasks-title-btn done"
                                        onClick={() => toggleExpandedTask(task)}
                                        whileHover={{ x: 1 }}
                                      >
                                        {task.title}
                                      </motion.button>
                                      <div className="tasks-meta">{task.due_at && <span className={dueChipClassName(task.due_at)}>{formatDue(task.due_at)}</span>}</div>
                                    </div>
                                    <div className="tasks-row-actions">
                                      <motion.button
                                        className="tasks-icon-btn tasks-danger"
                                        onClick={async () => { await removeTask(task.id); }}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                      >
                                        Del
                                      </motion.button>
                                    </div>
                                  </motion.div>
                                ))}

                                {completedSubtasks.map(({ task, parentTitle }) => (
                                  <motion.div
                                    key={task.id}
                                    className="tasks-subtask-row tasks-completed-subtask"
                                    initial={{ opacity: 0, x: -6 }}
                                    animate={{ opacity: 1, x: 0 }}
                                  >
                                    <div style={{ position: "relative" }}>
                                      <motion.button
                                        className="tasks-checkbox done"
                                        onClick={async () => { await handleToggleCompletion(task); }}
                                        whileHover={{ scale: 1.15 }}
                                        whileTap={{ scale: 0.85 }}
                                      >
                                        {"\u2713"}
                                      </motion.button>
                                    </div>
                                    <div className="min-w-0">
                                      <motion.button
                                        className="tasks-title-btn done"
                                        onClick={() => toggleExpandedTask(task)}
                                        whileHover={{ x: 1 }}
                                      >
                                        {task.title}
                                      </motion.button>
                                      <div className="tasks-meta">
                                        <span className="tasks-chip">Subtask of {parentTitle}</span>
                                        {task.due_at && <span className={dueChipClassName(task.due_at)}>{formatDue(task.due_at)}</span>}
                                      </div>
                                    </div>
                                    <div className="tasks-row-actions">
                                      <motion.button
                                        className="tasks-icon-btn tasks-danger"
                                        onClick={async () => { await removeTask(task.id); }}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                      >
                                        Del
                                      </motion.button>
                                    </div>
                                  </motion.div>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default TasksHubTracker;
