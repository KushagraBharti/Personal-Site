import { Router } from "express";
import { requireUser } from "../../../middleware/requireUser";
import { getSupabaseAdmin } from "../../calendar/services/calendarSyncQueueService";
import {
  createTaskListForUser,
  deleteTaskListForUser,
  reorderTaskListsForUser,
  updateTaskListForUser,
} from "../services/taskListService";

const router = Router();

router.post("/", requireUser, async (req, res) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const result = await createTaskListForUser(supabaseAdmin, req.user!.id, req.body ?? {});
    if (!result.ok) {
      return res.status(result.code).json({ error: result.error });
    }
    return res.status(201).json({ ok: true, list: result.list });
  } catch (error) {
    console.error("Failed to create task list", error);
    const message = error instanceof Error ? error.message : "Failed to create task list";
    return res.status(500).json({ error: message });
  }
});

router.patch("/reorder", requireUser, async (req, res) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const result = await reorderTaskListsForUser(
      supabaseAdmin,
      req.user!.id,
      req.body?.ordered_list_ids
    );
    if (!result.ok) {
      return res.status(result.code).json({ error: result.error });
    }
    return res.json({ ok: true, lists: result.lists });
  } catch (error) {
    console.error("Failed to reorder task lists", error);
    const message = error instanceof Error ? error.message : "Failed to reorder task lists";
    return res.status(500).json({ error: message });
  }
});

router.patch("/:listId", requireUser, async (req, res) => {
  const listId = typeof req.params.listId === "string" ? req.params.listId.trim() : "";
  if (!listId) return res.status(400).json({ error: "list_id is required" });

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const result = await updateTaskListForUser(
      supabaseAdmin,
      req.user!.id,
      listId,
      req.body ?? {}
    );
    if (!result.ok) {
      return res.status(result.code).json({ error: result.error });
    }
    return res.json({ ok: true, list: result.list });
  } catch (error) {
    console.error("Failed to update task list", error);
    const message = error instanceof Error ? error.message : "Failed to update task list";
    return res.status(500).json({ error: message });
  }
});

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
