import React, { useEffect, useMemo, useState } from "react";
import { Session } from "@supabase/supabase-js";
import GlassButton from "../components/ui/GlassButton";
import GlassCard from "../components/ui/GlassCard";
import supabase, { isSupabaseConfigured } from "../lib/supabaseClient";
import {
  PipelineItem,
  PipelineType,
  TabKey,
  TaskStatus,
  TaskTemplate,
  WeeklySnapshot,
} from "../types/tracker";

type TemplateGroup = { category: string; tasks: TaskTemplate[]; order: number };

const CATEGORY_STEP = 1000;

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

const toDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toChicagoDate = (date = new Date()) =>
  new Date(date.toLocaleString("en-US", { timeZone: "America/Chicago" }));

const startOfWeekMondayChicago = (date = new Date()) => {
  const chicago = toChicagoDate(date);
  const day = chicago.getDay();
  const diff = (day + 6) % 7;
  chicago.setHours(0, 0, 0, 0);
  chicago.setDate(chicago.getDate() - diff);
  return toDateInputValue(chicago);
};

const earliestWeekStart = "2026-02-02";

const shiftWeek = (weekStart: string, weeks: number) => {
  const d = new Date(`${weekStart}T00:00:00`);
  d.setDate(d.getDate() + weeks * 7);
  return toDateInputValue(d);
};

const clampWeekStart = (weekStart: string) => (weekStart < earliestWeekStart ? earliestWeekStart : weekStart);

