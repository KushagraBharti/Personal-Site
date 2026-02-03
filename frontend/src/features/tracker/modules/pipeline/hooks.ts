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
      if (error) {
        console.error("Failed to fetch pipeline items", error);
        setErrorMessage(error.message || String(error));
        return;
      }
      setErrorMessage("");
      if (data) setPipelineItems(data);
    } finally {
      stopLoading();
    }
  }, [supabase, userId, startLoading, stopLoading]);

  useEffect(() => {
    if (!userId) return;
    refreshPipelines();
  }, [userId, refreshPipelines]);

  const handleSavePipelineItem = async (
    item: Partial<PipelineItem> & { type: PipelineType }
  ): Promise<boolean> => {
    if (!item.name || !item.type) return false;
    try {
      const result = await savePipelineItem(supabase, userId, item);
      if (result.error) {
        console.error("Failed to save pipeline item", result.error);
        setErrorMessage(result.error.message || "Failed to save pipeline item.");
        return false;
      }
      setErrorMessage("");
      await refreshPipelines();
      return true;
    } catch (error) {
      console.error("Failed to save pipeline item", error);
      setErrorMessage("Failed to save pipeline item. Please try again.");
      return false;
    }
  };

  const handleDeletePipelineItem = async (id: string): Promise<boolean> => {
    try {
      const result = await deletePipelineItem(supabase, userId, id);
      if (result.error) {
        console.error("Failed to delete pipeline item", result.error);
        setErrorMessage(result.error.message || "Failed to delete pipeline item.");
        return false;
      }
      setErrorMessage("");
      await refreshPipelines();
      return true;
    } catch (error) {
      console.error("Failed to delete pipeline item", error);
      setErrorMessage("Failed to delete pipeline item. Please try again.");
      return false;
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
    setPipelineItems,
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
