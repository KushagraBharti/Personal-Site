// backend/src/controllers/introController.ts
import { Request, Response, RequestHandler } from "express";
import axios from "axios";
import { introStaticData } from "../data/intro";
import { GITHUB_USERNAME } from "../config/github";
import { fetchGitHubStats } from "../services/githubStatsService";

interface IntroResponse {
  personalPhoto: string;
  githubStats: { totalRepos: number; totalCommits: number } | null;
  leetCodeStats: { totalSolved: number; rank: string } | null;
  weather: { city: string; temp: number; description: string } | null;
  latestUpdate: string;
  funFact: string;
  featuredBlog: { title: string; link: string };
  aiProjects: string[];
  travelPlans: string;
}

export const getIntroData: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const responseData: IntroResponse = {
      personalPhoto: introStaticData.personalPhoto,
      latestUpdate: introStaticData.latestUpdate,
      funFact: introStaticData.funFact,
      featuredBlog: introStaticData.featuredBlog,
      aiProjects: introStaticData.aiProjects,
      travelPlans: introStaticData.travelPlans,
      githubStats: null,
      leetCodeStats: null,
      weather: null,
    };

    // Fetch live GitHub stats (shared cached service)
    if (GITHUB_USERNAME) {
      const githubStats = await fetchGitHubStats(req.query.force === "true");
      responseData.githubStats = { totalRepos: githubStats.totalRepos, totalCommits: githubStats.totalCommits };
    }

    // Fetch LeetCode stats (using mock data)
    responseData.leetCodeStats = {
      totalSolved: 350,
      rank: "Top 10%",
    };

    // Fetch weather data if an API key is provided
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (apiKey) {
      const weatherRes = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=Austin&units=imperial&appid=${apiKey}`
      );
      responseData.weather = {
        city: weatherRes.data.name,
        temp: weatherRes.data.main.temp,
        description: weatherRes.data.weather[0].description,
      };
    } else {
      console.warn("No OPENWEATHER_API_KEY provided");
    }

    const ttlSeconds = Math.floor(Number(process.env.GITHUB_STATS_TTL_MS || 600000) / 1000);
    res.set("Cache-Control", `public, max-age=${ttlSeconds}`);
    res.json(responseData);
  } catch (error) {
    console.error("Error in getIntroData:", error);
    res.status(500).json({ error: "Failed to retrieve intro data" });
  }
};
