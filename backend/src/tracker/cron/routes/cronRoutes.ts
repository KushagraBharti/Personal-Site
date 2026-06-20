import { Router } from "express";
import { Request, Response } from "express";
import { cronAuth } from "../../../middleware/cronAuth";
import {
  drainCalendarSyncJobs,
  renewExpiringCalendarWatches,
} from "../../calendar/services/taskCalendarSyncService";
import { getSupabaseAdmin } from "../../calendar/services/calendarSyncQueueService";
import { reconcileCompletedRecurringTasks } from "../../tasks-hub/services/taskListService";


const router = Router();
const isCalendarSyncEnabled = () => process.env.CALENDAR_SYNC_ENABLED !== "0";

router.use(cronAuth);
router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const runCalendarSync = async (req: Request, res: Response) => {
  if (!isCalendarSyncEnabled()) return res.json({ ok: true, disabled: true });
  try {
    // Keep cron execution bounded for serverless limits.
    const drain = await drainCalendarSyncJobs({
      batchSize: 10,
      maxJobs: 80,
      maxMs: 20_000,
    });
    return res.json({
      ok: true,
      processed: drain.processed,
      failed: drain.failed,
      exhausted: drain.exhausted,
      results: drain.results,
    });
  } catch (error) {
    console.error("Failed to run calendar sync", error);
    return res.status(500).json({ error: "Failed to run calendar sync" });
  }
};

const runCalendarWatchRenew = async (req: Request, res: Response) => {
  if (!isCalendarSyncEnabled()) return res.json({ ok: true, disabled: true });
  try {
    const results = await renewExpiringCalendarWatches();
    return res.json({
      ok: true,
      renewed: results.filter((item) => item.ok).length,
      failed: results.filter((item) => !item.ok).length,
      results,
    });
  } catch (error) {
    console.error("Failed to renew calendar watches", error);
    return res.status(500).json({ error: "Failed to renew calendar watches" });
  }
};

const runRecurringTaskReconcile = async (req: Request, res: Response) => {
  try {
    const result = await reconcileCompletedRecurringTasks(getSupabaseAdmin(), { limit: 25 });
    return res.json(result);
  } catch (error) {
    console.error("Failed to reconcile recurring tasks", error);
    return res.status(500).json({ error: "Failed to reconcile recurring tasks" });
  }
};

router.post("/calendar-sync", runCalendarSync);
router.get("/calendar-sync", runCalendarSync);

router.post("/calendar-watch-renew", runCalendarWatchRenew);
router.get("/calendar-watch-renew", runCalendarWatchRenew);

router.post("/recurring-tasks", runRecurringTaskReconcile);
router.get("/recurring-tasks", runRecurringTaskReconcile);

export default router;
