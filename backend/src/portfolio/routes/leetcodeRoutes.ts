import { Router } from "express";
import { getLeetCodeStats } from "../controllers/liveWidgetsController";

const router = Router();

router.get("/stats", getLeetCodeStats);

export default router;
