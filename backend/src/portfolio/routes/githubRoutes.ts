import { Router } from "express";
import { getGitHubStats } from "../controllers/liveWidgetsController";

const router = Router();

router.get("/stats", getGitHubStats);

export default router;
