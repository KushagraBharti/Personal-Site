// backend/src/controllers/githubController.ts
import { Request, Response, RequestHandler } from "express";
import { GITHUB_USERNAME } from "../config/github";
import { fetchGitHubStats } from "../services/githubStatsService";

export const getGitHubStats: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  if (!GITHUB_USERNAME) {
    res.status(500).json({ error: "GitHub username is not configured" });
    return;
  }

  try {
    const force = req.query.force === "true";
    const stats = await fetchGitHubStats(force);
    res.set("Cache-Control", `public, max-age=${Math.floor((Number(process.env.GITHUB_STATS_TTL_MS || 600000)) / 1000)}`);
    res.json(stats);
  } catch (error) {
    console.error("Error fetching GitHub stats:", error);
    res.status(500).json({ error: "Failed to fetch GitHub stats" });
  }
};
