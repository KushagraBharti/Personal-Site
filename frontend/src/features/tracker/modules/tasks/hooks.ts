import { useCallback, useEffect, useMemo, useState } from "react";
import { TaskStatus, TaskTemplate, WeeklySnapshot } from "../../shared/types";
import { formatWeekLabel, shiftWeek, startOfWeekMondayChicago } from "../../shared/utils/date";
import { useTrackerContext } from "../../shared/hooks/useTrackerContext";
import {
  createTemplate,
  deleteTemplate,
  fetchSnapshot,
  fetchTemplates,
  fetchWeekStatuses,
  upsertSnapshot,
  upsertStatus,
  upsertTemplatesOrder,
  updateTemplate,
} from "./api";
import { TaskStatusUpsert, TemplateGroup } from "./types";

const CATEGORY_STEP = 1000;
export const earliestWeekStart = "2026-02-02";

const groupTemplatesByCategory = (templatesList: TaskTemplate[]): TemplateGroup[] => {
  const sorted = [...templatesList].sort((a, b) => {
    if (a.sort_order === b.sort_order) {
      const catCompare = a.category.localeCompare(b.category);
      if (catCompare !== 0) return catCompare;
      return a.text.localeCompare(b.text);
    }
    return a.sort_order - b.sort_order;
  });

  const grouped = new Map<string, TaskTemplate[]>();
  sorted.forEach((template) => {
    const bucket = grouped.get(template.category) || [];
    bucket.push(template);
    grouped.set(template.category, bucket);
  });

  return Array.from(grouped.entries())
    .map(([category, tasks]) => ({ category, tasks, order: tasks[0]?.sort_order ?? 0 }))
    .sort((a, b) => (a.order === b.order ? a.category.localeCompare(b.category) : a.order - b.order));
};

const createEmptySnapshot = (weekStart: string): WeeklySnapshot => ({
  week_start: weekStart,
  build_milestone: "",
  best_demo_hook_url: "",
  best_demo_walkthrough_url: "",
  paid_work_progress: "",
  traction_progress: "",
  next_week_focus: "",
  build_outcome: "",
  internship_outcome: "",
  traction_outcome: "",
});

