import { Router } from "express";
import { requireUser } from "../../../middleware/requireUser";
import { getSupabaseAdmin } from "../../calendar/services/calendarSyncQueueService";
import { deleteTaskListForUser } from "../services/taskListService";

const router = Router();

router.delete("/:listId", requireUser, async (req, res) => {
  const listId = typeof req.params.listId === "string" ? req.params.listId.trim() : "";
  if (!listId) return res.status(400).json({ error: "list_id is required" });

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const result = await deleteTaskListForUser(supabaseAdmin, req.user!.id, listId);
    if (!result.ok) {
      return res.status(result.code).json({ error: result.error });
    }
    return res.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete task list", error);
    const message = error instanceof Error ? error.message : "Failed to delete task list";
    return res.status(500).json({ error: message });
  }
});

export default router;
