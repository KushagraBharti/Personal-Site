import React, { useCallback, useEffect, useRef, useState } from "react";
import GlassButton from "../../../../../components/ui/GlassButton";
import GlassCard from "../../../../../components/ui/GlassCard";
import { inputBase, sectionTitle } from "../../../shared/styles";
import { PipelineItem, PipelineType } from "../../../shared/types";
import { toChicagoDate } from "../../../shared/utils/date";
import { usePipelineModule } from "../hooks";

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
          onClick={async () => {
            if (!pipelineDraft.name?.trim()) {
              setDraftError("Name is required.");
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

      {(errorMessage || draftError) && (
        <p className="text-sm text-red-300">{draftError || errorMessage}</p>
      )}

      <div className="grid gap-3">
        {visible.map((item) => {
          const edits = editsById[item.id] ?? {};
          return (
          <div key={item.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-white font-medium">{edits.name ?? item.name}</p>
                <p className="text-xs text-white/60">
                  {edits.type ?? item.type} • {edits.stage ?? (item.stage || "Stage")}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className="rounded bg-white/10 px-3 py-2 text-xs text-white hover:bg-white/20"
                  onClick={async () => {
                    const succeeded = await handleSavePipelineItem({ ...item, archived: !item.archived });
                    if (!succeeded) {
                      console.error("Failed to update archive status");
                    }
                  }}
                >
                  {item.archived ? "Unarchive" : "Archive"}
                </button>
                <button
                  className="rounded bg-white/10 px-3 py-2 text-xs text-white hover:bg-white/20"
                  onClick={async () => {
                    const succeeded = await handleDeletePipelineItem(item.id);
                    if (!succeeded) {
                      console.error("Failed to delete pipeline item");
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <select
                className={inputBase}
                value={(edits.type ?? item.type) as PipelineType}
                onChange={(e) =>
                  updateEdit(item, { type: e.target.value as PipelineType })
                }
              >
                <option value="internship">Internship</option>
                <option value="traction">Traction</option>
                <option value="relationship">Relationship</option>
              </select>
              <input
                className={inputBase}
                placeholder="Stage"
                value={edits.stage ?? item.stage ?? ""}
                onChange={(e) => updateEdit(item, { stage: e.target.value })}
              />
              <input
                className={inputBase}
                type="date"
                value={edits.next_action_date ?? item.next_action_date ?? ""}
                onChange={(e) => updateEdit(item, { next_action_date: e.target.value })}
              />
              <input
                className={inputBase}
                placeholder="Next action"
                value={edits.next_action ?? item.next_action ?? ""}
                onChange={(e) => updateEdit(item, { next_action: e.target.value })}
              />
              <textarea
                className={`${inputBase} min-h-[70px] md:col-span-2`}
                placeholder="Notes"
                value={edits.notes ?? item.notes ?? ""}
                onChange={(e) => updateEdit(item, { notes: e.target.value })}
              />
              <textarea
                className={`${inputBase} min-h-[70px] md:col-span-2`}
                placeholder="Links (one per line)"
                value={
                  Array.isArray(edits.links)
                    ? edits.links.join("\n")
                    : Array.isArray(item.links)
                    ? item.links.join("\n")
                    : ""
                }
                onChange={(e) =>
                  updateEdit(item, { links: e.target.value.split("\n").filter(Boolean) })
                }
              />
            </div>
          </div>
        );
        })}
        {!visible.length && <p className="text-sm text-white/60">Nothing here yet.</p>}
      </div>
    </div>
  );
};

export default PipelineTracker;
