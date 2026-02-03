import { useCallback, useEffect, useState } from "react";
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
  const [errorMessage, setErrorMessage] = useState("");

  const refreshPipelines = useCallback(async () => {
    startLoading();
    try {
      const { data, error } = await fetchPipelineItems(supabase, userId);
      if (!error && data) setPipelineItems(data);
    } finally {
      stopLoading();
    }
  }, [supabase, userId, startLoading, stopLoading]);

  useEffect(() => {
    if (!userId) return;
    refreshPipelines();
  }, [userId, refreshPipelines]);

  const handleSavePipelineItem = async (item: Partial<PipelineItem> & { type: PipelineType }) => {
    if (!item.name || !item.type) return;
    try {
      await savePipelineItem(supabase, userId, item);
      setErrorMessage("");
      await refreshPipelines();
    } catch (error) {
      console.error("Failed to save pipeline item", error);
      setErrorMessage("Failed to save pipeline item. Please try again.");
      throw error;
    }
  };

  const handleDeletePipelineItem = async (id: string) => {
    try {
      await deletePipelineItem(supabase, userId, id);
      setErrorMessage("");
      setPipelineItems((prev) => prev.filter((p) => p.id !== id));
      await refreshPipelines();
    } catch (error) {
      console.error("Failed to delete pipeline item", error);
      setErrorMessage("Failed to delete pipeline item. Please try again.");
      throw error;
    }
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
    errorMessage,
  };
};
