import { Router } from "express";
import { requireUser } from "../../../middleware/requireUser";
import { getSupabaseAdmin } from "../../calendar/services/calendarSyncQueueService";
import { deleteTaskForUser, setTaskCompletionForUser } from "../services/taskListService";

const router = Router();

router.patch("/:taskId/completion", requireUser, async (req, res) => {
  const taskId = typeof req.params.taskId === "string" ? req.params.taskId.trim() : "";
  if (!taskId) return res.status(400).json({ error: "task_id is required" });

  if (typeof req.body?.is_completed !== "boolean") {
    return res.status(400).json({ error: "is_completed boolean is required" });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const result = await setTaskCompletionForUser(
      supabaseAdmin,
      req.user!.id,
      taskId,
      req.body.is_completed
    );
    if (!result.ok) {
      return res.status(result.code).json({ error: result.error });
    }
    return res.json({
      ok: true,
      task: result.task,
      created_next_task: result.createdNextTask,
    });
  } catch (error) {
    console.error("Failed to update task completion", error);
    const message = error instanceof Error ? error.message : "Failed to update task completion";
    return res.status(500).json({ error: message });
  }
});

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
