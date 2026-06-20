import { SupabaseClient } from "@supabase/supabase-js";
import {
  ServiceResult,
  TrackerTaskSortPreferenceRow,
} from "./taskHubTypes";
import { normalizeSortDirection, normalizeSortMode } from "./taskHubUtils";

export const upsertSortPreferenceForUser = async (
  supabaseAdmin: SupabaseClient,
  userId: string,
  listId: string,
  input: {
    sort_mode?: unknown;
    sort_direction?: unknown;
  }
): Promise<ServiceResult<{ sort_preference: TrackerTaskSortPreferenceRow }>> => {
  const sortMode = normalizeSortMode(input.sort_mode);
  if (!sortMode) return { ok: false, code: 400, error: "Invalid sort_mode" };

  const sortDirection = normalizeSortDirection(input.sort_direction);
  if (!sortDirection) return { ok: false, code: 400, error: "Invalid sort_direction" };

  const { data: list, error: listError } = await supabaseAdmin
    .from("tracker_task_lists")
    .select("id")
    .eq("user_id", userId)
    .eq("id", listId)
    .eq("archived", false)
    .maybeSingle();
  if (listError) throw new Error(listError.message);
  if (!list) return { ok: false, code: 404, error: "List not found" };

  const { data, error } = await supabaseAdmin
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
  if (error) throw new Error(error.message);

  return { ok: true, sort_preference: data as TrackerTaskSortPreferenceRow };
};
