
import React, { useEffect, useMemo, useState } from "react";
import { Session } from "@supabase/supabase-js";
import GlassCard from "../components/ui/GlassCard";
import GlassButton from "../components/ui/GlassButton";
import supabase, { isSupabaseConfigured } from "../lib/supabaseClient";
import {
  EvidenceLogItem,
  MobilityRoute,
  PipelineItem,
  PipelineType,
  ProofVaultItem,
  TabKey,
  TaskStatus,
  TaskTemplate,
  WeeklySnapshot,
} from "../types/tracker";

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

const shiftWeek = (weekStart: string, weeks: number) => {
  const d = new Date(`${weekStart}T00:00:00`);
  d.setDate(d.getDate() + weeks * 7);
  return toDateInputValue(d);
};

const formatWeekLabel = (weekStart: string) => {
  const start = new Date(`${weekStart}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
  });
  const [manageTemplatesOpen, setManageTemplatesOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ category: "", text: "" });
  const [savingTemplateId, setSavingTemplateId] = useState<string | null>(null);

  const [pipelineItems, setPipelineItems] = useState<PipelineItem[]>([]);
  const [pipelineDrafts, setPipelineDrafts] = useState<Record<PipelineType, Partial<PipelineItem>>>(
    {
      paid_work: {},
      relationship: {},
      traction: {},
    }
  );
  const [proofVault, setProofVault] = useState<ProofVaultItem[]>([]);
  const [proofDraft, setProofDraft] = useState<Partial<ProofVaultItem>>({
    title: "",
    url: "",
    tag: "",
    pinned: false,
    sort_order: 0,
  });
  const [evidenceLog, setEvidenceLog] = useState<EvidenceLogItem[]>([]);
  const [mobilityRoutes, setMobilityRoutes] = useState<MobilityRoute[]>([]);
  const [loadingAll, setLoadingAll] = useState(false);

  const userId = session?.user?.id;

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
    if (!userId) return;
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
      fetchProofVault(),
      fetchEvidence(),
      fetchMobility(),
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
      .order("category", { ascending: true })
      .order("sort_order", { ascending: true });
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
    if (!error && data) {
      setWeekStatuses((prev) => ({ ...prev, [week]: data }));
    }
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
      if (data) setSnapshotDraft({ ...data, week_start: week });
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

  const fetchProofVault = async () => {
    if (!userId || !supabase) return;
    const { data, error } = await supabase
      .from("proof_vault_items")
      .select("*")
      .eq("user_id", userId)
      .order("pinned", { ascending: false })
      .order("sort_order", { ascending: true });
    if (!error && data) setProofVault(data);
  };

  const fetchEvidence = async () => {
    if (!userId || !supabase) return;
    const { data, error } = await supabase
      .from("evidence_log")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });
    if (!error && data) setEvidenceLog(data);
  };

  const fetchMobility = async () => {
    if (!userId || !supabase) return;
    const { data, error } = await supabase
      .from("mobility_routes")
      .select("*")
      .eq("user_id", userId)
      .order("is_primary", { ascending: false })
      .order("route_name", { ascending: true });
    if (!error && data) setMobilityRoutes(data);
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

  const handleTemplateCreate = async () => {
    if (!userId || !supabase || !newTemplate.text.trim() || !newTemplate.category.trim()) return;
    const categoryTemplates = templates.filter((t) => t.category === newTemplate.category);
    const sortOrder = categoryTemplates.length ? Math.max(...categoryTemplates.map((t) => t.sort_order)) + 1 : 1;
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
    setSavingTemplateId(template.id);
    let payload: Partial<TaskTemplate> = { ...updates };
    if (updates.category && updates.category !== template.category) {
      const categoryTemplates = templates.filter((t) => t.category === updates.category);
      const sortOrder = categoryTemplates.length ? Math.max(...categoryTemplates.map((t) => t.sort_order)) + 1 : 1;
      payload = { ...payload, sort_order: sortOrder };
    }
    await supabase!
      .from("weekly_task_templates")
      .update({ ...payload })
      .eq("user_id", userId)
      .eq("id", template.id);
    setSavingTemplateId(null);
    fetchTemplates();
  };

  const handleTemplateMove = async (template: TaskTemplate, direction: "up" | "down") => {
    if (!supabase) return;
    const inCategory = templates
      .filter((t) => t.category === template.category && t.active)
      .sort((a, b) => a.sort_order - b.sort_order);
    const index = inCategory.findIndex((t) => t.id === template.id);
    const target = direction === "up" ? inCategory[index - 1] : inCategory[index + 1];
    if (!target) return;
    await supabase!.from("weekly_task_templates").upsert([
      { id: template.id, sort_order: target.sort_order },
      { id: target.id, sort_order: template.sort_order },
    ]);
    fetchTemplates();
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

  const saveProofItem = async (item: Partial<ProofVaultItem>) => {
    if (!userId || !supabase || !item.title || !item.url) return;
    const payload: any = { ...item, user_id: userId, pinned: item.pinned ?? false, sort_order: item.sort_order ?? 0 };
    if (item.id) {
      await supabase!.from("proof_vault_items").update(payload).eq("user_id", userId).eq("id", item.id);
    } else {
      await supabase!.from("proof_vault_items").insert(payload);
      setProofDraft({ title: "", url: "", tag: "", pinned: false, sort_order: 0 });
    }
    fetchProofVault();
  };

  const deleteProofItem = async (id: string) => {
    if (!userId || !supabase) return;
    await supabase!.from("proof_vault_items").delete().eq("user_id", userId).eq("id", id);
    setProofVault((prev) => prev.filter((p) => p.id !== id));
  };

  const saveEvidenceItem = async (item: Partial<EvidenceLogItem>) => {
    if (!userId || !supabase || !item.date || !item.type || !item.link) return;
    const payload: any = { ...item, user_id: userId };
    if (item.id) {
      await supabase!.from("evidence_log").update(payload).eq("user_id", userId).eq("id", item.id);
    } else {
      await supabase!.from("evidence_log").insert(payload);
    }
    fetchEvidence();
  };

  const deleteEvidenceItem = async (id: string) => {
    if (!userId || !supabase) return;
    await supabase!.from("evidence_log").delete().eq("user_id", userId).eq("id", id);
    setEvidenceLog((prev) => prev.filter((p) => p.id !== id));
  };

  const saveMobilityRoute = async (route: Partial<MobilityRoute>) => {
    if (!userId || !supabase || !route.route_name) return;
    const payload: any = { ...route, user_id: userId, is_primary: route.is_primary ?? false };
    if (route.id) {
      await supabase!.from("mobility_routes").update(payload).eq("user_id", userId).eq("id", route.id);
    } else {
      await supabase!.from("mobility_routes").insert(payload);
    }
    fetchMobility();
  };

  const deleteMobilityRoute = async (id: string) => {
    if (!userId || !supabase) return;
    await supabase!.from("mobility_routes").delete().eq("user_id", userId).eq("id", id);
    setMobilityRoutes((prev) => prev.filter((p) => p.id !== id));
  };

  const pipelineByType = useMemo(() => {
    const map: Record<PipelineType, PipelineItem[]> = { paid_work: [], relationship: [], traction: [] };
    pipelineItems.forEach((item) => {
      map[item.type].push(item);
    });
    (Object.keys(map) as PipelineType[]).forEach((key) => {
      map[key].sort((a, b) => {
        const aDate = a.next_action_date ? new Date(a.next_action_date).getTime() : Infinity;
        const bDate = b.next_action_date ? new Date(b.next_action_date).getTime() : Infinity;
        return aDate - bDate;
      });
    });
    return map;
  }, [pipelineItems]);
  const renderTaskRow = (template: TaskTemplate) => {
    const status = statusByTask[template.id];
    return (
      <div
        key={template.id}
        className="flex flex-col gap-2 rounded-lg border border-white/10 bg-white/5 p-3 md:flex-row md:items-center"
      >
        <div className="flex items-start gap-3 md:w-1/3">
          <input
            type="checkbox"
            className="mt-1 h-5 w-5 cursor-pointer rounded border-white/40 bg-white/10 text-primary focus:ring-primary"
            checked={!!status?.completed}
            onChange={(e) => upsertStatus(template.id, { completed: e.target.checked })}
          />
          <span className={`text-sm ${template.active ? "text-white" : "text-white/50 line-through"}`}>
            {template.text}
          </span>
        </div>
        <div className="grid flex-1 grid-cols-1 gap-2 md:grid-cols-2">
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

  const renderTemplateManager = () => (
    <div className="rounded-xl border border-white/15 bg-white/10 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex-1">
          <label className="text-xs uppercase tracking-wide text-white/70">Category</label>
          <input
            className={inputBase}
            placeholder="e.g. Build"
            value={newTemplate.category}
            onChange={(e) => setNewTemplate((t) => ({ ...t, category: e.target.value }))}
          />
        </div>
        <div className="flex-[2]">
          <label className="text-xs uppercase tracking-wide text-white/70">Task text</label>
          <input
            className={inputBase}
            placeholder="Ship landing page polish"
            value={newTemplate.text}
            onChange={(e) => setNewTemplate((t) => ({ ...t, text: e.target.value }))}
          />
        </div>
        <GlassButton className="px-4 py-2" onClick={handleTemplateCreate}>
          Add Template
        </GlassButton>
      </div>
      <div className="mt-4 grid gap-3">
        {templates.map((template) => (
          <div
            key={template.id}
            className="flex flex-col gap-2 rounded-lg border border-white/10 bg-white/5 p-3 md:flex-row md:items-center"
          >
            <div className="flex-1 space-y-2">
              <input
                className={inputBase}
                value={template.text}
                onChange={(e) => handleTemplateUpdate(template, { text: e.target.value })}
              />
              <input
                className={inputBase}
                value={template.category}
                placeholder="Category"
                onChange={(e) => handleTemplateUpdate(template, { category: e.target.value })}
              />
              <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={template.active}
                    onChange={(e) => handleTemplateUpdate(template, { active: e.target.checked })}
                  />
                  Active
                </label>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="rounded bg-white/10 px-3 py-2 text-xs text-white hover:bg-white/20"
                onClick={() => handleTemplateMove(template, "up")}
                disabled={savingTemplateId === template.id}
              >
                Up
              </button>
              <button
                className="rounded bg-white/10 px-3 py-2 text-xs text-white hover:bg-white/20"
                onClick={() => handleTemplateMove(template, "down")}
                disabled={savingTemplateId === template.id}
              >
                Down
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  const renderPipelineSection = (type: PipelineType, title: string) => {
    const list = pipelineByType[type];
    const draft = pipelineDrafts[type] || {};
    const updateDraft = (field: keyof PipelineItem, value: any) =>
      setPipelineDrafts((prev) => ({ ...prev, [type]: { ...prev[type], [field]: value, type } }));

    const linksText =
      Array.isArray(draft.links) ? draft.links.join("\n") : typeof draft.links === "string" ? draft.links : "";

    return (
      <div className="rounded-xl border border-white/15 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <h3 className={sectionTitle}>{title}</h3>
        </div>
        <div className="mt-3 grid gap-3">
          <div className="grid gap-2 md:grid-cols-2">
            <input
              className={inputBase}
              placeholder="Name"
              value={draft.name || ""}
              onChange={(e) => updateDraft("name", e.target.value)}
            />
            <input
              className={inputBase}
              placeholder="Stage"
              value={draft.stage || ""}
              onChange={(e) => updateDraft("stage", e.target.value)}
            />
            <input
              className={inputBase}
              type="date"
              placeholder="Last touch"
              value={draft.last_touch || ""}
              onChange={(e) => updateDraft("last_touch", e.target.value)}
            />
            <input
              className={inputBase}
              type="date"
              placeholder="Next action date"
              value={draft.next_action_date || ""}
              onChange={(e) => updateDraft("next_action_date", e.target.value)}
            />
            <input
              className={inputBase}
              placeholder="Next action"
              value={draft.next_action || ""}
              onChange={(e) => updateDraft("next_action", e.target.value)}
            />
            <textarea
              className={`${inputBase} min-h-[80px]`}
              placeholder="Links (one per line)"
              value={linksText}
              onChange={(e) => updateDraft("links", e.target.value.split("\n").filter(Boolean))}
            />
            <textarea
              className={`${inputBase} min-h-[80px] md:col-span-2`}
              placeholder="Notes"
              value={draft.notes || ""}
              onChange={(e) => updateDraft("notes", e.target.value)}
            />
          </div>
          <GlassButton
            className="px-4 py-2"
            onClick={() => {
              savePipelineItem({ ...draft, type });
              setPipelineDrafts((prev) => ({ ...prev, [type]: { type } }));
            }}
          >
            Add
          </GlassButton>
        </div>
        <div className="mt-4 grid gap-3">
          {list.map((item) => (
            <div key={item.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-white font-medium">{item.name}</p>
                  <p className="text-xs text-white/60">{item.stage}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="rounded bg-white/10 px-3 py-2 text-xs text-white hover:bg-white/20"
                    onClick={() => deletePipelineItem(item.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <input
                  className={inputBase}
                  value={item.stage}
                  onChange={(e) => savePipelineItem({ ...item, stage: e.target.value })}
                />
                <input
                  className={inputBase}
                  type="date"
                  value={item.last_touch || ""}
                  onChange={(e) => savePipelineItem({ ...item, last_touch: e.target.value })}
                />
                <input
                  className={inputBase}
                  placeholder="Next action"
                  value={item.next_action || ""}
                  onChange={(e) => savePipelineItem({ ...item, next_action: e.target.value })}
                />
                <input
                  className={inputBase}
                  type="date"
                  value={item.next_action_date || ""}
                  onChange={(e) => savePipelineItem({ ...item, next_action_date: e.target.value })}
                />
                <textarea
                  className={`${inputBase} min-h-[80px] md:col-span-2`}
                  value={Array.isArray(item.links) ? item.links.join("\n") : ""}
                  onChange={(e) =>
                    savePipelineItem({ ...item, links: e.target.value.split("\n").filter(Boolean) })
                  }
                  placeholder="Links (one per line)"
                />
                <textarea
                  className={`${inputBase} min-h-[80px] md:col-span-2`}
                  value={item.notes || ""}
                  onChange={(e) => savePipelineItem({ ...item, notes: e.target.value })}
                  placeholder="Notes"
                />
              </div>
            </div>
          ))}
          {!list.length && <p className="text-sm text-white/60">No items yet.</p>}
        </div>
      </div>
    );
  };
  const renderProofVault = () => (
    <div className="grid gap-4">
      <div className="rounded-xl border border-white/15 bg-white/5 p-4">
        <h3 className={sectionTitle}>Add Asset</h3>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          <input
            className={inputBase}
            placeholder="Title"
            value={proofDraft.title || ""}
            onChange={(e) => setProofDraft((d) => ({ ...d, title: e.target.value }))}
          />
          <input
            className={inputBase}
            placeholder="URL"
            value={proofDraft.url || ""}
            onChange={(e) => setProofDraft((d) => ({ ...d, url: e.target.value }))}
          />
          <input
            className={inputBase}
            placeholder="Tag"
            value={proofDraft.tag || ""}
            onChange={(e) => setProofDraft((d) => ({ ...d, tag: e.target.value }))}
          />
          <label className="flex items-center gap-2 text-sm text-white/80">
            <input
              type="checkbox"
              checked={!!proofDraft.pinned}
              onChange={(e) => setProofDraft((d) => ({ ...d, pinned: e.target.checked }))}
            />
            Pinned
          </label>
        </div>
        <GlassButton className="mt-3 px-4 py-2" onClick={() => saveProofItem(proofDraft)}>
          Add
        </GlassButton>
      </div>
      <div className="grid gap-3">
        {proofVault.map((item) => (
          <div key={item.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium text-white">{item.title}</p>
                <p className="text-xs text-white/60">{item.url}</p>
              </div>
              <div className="flex gap-2">
                <button
                  className="rounded bg-white/10 px-3 py-2 text-xs text-white hover:bg-white/20"
                  onClick={() => navigator.clipboard?.writeText(item.url)}
                >
                  Copy
                </button>
                <button
                  className="rounded bg-white/10 px-3 py-2 text-xs text-white hover:bg-white/20"
                  onClick={() => deleteProofItem(item.id)}
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              <input
                className={inputBase}
                value={item.title}
                onChange={(e) => saveProofItem({ ...item, title: e.target.value })}
              />
              <input
                className={inputBase}
                value={item.url}
                onChange={(e) => saveProofItem({ ...item, url: e.target.value })}
              />
              <input
                className={inputBase}
                value={item.tag || ""}
                onChange={(e) => saveProofItem({ ...item, tag: e.target.value })}
              />
              <label className="flex items-center gap-2 text-sm text-white/80">
                <input
                  type="checkbox"
                  checked={item.pinned}
                  onChange={(e) => saveProofItem({ ...item, pinned: e.target.checked })}
                />
                Pinned
              </label>
            </div>
          </div>
        ))}
        {!proofVault.length && <p className="text-sm text-white/60">No assets yet.</p>}
      </div>
    </div>
  );

  const renderEvidenceMobility = () => (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-white/15 bg-white/5 p-4">
        <h3 className={sectionTitle}>Evidence Log</h3>
        <EvidenceForm onSave={saveEvidenceItem} />
        <div className="mt-3 grid gap-3">
          {evidenceLog.map((item) => (
            <EvidenceCard key={item.id} item={item} onSave={saveEvidenceItem} onDelete={deleteEvidenceItem} />
          ))}
          {!evidenceLog.length && <p className="text-sm text-white/60">No evidence logged yet.</p>}
        </div>
      </div>
      <div className="rounded-xl border border-white/15 bg-white/5 p-4">
        <h3 className={sectionTitle}>Mobility Routes</h3>
        <MobilityForm onSave={saveMobilityRoute} />
        <div className="mt-3 grid gap-3">
          {mobilityRoutes.map((route) => (
            <MobilityCard key={route.id} route={route} onSave={saveMobilityRoute} onDelete={deleteMobilityRoute} />
          ))}
          {!mobilityRoutes.length && <p className="text-sm text-white/60">No routes yet.</p>}
        </div>
      </div>
    </div>
  );
  const renderTabContent = () => {
    if (activeTab === "thisWeek") {
      const categories = Array.from(new Set(templates.filter((t) => t.active).map((t) => t.category)));
      return (
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/60">Week</p>
              <p className="text-lg font-semibold text-white">{formatWeekLabel(activeWeekStart)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="rounded bg-white/10 px-3 py-2 text-white hover:bg-white/20"
                onClick={() => setActiveWeekStart((week) => shiftWeek(week, -1))}
              >
                Prev
              </button>
              <input
                type="date"
                className={inputBase}
                value={activeWeekStart}
                onChange={(e) =>
                  setActiveWeekStart(startOfWeekMondayChicago(new Date(`${e.target.value}T00:00:00`)))
                }
              />
              <button
                className="rounded bg-white/10 px-3 py-2 text-white hover:bg-white/20"
                onClick={() => setActiveWeekStart((week) => shiftWeek(week, 1))}
              >
                Next
              </button>
            </div>
            <div className="flex items-center gap-2">
              <GlassButton className="px-3 py-2" onClick={() => setIsSnapshotModalOpen(true)}>
                Close Week
              </GlassButton>
              <GlassButton className="px-3 py-2" onClick={() => setManageTemplatesOpen((v) => !v)}>
                Manage Templates
              </GlassButton>
            </div>
          </div>
          {snapshots[activeWeekStart] && (
            <GlassCard className="p-4">
              <h3 className={sectionTitle}>Snapshot saved</h3>
              <p className="text-sm text-white/70">{snapshots[activeWeekStart]?.next_week_focus}</p>
            </GlassCard>
          )}
          <div className="grid gap-4">
            {templatesLoading ? (
              <p className="text-sm text-white/60">Loading templates...</p>
            ) : categories.length ? (
              categories.map((category) => (
                <GlassCard key={category} className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className={sectionTitle}>{category}</h3>
                  </div>
                  <div className="grid gap-3">
                    {templates
                      .filter((t) => t.category === category && t.active)
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((template) => renderTaskRow(template))}
                  </div>
                </GlassCard>
              ))
            ) : (
              <p className="text-sm text-white/60">No templates yet. Add one to get started.</p>
            )}
          </div>
          {manageTemplatesOpen && renderTemplateManager()}
        </div>
      );
    }
    if (activeTab === "pipelines") {
      return (
        <div className="grid gap-4">
          {renderPipelineSection("paid_work", "Paid Work")}
          {renderPipelineSection("relationship", "Relationships")}
          {renderPipelineSection("traction", "Traction")}
        </div>
      );
    }
    if (activeTab === "proofVault") {
      return renderProofVault();
    }
    return renderEvidenceMobility();
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
      <div className="mx-auto max-w-6xl space-y-6">
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
          {([
            { key: "thisWeek", label: "This Week" },
            { key: "pipelines", label: "Pipelines" },
            { key: "proofVault", label: "Proof Vault" },
            { key: "evidence", label: "Evidence & Mobility" },
          ] as { key: TabKey; label: string }[]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
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
                placeholder="Paid work progress"
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
const EvidenceForm: React.FC<{ onSave: (item: Partial<EvidenceLogItem>) => void }> = ({ onSave }) => {
  const [draft, setDraft] = useState<Partial<EvidenceLogItem>>({
    date: "",
    type: "",
    link: "",
    note: "",
  });

  return (
    <div className="mt-2 grid gap-2">
      <div className="grid gap-2 md:grid-cols-2">
        <input
          className={inputBase}
          type="date"
          value={draft.date || ""}
          onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
        />
        <input
          className={inputBase}
          placeholder="Type (demo, testimonial, OSS, event)"
          value={draft.type || ""}
          onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value }))}
        />
        <input
          className={inputBase}
          placeholder="Link"
          value={draft.link || ""}
          onChange={(e) => setDraft((d) => ({ ...d, link: e.target.value }))}
        />
        <input
          className={inputBase}
          placeholder="Note"
          value={draft.note || ""}
          onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
        />
      </div>
      <GlassButton
        className="px-4 py-2"
        onClick={() => {
          onSave(draft);
          setDraft({ date: "", type: "", link: "", note: "" });
        }}
      >
        Add
      </GlassButton>
    </div>
  );
};

const EvidenceCard: React.FC<{
  item: EvidenceLogItem;
  onSave: (item: Partial<EvidenceLogItem>) => void;
  onDelete: (id: string) => void;
}> = ({ item, onSave, onDelete }) => (
  <div className="rounded border border-white/10 bg-white/5 p-3">
    <div className="flex items-center justify-between">
      <p className="text-white font-medium">{item.type}</p>
      <button className="rounded bg-white/10 px-3 py-2 text-xs text-white hover:bg-white/20" onClick={() => onDelete(item.id)}>
        Delete
      </button>
    </div>
    <div className="mt-2 grid gap-2 md:grid-cols-2">
      <input
        className={inputBase}
        type="date"
        value={item.date}
        onChange={(e) => onSave({ ...item, date: e.target.value })}
      />
      <input className={inputBase} value={item.type} onChange={(e) => onSave({ ...item, type: e.target.value })} />
      <input className={inputBase} value={item.link} onChange={(e) => onSave({ ...item, link: e.target.value })} />
      <input className={inputBase} value={item.note || ""} onChange={(e) => onSave({ ...item, note: e.target.value })} />
    </div>
  </div>
);

const MobilityForm: React.FC<{ onSave: (route: Partial<MobilityRoute>) => void }> = ({ onSave }) => {
  const [draft, setDraft] = useState<Partial<MobilityRoute>>({
    route_name: "",
    is_primary: false,
    status: "",
    next_missing_item: "",
    next_action_date: "",
    notes: "",
  });

  return (
    <div className="mt-2 grid gap-2">
      <div className="grid gap-2 md:grid-cols-2">
        <input
          className={inputBase}
          placeholder="Route name"
          value={draft.route_name || ""}
          onChange={(e) => setDraft((d) => ({ ...d, route_name: e.target.value }))}
        />
        <label className="flex items-center gap-2 text-white/80">
          <input
            type="checkbox"
            checked={!!draft.is_primary}
            onChange={(e) => setDraft((d) => ({ ...d, is_primary: e.target.checked }))}
          />
          Primary
        </label>
        <input
          className={inputBase}
          placeholder="Status"
          value={draft.status || ""}
          onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
        />
        <input
          className={inputBase}
          placeholder="Next missing item"
          value={draft.next_missing_item || ""}
          onChange={(e) => setDraft((d) => ({ ...d, next_missing_item: e.target.value }))}
        />
        <input
          className={inputBase}
          type="date"
          value={draft.next_action_date || ""}
          onChange={(e) => setDraft((d) => ({ ...d, next_action_date: e.target.value }))}
        />
        <input
          className={inputBase}
          placeholder="Notes"
          value={draft.notes || ""}
          onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
        />
      </div>
      <GlassButton
        className="px-4 py-2"
        onClick={() => {
          onSave(draft);
          setDraft({ route_name: "", is_primary: false, status: "", next_missing_item: "", next_action_date: "", notes: "" });
        }}
      >
        Add
      </GlassButton>
    </div>
  );
};

const MobilityCard: React.FC<{
  route: MobilityRoute;
  onSave: (route: Partial<MobilityRoute>) => void;
  onDelete: (id: string) => void;
}> = ({ route, onSave, onDelete }) => (
  <div className="rounded border border-white/10 bg-white/5 p-3">
    <div className="flex items-center justify-between">
      <p className="text-white font-medium">{route.route_name}</p>
      <button className="rounded bg-white/10 px-3 py-2 text-xs text-white hover:bg-white/20" onClick={() => onDelete(route.id)}>
        Delete
      </button>
    </div>
    <div className="mt-2 grid gap-2 md:grid-cols-2">
      <label className="flex items-center gap-2 text-white/80">
        <input
          type="checkbox"
          checked={route.is_primary}
          onChange={(e) => onSave({ ...route, is_primary: e.target.checked })}
        />
        Primary
      </label>
      <input
        className={inputBase}
        value={route.status}
        onChange={(e) => onSave({ ...route, status: e.target.value })}
        placeholder="Status"
      />
      <input
        className={inputBase}
        value={route.next_missing_item || ""}
        onChange={(e) => onSave({ ...route, next_missing_item: e.target.value })}
        placeholder="Next missing item"
      />
      <input
        className={inputBase}
        type="date"
        value={route.next_action_date || ""}
        onChange={(e) => onSave({ ...route, next_action_date: e.target.value })}
      />
      <input
        className={inputBase}
        value={route.notes || ""}
        onChange={(e) => onSave({ ...route, notes: e.target.value })}
        placeholder="Notes"
      />
    </div>
  </div>
);

export default Tracker;
