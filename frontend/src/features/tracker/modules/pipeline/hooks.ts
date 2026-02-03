import { useEffect, useState } from "react";
import { PipelineItem, PipelineType } from "../../shared/types";
import { toChicagoDate, toDateInputValue } from "../../shared/utils/date";
import { useTrackerContext } from "../../shared/hooks/useTrackerContext";
import { deletePipelineItem, fetchPipelineItems, savePipelineItem } from "./api";
import { PipelineDraft } from "./types";

export const usePipelineModule = () => {
  const { userId, supabase, startLoading, stopLoading } = useTrackerContext();
  const [pipelineItems, setPipelineItems] = useState<PipelineItem[]>([]);
  const [pipelineDraft, setPipelineDraft] = useState<PipelineDraft>({
    type: "internship",
    next_action_date: toDateInputValue(toChicagoDate()),
  });
  const [showPastDeals, setShowPastDeals] = useState(false);

  const refreshPipelines = async () => {
    startLoading();
    try {
      const { data, error } = await fetchPipelineItems(supabase, userId);
      if (!error && data) setPipelineItems(data);
    } finally {
      stopLoading();
    }
  };

  useEffect(() => {
    if (!userId) return;
    refreshPipelines();
  }, [userId]);

  const handleSavePipelineItem = async (item: Partial<PipelineItem> & { type: PipelineType }) => {
    if (!item.name || !item.type) return;
    await savePipelineItem(supabase, userId, item);
    refreshPipelines();
  };

  const handleDeletePipelineItem = async (id: string) => {
    await deletePipelineItem(supabase, userId, id);
    setPipelineItems((prev) => prev.filter((p) => p.id !== id));
  };

  const resetDraft = () => {
    setPipelineDraft({
      type: pipelineDraft.type || "internship",
      next_action_date: toDateInputValue(toChicagoDate()),
    });
  };

  return {
    pipelineItems,
    pipelineDraft,
    setPipelineDraft,
    showPastDeals,
    setShowPastDeals,
    handleSavePipelineItem,
    handleDeletePipelineItem,
    resetDraft,
  };
};
