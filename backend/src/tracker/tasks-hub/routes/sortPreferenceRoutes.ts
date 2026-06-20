import { Router } from "express";
import { requireUser } from "../../../middleware/requireUser";
import { getSupabaseAdmin } from "../../calendar/services/calendarSyncQueueService";
import { upsertSortPreferenceForUser } from "../services/taskListService";

const router = Router();

router.put("/:listId", requireUser, async (req, res) => {
  const listId = typeof req.params.listId === "string" ? req.params.listId.trim() : "";
  if (!listId) return res.status(400).json({ error: "list_id is required" });

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const result = await upsertSortPreferenceForUser(
      supabaseAdmin,
      req.user!.id,
      listId,
      req.body ?? {}
    );
    if (!result.ok) {
      return res.status(result.code).json({ error: result.error });
    }
    return res.json({ ok: true, sort_preference: result.sort_preference });
  } catch (error) {
    console.error("Failed to save sort preference", error);
    const message = error instanceof Error ? error.message : "Failed to save sort preference";
    return res.status(500).json({ error: message });
  }
});

export default router;
