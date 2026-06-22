import { Router } from "express";
import { requireUser } from "../../../middleware/requireUser";
import { getSupabaseAdmin } from "../../calendar/services/calendarSyncQueueService";
import { queueTaskUpsertForUser } from "../../calendar/services/taskCalendarSyncService";
import {
  createTaskForUser,
  deleteTaskForUser,
  reorderTasksForUser,
  setTaskCompletionForUser,
  updateTaskForUser,
} from "../services/taskListService";

const router = Router();

const queueTaskUpsertBestEffort = async (
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  task: { id: string; list_id: string; updated_at: string },
  source: string,
) => {
  try {
    await queueTaskUpsertForUser(supabaseAdmin, userId, task, source);
    return null;
  } catch (error) {
    console.error("Failed to enqueue live calendar task sync", error);
    return "Task saved, but calendar sync could not be queued.";
  }
};

const taskResponse = <T extends object>(
  payload: T,
  calendarSyncWarning?: string | null,
) => {
  if (!calendarSyncWarning) return payload;
  return { ...payload, calendar_sync_warning: calendarSyncWarning };
};

router.post("/", requireUser, async (req, res) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const result = await createTaskForUser(
      supabaseAdmin,
      req.user!.id,
      req.body ?? {},
    );
    if (!result.ok) {
      return res.status(result.code).json({ error: result.error });
    }
    const calendarSyncWarning = await queueTaskUpsertBestEffort(
      supabaseAdmin,
      req.user!.id,
      result.task,
      "api_task_create",
    );
    return res
      .status(201)
      .json(taskResponse({ ok: true, task: result.task }, calendarSyncWarning));
  } catch (error) {
    console.error("Failed to create task", error);
    const message =
      error instanceof Error ? error.message : "Failed to create task";
    return res.status(500).json({ error: message });
  }
});

router.patch("/reorder", requireUser, async (req, res) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const result = await reorderTasksForUser(
      supabaseAdmin,
      req.user!.id,
      req.body ?? {},
    );
    if (!result.ok) {
      return res.status(result.code).json({ error: result.error });
    }
    return res.json({ ok: true, tasks: result.tasks });
  } catch (error) {
    console.error("Failed to reorder tasks", error);
    const message =
      error instanceof Error ? error.message : "Failed to reorder tasks";
    return res.status(500).json({ error: message });
  }
});

router.patch("/:taskId/completion", requireUser, async (req, res) => {
  const taskId =
    typeof req.params.taskId === "string" ? req.params.taskId.trim() : "";
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
      req.body.is_completed,
    );
    if (!result.ok) {
      return res.status(result.code).json({ error: result.error });
    }
    let calendarSyncWarning = await queueTaskUpsertBestEffort(
      supabaseAdmin,
      req.user!.id,
      result.task,
      "api_task_completion",
    );
    if (result.createdNextTask) {
      const nextTaskWarning = await queueTaskUpsertBestEffort(
        supabaseAdmin,
        req.user!.id,
        result.createdNextTask,
        "api_task_completion_next",
      );
      if (nextTaskWarning) calendarSyncWarning = nextTaskWarning;
    }
    return res.json(
      taskResponse(
        {
          ok: true,
          task: result.task,
          created_next_task: result.createdNextTask,
        },
        calendarSyncWarning,
      ),
    );
  } catch (error) {
    console.error("Failed to update task completion", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update task completion";
    return res.status(500).json({ error: message });
  }
});

router.patch("/:taskId", requireUser, async (req, res) => {
  const taskId =
    typeof req.params.taskId === "string" ? req.params.taskId.trim() : "";
  if (!taskId) return res.status(400).json({ error: "task_id is required" });

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const result = await updateTaskForUser(
      supabaseAdmin,
      req.user!.id,
      taskId,
      req.body ?? {},
    );
    if (!result.ok) {
      return res.status(result.code).json({ error: result.error });
    }
    const calendarSyncWarning = await queueTaskUpsertBestEffort(
      supabaseAdmin,
      req.user!.id,
      result.task,
      "api_task_update",
    );
    return res.json(
      taskResponse({ ok: true, task: result.task }, calendarSyncWarning),
    );
  } catch (error) {
    console.error("Failed to update task", error);
    const message =
      error instanceof Error ? error.message : "Failed to update task";
    return res.status(500).json({ error: message });
  }
});

router.delete("/:taskId", requireUser, async (req, res) => {
  const taskId =
    typeof req.params.taskId === "string" ? req.params.taskId.trim() : "";
  if (!taskId) return res.status(400).json({ error: "task_id is required" });

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const result = await deleteTaskForUser(supabaseAdmin, req.user!.id, taskId);
    if (!result.ok) {
      return res.status(result.code).json({ error: result.error });
    }
    return res.json(
      taskResponse({ ok: true }, result.calendarSyncWarning ?? null),
    );
  } catch (error) {
    console.error("Failed to delete task", error);
    const message =
      error instanceof Error ? error.message : "Failed to delete task";
    return res.status(500).json({ error: message });
  }
});

export default router;
