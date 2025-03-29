// backend/src/routes/githubRoutes.ts
import express from "express";
import { getGitHubStats } from "../controllers/githubController";

const router = express.Router();

// GET /api/github/stats
router.get("/stats", getGitHubStats);

export default router;
