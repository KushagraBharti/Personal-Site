import { Router } from "express";
import { cronAuth } from "../../middleware/cronAuth";
import { syncAllFinance } from "../../services/private/financeSyncService";

const router = Router();

router.use(cronAuth);
router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

router.post("/finance-sync", async (req, res) => {
  try {
    const results = await syncAllFinance();
    return res.json({ ok: true, results });
  } catch (error) {
    console.error("Failed to run finance sync", error);
    return res.status(500).json({ error: "Failed to run finance sync" });
  }
});

export default router;
