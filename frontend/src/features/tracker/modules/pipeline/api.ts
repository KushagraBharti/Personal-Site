import { SupabaseClient } from "@supabase/supabase-js";
import { PipelineItem, PipelineType } from "../../shared/types";

export const fetchPipelineItems = async (client: SupabaseClient, userId: string) => {
  const { data, error } = await client
    .from("pipeline_items")
    .select("*")
    .eq("user_id", userId)
    .order("next_action_date", { ascending: true })
    .order("created_at", { ascending: true });
  return { data: data ?? [], error };
};

export const savePipelineItem = async (
  client: SupabaseClient,
  userId: string,
  item: Partial<PipelineItem> & { type: PipelineType }
) => {
  const payload: any = {
    ...item,
    user_id: userId,
    links: Array.isArray(item.links) ? item.links : [],
    archived: item.archived ?? false,
  };

  if (item.id) {
    return client.from("pipeline_items").update(payload).eq("user_id", userId).eq("id", item.id);
  }

  return client.from("pipeline_items").insert(payload);
};

export const deletePipelineItem = async (client: SupabaseClient, userId: string, id: string) =>
  client.from("pipeline_items").delete().eq("user_id", userId).eq("id", id);
