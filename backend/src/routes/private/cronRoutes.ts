import { Router } from "express";
import { cronAuth } from "../../middleware/cronAuth";

const router = Router();

router.use(cronAuth);
router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

export default router;
