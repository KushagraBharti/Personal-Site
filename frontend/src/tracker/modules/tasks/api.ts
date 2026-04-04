import { SupabaseClient } from "@supabase/supabase-js";
import { TaskTemplate, WeeklySnapshot } from "../../shared/types";
import { TaskStatusUpsert } from "./types";

export const fetchTemplates = async (client: SupabaseClient, userId: string) => {
  const { data, error } = await client
    .from("weekly_task_templates")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true })
    .order("category", { ascending: true });
  return { data: data ?? [], error };
};

export const fetchWeekStatuses = async (client: SupabaseClient, userId: string, weekStart: string) => {
  const { data, error } = await client
    .from("weekly_task_status")
    .select("*")
    .eq("user_id", userId)
    .eq("week_start", weekStart);
  return { data: data ?? [], error };
};

export const fetchSnapshot = async (client: SupabaseClient, userId: string, weekStart: string) => {
  const { data, error } = await client
    .from("weekly_snapshots")
    .select("*")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .maybeSingle();
  return { data: data ?? null, error };
};

export const upsertStatus = async (client: SupabaseClient, payload: TaskStatusUpsert) => {
  const { data, error } = await client
    .from("weekly_task_status")
    .upsert(payload, { onConflict: "user_id,week_start,task_id" })
    .select()
    .single();
  return { data, error };
};

export const createTemplate = async (client: SupabaseClient, payload: Omit<TaskTemplate, "id">) =>
  client.from("weekly_task_templates").insert(payload);

export const updateTemplate = async (
  client: SupabaseClient,
  userId: string,
  templateId: string,
  updates: Partial<TaskTemplate>
) =>
  client
    .from("weekly_task_templates")
    .update({ ...updates })
    .eq("user_id", userId)
    .eq("id", templateId);

export const deleteTemplate = async (client: SupabaseClient, userId: string, templateId: string) =>
  client.from("weekly_task_templates").delete().eq("user_id", userId).eq("id", templateId);

export const upsertTemplatesOrder = async (client: SupabaseClient, updates: TaskTemplate[]) =>
  client.from("weekly_task_templates").upsert(updates, { onConflict: "id", ignoreDuplicates: false });

export const upsertSnapshot = async (client: SupabaseClient, payload: WeeklySnapshot & { user_id: string }) => {
  const { data, error } = await client
    .from("weekly_snapshots")
    .upsert(payload, { onConflict: "user_id,week_start" })
    .select()
    .single();
  return { data, error };
};