const formatWeekLabel = (weekStart: string) => {
  const start = new Date(`${weekStart}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(start)} - ${fmt(end)}`;
};

const inputBase =
  "w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition";

const sectionTitle = "text-lg font-semibold text-white";

const Tracker: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("thisWeek");

  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [weekStatuses, setWeekStatuses] = useState<Record<string, TaskStatus[]>>({});
  const [snapshots, setSnapshots] = useState<Record<string, WeeklySnapshot | null>>({});
  const [activeWeekStart, setActiveWeekStart] = useState(startOfWeekMondayChicago());
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);
  const [snapshotDraft, setSnapshotDraft] = useState<WeeklySnapshot>({
    week_start: startOfWeekMondayChicago(),
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
  const [manageTemplatesOpen, setManageTemplatesOpen] = useState(false);
  const [showArchivedTemplates, setShowArchivedTemplates] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ category: "", text: "" });

  const [pipelineItems, setPipelineItems] = useState<PipelineItem[]>([]);
  const [pipelineDraft, setPipelineDraft] = useState<Partial<PipelineItem>>({
    type: "internship",
    next_action_date: toDateInputValue(toChicagoDate()),
  });
  const [showPastDeals, setShowPastDeals] = useState(false);

  const [loadingAll, setLoadingAll] = useState(false);
  const [orderingBusy, setOrderingBusy] = useState(false);

  const userId = session?.user?.id;
  const templateGroups = useMemo(() => groupTemplatesByCategory(templates), [templates]);

  useEffect(() => {
    const existing = snapshots[activeWeekStart];
    if (existing) {
      setSnapshotDraft({ ...existing, week_start: activeWeekStart });
    } else {
      setSnapshotDraft({
        week_start: activeWeekStart,
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
    }
  }, [activeWeekStart, snapshots]);

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }
    const init = async () => {
      const { data } = await supabase!.auth.getSession();
      setSession(data.session);
      setAuthLoading(false);
    };
    init();
    const { data: listener } = supabase!.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setAuthLoading(false);
    });
    return () => listener?.subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId || !supabase) return;
    loadCoreData();
  }, [userId, activeWeekStart]);

  const loadCoreData = async () => {
    if (!supabase) return;
    setLoadingAll(true);
    await Promise.all([
      fetchTemplates(),
      fetchWeekStatuses(activeWeekStart),
      fetchSnapshot(activeWeekStart),
      fetchPipelines(),
    ]);
    setLoadingAll(false);
  };

  const fetchTemplates = async () => {
    if (!userId || !supabase) return;
    setTemplatesLoading(true);
    const { data, error } = await supabase
      .from("weekly_task_templates")
      .select("*")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true })
      .order("category", { ascending: true });
    if (!error && data) setTemplates(data);
    setTemplatesLoading(false);
  };

  const fetchWeekStatuses = async (week: string) => {
    if (!userId || !supabase) return;
    const { data, error } = await supabase
      .from("weekly_task_status")
      .select("*")
      .eq("user_id", userId)
      .eq("week_start", week);
    if (!error && data) setWeekStatuses((prev) => ({ ...prev, [week]: data }));
  };

  const fetchSnapshot = async (week: string) => {
    if (!userId || !supabase) return;
    const { data, error } = await supabase
      .from("weekly_snapshots")
      .select("*")
      .eq("user_id", userId)
      .eq("week_start", week)
      .maybeSingle();
    if (!error) {
      setSnapshots((prev) => ({ ...prev, [week]: data ?? null }));
      if (data) {
        setSnapshotDraft({ ...data, week_start: week });
      }
    }
  };

  const fetchPipelines = async () => {
    if (!userId || !supabase) return;
    const { data, error } = await supabase
      .from("pipeline_items")
      .select("*")
      .eq("user_id", userId)
      .order("next_action_date", { ascending: true })
      .order("created_at", { ascending: true });
    if (!error && data) setPipelineItems(data);
  };

  const statusesForWeek = weekStatuses[activeWeekStart] || [];
  const statusByTask = useMemo(() => {
    const map: Record<string, TaskStatus> = {};
    statusesForWeek.forEach((s) => (map[s.task_id] = s));
    return map;
  }, [statusesForWeek]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setAuthError("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
      return;
    }
    setAuthError("");
    const { error } = await supabase!.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase!.auth.signOut();
    setSession(null);
  };

  const upsertStatus = async (taskId: string, updates: Partial<TaskStatus>) => {
    if (!userId || !supabase) return;
    const existing = statusByTask[taskId];
    const payload = {
      id: existing?.id,
      user_id: userId,
      week_start: activeWeekStart,
      task_id: taskId,
      completed: existing?.completed ?? false,
      proof_url: existing?.proof_url ?? null,
      note: existing?.note ?? null,
      ...updates,
    };
    const { data, error } = await supabase
      .from("weekly_task_status")
      .upsert(payload, { onConflict: "user_id,week_start,task_id" })
      .select()
      .single();
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
    if (!userId || !supabase || !newTemplate.text.trim() || !newTemplate.category.trim()) return;
    const sortOrder = calculateSortOrderForCategory(newTemplate.category.trim());
    await supabase!.from("weekly_task_templates").insert({
      user_id: userId,
      category: newTemplate.category.trim(),
      text: newTemplate.text.trim(),
      sort_order: sortOrder,
      active: true,
    });
    setNewTemplate({ category: "", text: "" });
    fetchTemplates();
  };

  const handleTemplateUpdate = async (template: TaskTemplate, updates: Partial<TaskTemplate>) => {
    if (!userId || !supabase) return;
    let payload: Partial<TaskTemplate> = { ...updates };
    if (updates.category && updates.category !== template.category) {
      payload = { ...payload, sort_order: calculateSortOrderForCategory(updates.category.trim()) };
    }
    await supabase
      .from("weekly_task_templates")
      .update({ ...payload })
      .eq("user_id", userId)
      .eq("id", template.id);
    fetchTemplates();
  };

  const handleTemplateDelete = async (template: TaskTemplate) => {
    if (!userId || !supabase) return;
    await supabase.from("weekly_task_templates").delete().eq("user_id", userId).eq("id", template.id);
    setTemplates((prev) => prev.filter((t) => t.id !== template.id));
  };

  const persistGroupOrdering = async (groups: TemplateGroup[]) => {
    if (!userId || !supabase) return;
    setOrderingBusy(true);
    const updates: TaskTemplate[] = [];
    const updatedTemplates: TaskTemplate[] = [];
    const previousTemplates = templates;

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
      const { error } = await supabase
        .from("weekly_task_templates")
        .upsert(updates, { onConflict: "id", ignoreDuplicates: false });
      if (error) {
        console.error("Failed to persist order", error);
        setTemplates(previousTemplates);
      } else {
        await fetchTemplates();
      }
    }
    setOrderingBusy(false);
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
    if (!userId || !supabase) return;
    const payload = { ...snapshotDraft, week_start: activeWeekStart, user_id: userId };
    const { data, error } = await supabase!
      .from("weekly_snapshots")
      .upsert(payload, { onConflict: "user_id,week_start" })
      .select()
      .single();
    if (!error) {
      setSnapshots((prev) => ({ ...prev, [activeWeekStart]: data }));
      setIsSnapshotModalOpen(false);
    }
  };

  const savePipelineItem = async (item: Partial<PipelineItem> & { type: PipelineType }) => {
    if (!userId || !supabase || !item.name || !item.type) return;
    const links = typeof item.links === "string" ? item.links : item.links ?? [];
    const payload: any = {
      ...item,
      user_id: userId,
      links: Array.isArray(links) ? links : (links as unknown as string[]),
      archived: item.archived ?? false,
    };
    if (item.id) {
      await supabase!.from("pipeline_items").update(payload).eq("user_id", userId).eq("id", item.id);
    } else {
      await supabase!.from("pipeline_items").insert(payload);
    }
    fetchPipelines();
  };

  const deletePipelineItem = async (id: string) => {
    if (!userId || !supabase) return;
    await supabase!.from("pipeline_items").delete().eq("user_id", userId).eq("id", id);
    setPipelineItems((prev) => prev.filter((p) => p.id !== id));
  };

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
            onChange={(e) => upsertStatus(template.id, { completed: e.target.checked })}
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
            onChange={(e) => upsertStatus(template.id, { proof_url: e.target.value })}
          />
          <input
            className={inputBase}
            placeholder="Note"
            value={status?.note || ""}
            onChange={(e) => upsertStatus(template.id, { note: e.target.value })}
          />
        </div>
      </div>
    );
  };

  const renderTemplateManager = () => {
    const activeCount = templates.filter((t) => t.active).length;
    const archivedCount = templates.length - activeCount;
    const visibleGroups = templateGroups.filter((group) => (showArchivedTemplates ? true : group.tasks.some((t) => t.active)));
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
              placeholder="e.g. Build"
              value={newTemplate.category}
              onChange={(e) => setNewTemplate((t) => ({ ...t, category: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wide text-white/70">Task text</label>
            <input
              className={inputBase}
              placeholder="Ship landing page polish"
              value={newTemplate.text}
              onChange={(e) => setNewTemplate((t) => ({ ...t, text: e.target.value }))}
            />
          </div>
          <GlassButton className="w-full px-4 py-2 md:w-auto" onClick={handleTemplateCreate}>
            Add Task
          </GlassButton>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2 text-xs text-white/70">
            <span className="rounded-full bg-white/10 px-2 py-1">Active: {activeCount}</span>
            <span className="rounded-full bg-white/10 px-2 py-1">Archived: {archivedCount}</span>
          </div>
          <button
            className="rounded bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20"
            onClick={() => setShowArchivedTemplates((v) => !v)}
          >
            {showArchivedTemplates ? "Hide archived" : "Show archived"}
          </button>
        </div>

        <div className="space-y-3">
          {visibleGroups.map((group) => {
            const tasks = showArchivedTemplates ? group.tasks : group.tasks.filter((t) => t.active);
            return (
              <div key={group.category} className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-white">{group.category || "Uncategorized"}</p>
                    <p className="text-xs text-white/60">
                      {tasks.length} task{tasks.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="rounded bg-white/10 px-3 py-2 text-xs text-white hover:bg-white/20 disabled:opacity-50"
                      onClick={() => handleCategoryMove(group.category, "up")}
                      disabled={orderingBusy || group.category === firstVisibleCategory}
                    >
                      Move category up
                    </button>
                    <button
                      className="rounded bg-white/10 px-3 py-2 text-xs text-white hover:bg-white/20 disabled:opacity-50"
                      onClick={() => handleCategoryMove(group.category, "down")}
                      disabled={orderingBusy || group.category === lastVisibleCategory}
                    >
                      Move category down
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
  const renderDeals = () => {
    const now = toChicagoDate();
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() + 14);

    const sorted = [...pipelineItems].sort((a, b) => {
      const aDate = a.next_action_date ? new Date(a.next_action_date).getTime() : Infinity;
      const bDate = b.next_action_date ? new Date(b.next_action_date).getTime() : Infinity;
      return aDate - bDate;
    });

    const current = sorted.filter((item) => {
      if (item.archived) return false;
      if (!item.next_action_date) return true;
      const d = new Date(item.next_action_date);
      return d <= cutoff;
    });

    const past = sorted.filter((item) => {
      if (item.archived) return true;
      if (!item.next_action_date) return false;
      const d = new Date(item.next_action_date);
      return d > cutoff;
    });

    const visible = showPastDeals ? past : current;

    return (
      <div className="space-y-4">
        <GlassCard className="p-4">
          <h3 className={sectionTitle}>Add Deal</h3>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <input
              className={inputBase}
              placeholder="Name"
              value={pipelineDraft.name || ""}
              onChange={(e) => setPipelineDraft((d) => ({ ...d, name: e.target.value }))}
            />
            <select
              className={inputBase}
              value={pipelineDraft.type || "internship"}
              onChange={(e) => setPipelineDraft((d) => ({ ...d, type: e.target.value as PipelineType }))}
            >
              <option value="internship">Internship</option>
              <option value="traction">Traction</option>
              <option value="relationship">Relationship</option>
            </select>
            <input
              className={inputBase}
              placeholder="Stage"
              value={pipelineDraft.stage || ""}
              onChange={(e) => setPipelineDraft((d) => ({ ...d, stage: e.target.value }))}
            />
            <input
              className={inputBase}
              type="date"
              value={pipelineDraft.next_action_date || ""}
              onChange={(e) => setPipelineDraft((d) => ({ ...d, next_action_date: e.target.value }))}
            />
            <input
              className={inputBase}
              placeholder="Next action"
              value={pipelineDraft.next_action || ""}
              onChange={(e) => setPipelineDraft((d) => ({ ...d, next_action: e.target.value }))}
            />
            <textarea
              className={`${inputBase} min-h-[80px] md:col-span-2`}
              placeholder="Notes"
              value={pipelineDraft.notes || ""}
              onChange={(e) => setPipelineDraft((d) => ({ ...d, notes: e.target.value }))}
            />
            <textarea
              className={`${inputBase} min-h-[80px] md:col-span-2`}
              placeholder="Links (one per line)"
              value={Array.isArray(pipelineDraft.links) ? pipelineDraft.links.join("\n") : pipelineDraft.links || ""}
              onChange={(e) =>
                setPipelineDraft((d) => ({ ...d, links: e.target.value.split("\n").filter(Boolean) }))
              }
            />
          </div>
          <GlassButton
            className="mt-3 px-4 py-2"
            onClick={() => {
              savePipelineItem(pipelineDraft as PipelineItem & { type: PipelineType });
              setPipelineDraft({ type: pipelineDraft.type || "internship", next_action_date: toDateInputValue(toChicagoDate()) });
            }}
          >
            Add Deal
          </GlassButton>
        </GlassCard>

        <div className="flex items-center justify-between">
          <h3 className={sectionTitle}>Active Deals</h3>
          <div className="flex gap-2">
            <button
              className={`rounded-full px-3 py-2 text-sm ${!showPastDeals ? "bg-white text-gray-900" : "bg-white/10 text-white"}`}
              onClick={() => setShowPastDeals(false)}
            >
              Current
            </button>
            <button
              className={`rounded-full px-3 py-2 text-sm ${showPastDeals ? "bg-white text-gray-900" : "bg-white/10 text-white"}`}
              onClick={() => setShowPastDeals(true)}
            >
              Past / Archive
            </button>
          </div>
        </div>

        <div className="grid gap-3">
          {visible.map((item) => (
            <div key={item.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-white font-medium">{item.name}</p>
                  <p className="text-xs text-white/60">
                    {item.type} • {item.stage || "Stage"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="rounded bg-white/10 px-3 py-2 text-xs text-white hover:bg-white/20"
                    onClick={() => savePipelineItem({ ...item, archived: !item.archived })}
                  >
                    {item.archived ? "Unarchive" : "Archive"}
                  </button>
                  <button
                    className="rounded bg-white/10 px-3 py-2 text-xs text-white hover:bg-white/20"
                    onClick={() => deletePipelineItem(item.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <select
                  className={inputBase}
                  value={item.type}
                  onChange={(e) => savePipelineItem({ ...item, type: e.target.value as PipelineType })}
                >
                  <option value="internship">Internship</option>
                  <option value="traction">Traction</option>
                  <option value="relationship">Relationship</option>
                </select>
                <input
                  className={inputBase}
                  placeholder="Stage"
                  value={item.stage || ""}
                  onChange={(e) => savePipelineItem({ ...item, stage: e.target.value })}
                />
                <input
                  className={inputBase}
                  type="date"
                  value={item.next_action_date || ""}
                  onChange={(e) => savePipelineItem({ ...item, next_action_date: e.target.value })}
                />
                <input
                  className={inputBase}
                  placeholder="Next action"
                  value={item.next_action || ""}
                  onChange={(e) => savePipelineItem({ ...item, next_action: e.target.value })}
                />
                <textarea
                  className={`${inputBase} min-h-[70px] md:col-span-2`}
                  placeholder="Notes"
                  value={item.notes || ""}
                  onChange={(e) => savePipelineItem({ ...item, notes: e.target.value })}
                />
                <textarea
                  className={`${inputBase} min-h-[70px] md:col-span-2`}
                  placeholder="Links (one per line)"
                  value={Array.isArray(item.links) ? item.links.join("\n") : ""}
                  onChange={(e) =>
                    savePipelineItem({ ...item, links: e.target.value.split("\n").filter(Boolean) })
                  }
                />
              </div>
            </div>
          ))}
          {!visible.length && <p className="text-sm text-white/60">Nothing here yet.</p>}
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    if (activeTab === "thisWeek") {
      const activeGroups = templateGroups
        .map((group) => ({ ...group, tasks: group.tasks.filter((t) => t.active) }))
        .filter((group) => group.tasks.length);
      return (
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
                <GlassCard
                  key={group.category}
                  className="w-full max-w-none p-8 md:p-9"
                >
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
      );
    }

    return renderDeals();
  };

  if (!isSupabaseConfigured || !supabase) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <GlassCard className="w-full max-w-md p-6">
          <h1 className="text-2xl font-semibold text-white mb-2">Tracker setup needed</h1>
          <p className="text-sm text-white/70">
            Add <code className="font-mono">VITE_SUPABASE_URL</code> and <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> to your environment to enable the private tracker.
          </p>
        </GlassCard>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white/80">
        Loading tracker...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <GlassCard className="w-full max-w-md p-6">
          <h1 className="text-2xl font-semibold text-white mb-2">Private Tracker</h1>
          <p className="text-sm text-white/70 mb-4">Sign in to access your tracker.</p>
          <form className="space-y-3" onSubmit={handleSignIn}>
            <input
              className={inputBase}
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className={inputBase}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {authError && <p className="text-sm text-red-300">{authError}</p>}
            <GlassButton className="w-full py-3" type="submit">
              Sign In
            </GlassButton>
          </form>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 md:px-10 text-white">
      <div className="mx-auto w-full max-w-screen-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-white/70">Private</p>
            <h1 className="text-3xl font-semibold text-white">Execution Tracker</h1>
          </div>
          <GlassButton className="px-4 py-2" onClick={handleSignOut}>
            Log out
          </GlassButton>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { key: "thisWeek", label: "Weekly" },
            { key: "deals", label: "Active Deals" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabKey)}
              className={`rounded-full px-4 py-2 text-sm ${
                activeTab === tab.key ? "bg-white text-gray-900" : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {loadingAll && <p className="text-sm text-white/60">Syncing data...</p>}
        {renderTabContent()}
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
    </div>
  );
};



export default Tracker;
