import type { RequestHandler } from "express";
import axios from "axios";
import { GITHUB_USERNAME } from "../../config/github";
import { fetchGitHubStats } from "../services/githubStatsService";
import { fetchLeetCodeStats } from "../services/leetcodeService";
import { fetchWeather } from "../services/weatherService";

const getHeaderValue = (req: Parameters<RequestHandler>[0], name: string) => {
  const value = req.header(name);
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

const resolveWeatherQueryFromRequest = (req: Parameters<RequestHandler>[0]) => {
  const lat = typeof req.query.lat === "string" ? req.query.lat : undefined;
  const lon = typeof req.query.lon === "string" ? req.query.lon : undefined;
  const q = typeof req.query.q === "string" ? req.query.q : undefined;

  if (lat && lon) {
    return { lat, lon };
  }

  if (q) {
    return { q };
  }

  const headerLat = getHeaderValue(req, "x-vercel-ip-latitude");
  const headerLon = getHeaderValue(req, "x-vercel-ip-longitude");
  if (headerLat && headerLon) {
    return { lat: headerLat, lon: headerLon };
  }

  const city = getHeaderValue(req, "x-vercel-ip-city");
  const region = getHeaderValue(req, "x-vercel-ip-country-region");
  const country = getHeaderValue(req, "x-vercel-ip-country");
  const locationParts = [city, region, country].filter(Boolean);
  if (locationParts.length > 0) {
    return { q: locationParts.join(", ") };
  }

  return {};
};

export const getGitHubStats: RequestHandler = async (req, res) => {
  if (!GITHUB_USERNAME) {
    res.status(500).json({ error: "GitHub username is not configured" });
    return;
  }

  try {
    const force = req.query.force === "true";
    const stats = await fetchGitHubStats(force);
    res.set(
      "Cache-Control",
      `public, max-age=${Math.floor(Number(process.env.GITHUB_STATS_TTL_MS || 600000) / 1000)}`
    );
    res.json(stats);
  } catch (error) {
    console.error("Error fetching GitHub stats:", error);
    res.status(500).json({ error: "Failed to fetch GitHub stats" });
  }
};

export const getWeather: RequestHandler = async (req, res) => {
  try {
    const weather = await fetchWeather(resolveWeatherQueryFromRequest(req));
    res.json(weather);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error("Error fetching weather:", {
        status: error.response.status,
        data: error.response.data,
      });
      const upstreamMessage =
        typeof error.response.data === "object" && error.response.data
          ? (error.response.data as { message?: string }).message
          : undefined;
      res.status(error.response.status).json({
        error: upstreamMessage || "Failed to fetch weather data",
      });
      return;
    }

    const message = error instanceof Error ? error.message : "Failed to fetch weather data";
    const statusCode = message === "No location provided" ? 400 : 500;
    console.error("Error fetching weather:", error);
    res.status(statusCode).json({ error: message });
  }
};

export const getLeetCodeStats: RequestHandler = async (_req, res) => {
  try {
    const stats = await fetchLeetCodeStats();
    res.json(stats);
  } catch (error) {
    console.error("Error fetching LeetCode stats:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch LeetCode stats";
    const statusCode = message === "LEETCODE_USERNAME is not configured" ? 400 : 500;
    res.status(statusCode).json({ error: message });
  }
};
