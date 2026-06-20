import { SupabaseClient } from "@supabase/supabase-js";
import {
  ServiceResult,
  TaskListCreateInput,
  TaskListUpdateInput,
  TrackerTaskListRow,
} from "./taskHubTypes";
import {
  cleanOptionalString,
  normalizeListName,
  pickAutoListColor,
} from "./taskHubUtils";
import {
  deleteCalendarLinksForTasks,
  processBestEffortTaskDeleteCleanup,
} from "./taskCalendarCleanupService";

const fetchActiveListsForUser = async (
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

const getNextListSortOrder = (lists: TrackerTaskListRow[]) => {
  if (lists.length === 0) return 1;
  return Math.max(...lists.map((list) => Number(list.sort_order) || 0)) + 1;
};

const findDuplicateList = (
  lists: TrackerTaskListRow[],
  name: string,
  exceptListId?: string
) =>
  lists.find(
    (list) =>
      list.id !== exceptListId &&
      normalizeListName(list.name) === normalizeListName(name)
  ) ?? null;

export const createTaskListForUser = async (
  supabaseAdmin: SupabaseClient,
  userId: string,
  input: TaskListCreateInput
): Promise<ServiceResult<{ list: TrackerTaskListRow }>> => {
  const cleanedName = cleanOptionalString(input.name);
  if (!cleanedName) return { ok: false, code: 400, error: "List name is required" };

  const lists = await fetchActiveListsForUser(supabaseAdmin, userId);
  const duplicate = findDuplicateList(lists, cleanedName);
  if (duplicate) {
    return { ok: false, code: 409, error: `List "${duplicate.name}" already exists.` };
  }

  const requestedColor = cleanOptionalString(input.color_hex);
  const colorHex = requestedColor || pickAutoListColor(lists.map((list) => list.color_hex));
  const { data, error } = await supabaseAdmin
    .from("tracker_task_lists")
    .insert({
      user_id: userId,
      name: cleanedName,
      color_hex: colorHex,
      sort_order: getNextListSortOrder(lists),
      archived: false,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  return { ok: true, list: data as TrackerTaskListRow };
};

export const updateTaskListForUser = async (
  supabaseAdmin: SupabaseClient,
  userId: string,
  listId: string,
  input: TaskListUpdateInput
): Promise<ServiceResult<{ list: TrackerTaskListRow }>> => {
  const lists = await fetchActiveListsForUser(supabaseAdmin, userId);
  const existing = lists.find((list) => list.id === listId) ?? null;
  if (!existing) return { ok: false, code: 404, error: "List not found" };

  const payload: Record<string, unknown> = {};
  if (Object.prototype.hasOwnProperty.call(input, "name")) {
    const cleanedName = cleanOptionalString(input.name);
    if (!cleanedName) return { ok: false, code: 400, error: "List name is required" };
    const duplicate = findDuplicateList(lists, cleanedName, listId);
    if (duplicate) {
      return { ok: false, code: 409, error: `List "${duplicate.name}" already exists.` };
    }
    payload.name = cleanedName;
  }
  if (Object.prototype.hasOwnProperty.call(input, "color_hex")) {
    const cleanedColor = cleanOptionalString(input.color_hex);
    if (!cleanedColor) return { ok: false, code: 400, error: "color_hex is required" };
    payload.color_hex = cleanedColor;
  }

  if (Object.keys(payload).length === 0) return { ok: true, list: existing };

  const { data, error } = await supabaseAdmin
    .from("tracker_task_lists")
    .update(payload)
    .eq("user_id", userId)
    .eq("id", listId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  return { ok: true, list: data as TrackerTaskListRow };
};

export const reorderTaskListsForUser = async (
  supabaseAdmin: SupabaseClient,
  userId: string,
  orderedListIds: unknown
): Promise<ServiceResult<{ lists: TrackerTaskListRow[] }>> => {
  if (!Array.isArray(orderedListIds) || orderedListIds.some((id) => typeof id !== "string")) {
    return { ok: false, code: 400, error: "ordered_list_ids must be an array of list ids" };
  }
  if (orderedListIds.length === 0) return { ok: false, code: 400, error: "ordered_list_ids is required" };

  const lists = await fetchActiveListsForUser(supabaseAdmin, userId);
  const listById = new Map(lists.map((list) => [list.id, list]));
  const uniqueIds = new Set(orderedListIds);
  if (uniqueIds.size !== orderedListIds.length) {
    return { ok: false, code: 400, error: "ordered_list_ids must not contain duplicates" };
  }
  if (orderedListIds.some((listId) => !listById.has(listId))) {
    return { ok: false, code: 400, error: "ordered_list_ids contains an unknown list" };
  }

  const updatedLists: TrackerTaskListRow[] = [];
  for (const [index, listId] of orderedListIds.entries()) {
    const { data, error } = await supabaseAdmin
      .from("tracker_task_lists")
      .update({ sort_order: index + 1 })
      .eq("user_id", userId)
      .eq("id", listId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    updatedLists.push(data as TrackerTaskListRow);
  }

  return {
    ok: true,
    lists: updatedLists.sort((left, right) => left.sort_order - right.sort_order),
  };
};

export const deleteTaskListForUser = async (
  supabaseAdmin: SupabaseClient,
  userId: string,
  listId: string
) => {
  const activeLists = await fetchActiveListsForUser(supabaseAdmin, userId);
  const listRow = activeLists.find((list) => list.id === listId) ?? null;
  if (!listRow) return { ok: false as const, code: 404, error: "List not found" };
  if (activeLists.length <= 1) {
    return {
      ok: false as const,
      code: 400,
      error: "Create another list before deleting your last remaining list.",
    };
  }

  const { data: taskRows, error: taskRowsError } = await supabaseAdmin
    .from("tracker_tasks")
    .select("id")
    .eq("user_id", userId)
    .eq("list_id", listId);
  if (taskRowsError) throw new Error(taskRowsError.message);

  const taskIds = (taskRows ?? []).map((row: any) => String(row.id)).filter(Boolean);

  for (const taskId of taskIds) {
    await processBestEffortTaskDeleteCleanup(supabaseAdmin, {
      userId,
      listId,
      taskId,
    });
  }

  const { error: jobUpdateError } = await supabaseAdmin
    .from("tracker_google_sync_jobs")
    .update({ list_id: null })
    .eq("user_id", userId)
    .eq("list_id", listId);
  if (jobUpdateError) throw new Error(jobUpdateError.message);

  const { error: listSyncSettingsError } = await supabaseAdmin
    .from("tracker_task_list_sync_settings")
    .delete()
    .eq("user_id", userId)
    .eq("list_id", listId);
  if (listSyncSettingsError) throw new Error(listSyncSettingsError.message);

  const { error: sortPrefError } = await supabaseAdmin
    .from("tracker_task_sort_preferences")
    .delete()
    .eq("user_id", userId)
    .eq("list_id", listId);
  if (sortPrefError) throw new Error(sortPrefError.message);

  if (taskIds.length > 0) {
    const { error: clearParentRefsError } = await supabaseAdmin
      .from("tracker_tasks")
      .update({ parent_task_id: null })
      .eq("user_id", userId)
      .in("parent_task_id", taskIds);
    if (clearParentRefsError) throw new Error(clearParentRefsError.message);

    await deleteCalendarLinksForTasks(supabaseAdmin, userId, taskIds);

    const { error: taskDeleteError } = await supabaseAdmin
      .from("tracker_tasks")
      .delete()
      .eq("user_id", userId)
      .eq("list_id", listId);
    if (taskDeleteError) throw new Error(taskDeleteError.message);
  }

  const { error: listDeleteError } = await supabaseAdmin
    .from("tracker_task_lists")
    .delete()
    .eq("user_id", userId)
    .eq("id", listId);
  if (listDeleteError) throw new Error(listDeleteError.message);

  return { ok: true as const };
};
