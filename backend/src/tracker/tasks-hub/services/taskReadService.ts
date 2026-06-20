import { SupabaseClient } from "@supabase/supabase-js";
import { TrackerTaskRow } from "../../../types/googleCalendar";
import { isDateOnlyIso } from "../../calendar/services/taskCalendarEventUtils";
import {
  TrackerTaskListRow,
  TrackerTaskSortPreferenceRow,
} from "./taskHubTypes";
import {
  DEFAULT_LIST_NAME,
  normalizeBrowserTimeZone,
  pickAutoListColor,
} from "./taskHubUtils";

export const fetchTaskListsForUser = async (
  supabaseAdmin: SupabaseClient,
  userId: string
) => {
  const { data, error } = await supabaseAdmin
    .from("tracker_task_lists")
    .select("*")
    .eq("user_id", userId)
    .eq("archived", false)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as TrackerTaskListRow[];
};

export const fetchTasksForUser = async (
  supabaseAdmin: SupabaseClient,
  userId: string
) => {
  const { data, error } = await supabaseAdmin
    .from("tracker_tasks")
    .select("*")
    .eq("user_id", userId)
    .order("list_id", { ascending: true })
    .order("parent_task_id", { ascending: true, nullsFirst: true })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as TrackerTaskRow[];
};

export const fetchSortPreferencesForUser = async (
  supabaseAdmin: SupabaseClient,
  userId: string
) => {
  const { data, error } = await supabaseAdmin
    .from("tracker_task_sort_preferences")
    .select("*")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return (data ?? []) as TrackerTaskSortPreferenceRow[];
};

const seedDefaultTaskListForUser = async (
  supabaseAdmin: SupabaseClient,
  userId: string
) => {
  const { data, error } = await supabaseAdmin
    .from("tracker_task_lists")
    .insert({
      user_id: userId,
      name: DEFAULT_LIST_NAME,
      color_hex: pickAutoListColor([]),
      sort_order: 1,
      archived: false,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as TrackerTaskListRow;
};

const normalizeStoredTaskTimeZones = async (
  supabaseAdmin: SupabaseClient,
  userId: string,
  tasks: TrackerTaskRow[],
  browserTimeZone: string
) => {
  const missingTimedTimeZone = tasks.filter(
    (task) => !!task.due_at && !task.due_timezone && !isDateOnlyIso(task.due_at)
  );
  const dateOnlyWithTimeZone = tasks.filter(
    (task) => !!task.due_at && !!task.due_timezone && isDateOnlyIso(task.due_at)
  );

  const updates: Array<Promise<unknown>> = [];
  missingTimedTimeZone.forEach((task) => {
    updates.push(
      (async () => {
        const { error } = await supabaseAdmin
          .from("tracker_tasks")
          .update({ due_timezone: browserTimeZone })
          .eq("user_id", userId)
          .eq("id", task.id);
        if (error) throw new Error(error.message);
      })()
    );
  });
  dateOnlyWithTimeZone.forEach((task) => {
    updates.push(
      (async () => {
        const { error } = await supabaseAdmin
          .from("tracker_tasks")
          .update({ due_timezone: null })
          .eq("user_id", userId)
          .eq("id", task.id);
        if (error) throw new Error(error.message);
      })()
    );
  });

  await Promise.all(updates);

  return updates.length > 0;
};

export const getTrackerBootstrapForUser = async (
  supabaseAdmin: SupabaseClient,
  userId: string,
  input?: { browserTimeZone?: unknown }
) => {
  const browserTimeZone = normalizeBrowserTimeZone(input?.browserTimeZone);

  let lists = await fetchTaskListsForUser(supabaseAdmin, userId);
  if (lists.length === 0) {
    lists = [await seedDefaultTaskListForUser(supabaseAdmin, userId)];
  }

  let tasks = await fetchTasksForUser(supabaseAdmin, userId);
  const changedTimeZones = await normalizeStoredTaskTimeZones(
    supabaseAdmin,
    userId,
    tasks,
    browserTimeZone
  );
  if (changedTimeZones) {
    tasks = await fetchTasksForUser(supabaseAdmin, userId);
  }

  const sortPreferences = await fetchSortPreferencesForUser(supabaseAdmin, userId);

  return {
    lists,
    tasks,
    sort_preferences: sortPreferences,
  };
};