export const useTasksModule = () => {
  const { userId, supabase, startLoading, stopLoading } = useTrackerContext();

  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [weekStatuses, setWeekStatuses] = useState<Record<string, TaskStatus[]>>({});
  const [snapshots, setSnapshots] = useState<Record<string, WeeklySnapshot | null>>({});
  const [activeWeekStart, setActiveWeekStart] = useState(startOfWeekMondayChicago());
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);
  const [snapshotDraft, setSnapshotDraft] = useState<WeeklySnapshot>(
    createEmptySnapshot(startOfWeekMondayChicago())
  );
  const [manageTemplatesOpen, setManageTemplatesOpen] = useState(false);
  const [showArchivedTemplates, setShowArchivedTemplates] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ category: "", text: "" });
  const [orderingBusy, setOrderingBusy] = useState(false);

  const templateGroups = useMemo(() => groupTemplatesByCategory(templates), [templates]);

  useEffect(() => {
    const existing = snapshots[activeWeekStart];
    if (existing) {
      setSnapshotDraft({ ...existing, week_start: activeWeekStart });
    } else {
      setSnapshotDraft(createEmptySnapshot(activeWeekStart));
    }
  }, [activeWeekStart, snapshots]);

  const refreshTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try {
      const { data, error } = await fetchTemplates(supabase, userId);
      if (!error && data) setTemplates(data);
    } finally {
      setTemplatesLoading(false);
    }
  }, [supabase, userId]);

  const refreshWeekStatuses = useCallback(
    async (week: string) => {
      const { data, error } = await fetchWeekStatuses(supabase, userId, week);
      if (!error && data) setWeekStatuses((prev) => ({ ...prev, [week]: data }));
    },
    [supabase, userId]
  );

  const refreshSnapshot = useCallback(
    async (week: string) => {
      const { data, error } = await fetchSnapshot(supabase, userId, week);
      if (!error) {
        setSnapshots((prev) => ({ ...prev, [week]: data ?? null }));
        if (data) {
          setSnapshotDraft({ ...data, week_start: week });
        }
      }
    },
    [supabase, userId]
  );

  const loadCoreData = useCallback(async () => {
    startLoading();
    try {
      await Promise.all([
        refreshTemplates(),
        refreshWeekStatuses(activeWeekStart),
        refreshSnapshot(activeWeekStart),
      ]);
    } finally {
      stopLoading();
    }
  }, [activeWeekStart, startLoading, stopLoading, refreshTemplates, refreshWeekStatuses, refreshSnapshot]);

  useEffect(() => {
    if (!userId) return;
    loadCoreData();
  }, [userId, activeWeekStart, loadCoreData]);

  const statusesForWeek = weekStatuses[activeWeekStart] || [];
  const statusByTask = useMemo(() => {
    const map: Record<string, TaskStatus> = {};
    statusesForWeek.forEach((s) => {
      map[s.task_id] = s;
    });
    return map;
  }, [statusesForWeek]);

  const upsertTaskStatus = async (taskId: string, updates: Partial<TaskStatus>) => {
    const existing = statusByTask[taskId];
    const payload: TaskStatusUpsert = {
      id: existing?.id,
      user_id: userId,
      week_start: activeWeekStart,
      task_id: taskId,
      completed: existing?.completed ?? false,
      proof_url: existing?.proof_url ?? null,
      note: existing?.note ?? null,
      ...updates,
    };

    const { data, error } = await upsertStatus(supabase, payload);
    if (!error && data) {
      setWeekStatuses((prev) => {
        const list = [...(prev[activeWeekStart] || [])];
        const index = list.findIndex((s) => s.task_id === taskId);
        if (index >= 0) list[index] = data;
        else list.push(data);
        return { ...prev, [activeWeekStart]: list };
      });
    }
  };

  const calculateSortOrderForCategory = (categoryName: string) => {
    const groups = groupTemplatesByCategory(templates);
    const index = groups.findIndex((g) => g.category === categoryName);
    const position = index >= 0 ? index : groups.length;
    const base = position * CATEGORY_STEP;
    const tasksInGroup = index >= 0 ? groups[index].tasks : [];
    return base + tasksInGroup.length + 1;
  };

  const handleTemplateCreate = async () => {
    if (!newTemplate.text.trim() || !newTemplate.category.trim()) return;
    const sortOrder = calculateSortOrderForCategory(newTemplate.category.trim());
    const { error } = await createTemplate(supabase, {
      user_id: userId,
      category: newTemplate.category.trim(),
      text: newTemplate.text.trim(),
      sort_order: sortOrder,
      active: true,
    });
    if (error) {
      console.error("Failed to create template", error);
      return;
    }
    setNewTemplate({ category: "", text: "" });
    refreshTemplates();
  };

  const handleTemplateUpdate = async (template: TaskTemplate, updates: Partial<TaskTemplate>) => {
    let payload: Partial<TaskTemplate> = { ...updates };
    if (updates.category && updates.category !== template.category) {
      const trimmedCategory = updates.category.trim();
      payload = {
        ...payload,
        category: trimmedCategory,
        sort_order: calculateSortOrderForCategory(trimmedCategory),
      };
    } else if (updates.category) {
      payload = { ...payload, category: updates.category.trim() };
    }
    const { error } = await updateTemplate(supabase, userId, template.id, payload);
    if (error) {
      console.error("Failed to update template", error);
      return;
    }
    refreshTemplates();
  };

  const handleTemplateDelete = async (template: TaskTemplate) => {
    const { error } = await deleteTemplate(supabase, userId, template.id);
    if (error) {
      console.error("Failed to delete template", error);
      return;
    }
    setTemplates((prev) => prev.filter((t) => t.id !== template.id));
  };

  const persistGroupOrdering = async (groups: TemplateGroup[]) => {
    setOrderingBusy(true);
    const updates: TaskTemplate[] = [];
    const updatedTemplates: TaskTemplate[] = [];
    const previousTemplates = templates;

    try {
      groups.forEach((group, groupIndex) => {
        group.tasks.forEach((task, taskIndex) => {
          const sortOrder = groupIndex * CATEGORY_STEP + (taskIndex + 1);
          const updated = { ...task, sort_order: sortOrder };
          updates.push({
            ...task,
            user_id: userId,
            sort_order: sortOrder,
          });
          updatedTemplates.push(updated);
        });
      });

      if (updates.length) {
        setTemplates(updatedTemplates);
        const { error } = await upsertTemplatesOrder(supabase, updates);
        if (error) {
          console.error("Failed to persist order", error);
          setTemplates(previousTemplates);
        } else {
          await refreshTemplates();
        }
      }
    } finally {
      setOrderingBusy(false);
    }
  };

  const handleCategoryMove = async (categoryName: string, direction: "up" | "down") => {
    if (orderingBusy) return;
    const groups = groupTemplatesByCategory(templates);
    const index = groups.findIndex((g) => g.category === categoryName);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || targetIndex < 0 || targetIndex >= groups.length) return;
    const reordered = [...groups];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    await persistGroupOrdering(reordered);
  };

  const handleTaskMove = async (templateId: string, direction: "up" | "down") => {
    if (orderingBusy) return;
    const groups = groupTemplatesByCategory(templates);
    const groupIndex = groups.findIndex((g) => g.tasks.some((t) => t.id === templateId));
    if (groupIndex === -1) return;

    const group = groups[groupIndex];
    const visibleTasks = showArchivedTemplates ? group.tasks : group.tasks.filter((t) => t.active);
    const currentIndex = visibleTasks.findIndex((t) => t.id === templateId);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex === -1 || targetIndex < 0 || targetIndex >= visibleTasks.length) return;

    const reorderedVisible = [...visibleTasks];
    [reorderedVisible[currentIndex], reorderedVisible[targetIndex]] = [
      reorderedVisible[targetIndex],
      reorderedVisible[currentIndex],
    ];

    const hiddenTasks = showArchivedTemplates ? [] : group.tasks.filter((t) => !t.active);
    const mergedTasks = showArchivedTemplates ? reorderedVisible : [...reorderedVisible, ...hiddenTasks];
    const reorderedGroups = [...groups];
    reorderedGroups[groupIndex] = { ...group, tasks: mergedTasks };

    await persistGroupOrdering(reorderedGroups);
  };

  const handleSnapshotSave = async () => {
    const payload = { ...snapshotDraft, week_start: activeWeekStart, user_id: userId };
    const { data, error } = await upsertSnapshot(supabase, payload);
    if (!error && data) {
      setSnapshots((prev) => ({ ...prev, [activeWeekStart]: data }));
      setIsSnapshotModalOpen(false);
    }
  };

  const clampWeekStart = (weekStart: string) =>
    weekStart < earliestWeekStart ? earliestWeekStart : weekStart;

  return {
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
    statusesForWeek,
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
  };
};
