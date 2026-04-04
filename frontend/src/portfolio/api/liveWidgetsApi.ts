import axios from "axios";
import { getApiBaseUrl } from "../../shared/lib/apiBaseUrl";
import type { GitHubStats, LeetCodeStats, WeatherData } from "./contracts";

const GITHUB_STATS_CACHE_KEY = "github-stats-cache-v1";

let githubStatsCache: GitHubStats | null = null;
let githubStatsPromise: Promise<GitHubStats> | null = null;

const canUseStorage = () => typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";

const readGitHubStatsCache = () => {
  if (githubStatsCache) return githubStatsCache;
  if (!canUseStorage()) return null;
  try {
    const value = window.sessionStorage.getItem(GITHUB_STATS_CACHE_KEY);
    githubStatsCache = value ? (JSON.parse(value) as GitHubStats) : null;
    return githubStatsCache;
  } catch {
    return null;
  }
};

const writeGitHubStatsCache = (value: GitHubStats) => {
  githubStatsCache = value;
  if (!canUseStorage()) return;
  try {
    window.sessionStorage.setItem(GITHUB_STATS_CACHE_KEY, JSON.stringify(value));
  } catch {
    // Ignore storage failures.
  }
};

export const getCachedGitHubStats = () => readGitHubStatsCache();

export const fetchGitHubStats = async (signal?: AbortSignal) => {
  const cached = readGitHubStatsCache();
  if (cached) {
    return cached;
  }

  if (!signal && githubStatsPromise) {
    return githubStatsPromise;
  }

  const request = axios
    .get<GitHubStats>(`${getApiBaseUrl()}/api/github/stats`, {
      signal,
      timeout: 5000,
    })
    .then((response) => {
      writeGitHubStatsCache(response.data);
      return response.data;
    })
    .finally(() => {
      if (!signal) {
        githubStatsPromise = null;
      }
    });

  if (!signal) {
    githubStatsPromise = request;
  }

  return request;
};

export const fetchLeetCodeStats = async (signal?: AbortSignal) => {
  const response = await axios.get<LeetCodeStats>(`${getApiBaseUrl()}/api/leetcode/stats`, {
    signal,
    timeout: 4000,
  });
  return response.data;
};

export const fetchWeather = async (
  query: { lat: number; lon: number } | { city: string },
  signal?: AbortSignal
) => {
  const search =
    "city" in query
      ? `q=${encodeURIComponent(query.city)}`
      : `lat=${query.lat}&lon=${query.lon}`;
  const response = await axios.get<WeatherData>(`${getApiBaseUrl()}/api/weather?${search}`, {
    signal,
    timeout: 4000,
  });
  return response.data;
};
