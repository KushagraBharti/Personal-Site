import { Router } from "express";
import { cronAuth } from "../../middleware/cronAuth";
import { syncAllFinance } from "../../services/private/financeSyncService";
import { processCalendarSyncJobs, renewExpiringCalendarWatches } from "../../services/private/taskCalendarSyncService";
import { Request, Response } from "express";

const router = Router();
const isCalendarSyncEnabled = () => process.env.CALENDAR_SYNC_ENABLED !== "0";

router.use(cronAuth);
router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const runCalendarSync = async (req: Request, res: Response) => {
  if (!isCalendarSyncEnabled()) return res.json({ ok: true, disabled: true });
  try {
    const results = await processCalendarSyncJobs({ batchSize: 100 });
    return res.json({
      ok: true,
      processed: results.length,
      failed: results.filter((item) => !item.ok).length,
      results,
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

router.post("/finance-sync", async (req, res) => {
  try {
    const results = await syncAllFinance();
    return res.json({ ok: true, results });
  } catch (error) {
    console.error("Failed to run finance sync", error);
    return res.status(500).json({ error: "Failed to run finance sync" });
  }
});

router.post("/calendar-sync", runCalendarSync);
router.get("/calendar-sync", runCalendarSync);

router.post("/calendar-watch-renew", runCalendarWatchRenew);
router.get("/calendar-watch-renew", runCalendarWatchRenew);

export default router;
