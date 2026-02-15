import { SupabaseClient } from "@supabase/supabase-js";
import {
  ListUpdateInput,
  SortDirection,
  TaskList,
  TaskSortMode,
  TaskSortPreference,
  TrackerTask,
  TaskUpdateInput,
} from "./types";

interface TaskListCreateInput {
  user_id: string;
  name: string;
  color_hex: string;
  sort_order: number;
  archived: boolean;
}

interface TaskCreateInput {
  user_id: string;
  list_id: string;
  parent_task_id: string | null;
  title: string;
  details: string | null;
  due_at: string | null;
  is_completed: boolean;
  completed_at: string | null;
  recurrence_type: TrackerTask["recurrence_type"];
  recurrence_interval: number | null;
  recurrence_unit: TrackerTask["recurrence_unit"];
  recurrence_ends_at: string | null;
  sort_order: number;
}

export const fetchTaskLists = async (client: SupabaseClient, userId: string) => {
  const { data, error } = await client
    .from("tracker_task_lists")
    .select("*")
    .eq("user_id", userId)
    .eq("archived", false)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return { data: (data ?? []) as TaskList[], error };
};

export const fetchTasks = async (client: SupabaseClient, userId: string) => {
  const { data, error } = await client
    .from("tracker_tasks")
    .select("*")
    .eq("user_id", userId)
    .order("list_id", { ascending: true })
    .order("parent_task_id", { ascending: true, nullsFirst: true })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return { data: (data ?? []) as TrackerTask[], error };
};

export const fetchSortPreferences = async (client: SupabaseClient, userId: string) => {
  const { data, error } = await client
    .from("tracker_task_sort_preferences")
    .select("*")
    .eq("user_id", userId);

  return { data: (data ?? []) as TaskSortPreference[], error };
};

export const createTaskList = async (client: SupabaseClient, payload: TaskListCreateInput) => {
  const { data, error } = await client
    .from("tracker_task_lists")
    .insert(payload)
    .select("*")
    .single();

  return { data: data as TaskList | null, error };
};

export const updateTaskList = async (
  client: SupabaseClient,
  userId: string,
  listId: string,
  updates: ListUpdateInput
) => {
  const { data, error } = await client
    .from("tracker_task_lists")
    .update(updates)
    .eq("user_id", userId)
    .eq("id", listId)
    .select("*")
    .single();

  return { data: data as TaskList | null, error };
};

export const deleteTaskList = async (client: SupabaseClient, userId: string, listId: string) => {
  const { error } = await client
    .from("tracker_task_lists")
    .delete()
    .eq("user_id", userId)
    .eq("id", listId);

  return { error };
};

export const createTask = async (client: SupabaseClient, payload: TaskCreateInput) => {
  const { data, error } = await client
    .from("tracker_tasks")
    .insert(payload)
    .select("*")
    .single();

  return { data: data as TrackerTask | null, error };
};

export const updateTask = async (
  client: SupabaseClient,
  userId: string,
  taskId: string,
  updates: TaskUpdateInput
) => {
  const { data, error } = await client
    .from("tracker_tasks")
    .update(updates)
    .eq("user_id", userId)
    .eq("id", taskId)
    .select("*")
    .single();

  return { data: data as TrackerTask | null, error };
};

export const deleteTask = async (client: SupabaseClient, userId: string, taskId: string) => {
  const { error } = await client
    .from("tracker_tasks")
    .delete()
    .eq("user_id", userId)
    .eq("id", taskId);

  return { error };
};

export const upsertSortPreference = async (
  client: SupabaseClient,
  userId: string,
  listId: string,
  sortMode: TaskSortMode,
  sortDirection: SortDirection
) => {
  const { data, error } = await client
    .from("tracker_task_sort_preferences")
    .upsert(
      {
        user_id: userId,
        list_id: listId,
        sort_mode: sortMode,
        sort_direction: sortDirection,
      },
      { onConflict: "user_id,list_id" }
    )
    .select("*")
    .single();

  return { data: data as TaskSortPreference | null, error };
};
