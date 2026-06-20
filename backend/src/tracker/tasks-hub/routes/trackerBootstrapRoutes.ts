import { Router } from "express";
import { requireUser } from "../../../middleware/requireUser";
import { getSupabaseAdmin } from "../../calendar/services/calendarSyncQueueService";
import { getTrackerBootstrapForUser } from "../services/taskListService";

const router = Router();

router.post("/bootstrap", requireUser, async (req, res) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const bootstrap = await getTrackerBootstrapForUser(supabaseAdmin, req.user!.id, {
      browserTimeZone: req.body?.browser_timezone,
    });
    return res.json({ ok: true, ...bootstrap });
  } catch (error) {
    console.error("Failed to load tracker bootstrap", error);
    const message = error instanceof Error ? error.message : "Failed to load tracker bootstrap";
    return res.status(500).json({ error: message });
  }
});

export default router;
