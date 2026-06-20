"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertSortPreferenceForUser = void 0;
const taskHubUtils_1 = require("./taskHubUtils");
const upsertSortPreferenceForUser = (supabaseAdmin, userId, listId, input) => __awaiter(void 0, void 0, void 0, function* () {
    const sortMode = (0, taskHubUtils_1.normalizeSortMode)(input.sort_mode);
    if (!sortMode)
        return { ok: false, code: 400, error: "Invalid sort_mode" };
    const sortDirection = (0, taskHubUtils_1.normalizeSortDirection)(input.sort_direction);
    if (!sortDirection)
        return { ok: false, code: 400, error: "Invalid sort_direction" };
    const { data: list, error: listError } = yield supabaseAdmin
        .from("tracker_task_lists")
        .select("id")
        .eq("user_id", userId)
        .eq("id", listId)
        .eq("archived", false)
        .maybeSingle();
    if (listError)
        throw new Error(listError.message);
    if (!list)
        return { ok: false, code: 404, error: "List not found" };
    const { data, error } = yield supabaseAdmin
        .from("tracker_task_sort_preferences")
        .upsert({
        user_id: userId,
        list_id: listId,
        sort_mode: sortMode,
        sort_direction: sortDirection,
    }, { onConflict: "user_id,list_id" })
        .select("*")
        .single();
    if (error)
        throw new Error(error.message);
    return { ok: true, sort_preference: data };
});
exports.upsertSortPreferenceForUser = upsertSortPreferenceForUser;
