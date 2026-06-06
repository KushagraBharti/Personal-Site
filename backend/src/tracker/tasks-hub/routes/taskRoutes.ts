import { Router } from "express";
import { requireUser } from "../../../middleware/requireUser";
import { getSupabaseAdmin } from "../../calendar/services/calendarSyncQueueService";
import { deleteTaskForUser } from "../services/taskListService";

const router = Router();

router.delete("/:taskId", requireUser, async (req, res) => {
  const taskId = typeof req.params.taskId === "string" ? req.params.taskId.trim() : "";
  if (!taskId) return res.status(400).json({ error: "task_id is required" });

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const result = await deleteTaskForUser(supabaseAdmin, req.user!.id, taskId);
    if (!result.ok) {
      return res.status(result.code).json({ error: result.error });
    }
    return res.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete task", error);
    const message = error instanceof Error ? error.message : "Failed to delete task";
    return res.status(500).json({ error: message });
  }
});

export default router;
