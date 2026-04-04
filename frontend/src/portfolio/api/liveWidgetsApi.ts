import axios from "axios";
import { getApiBaseUrl } from "../../shared/lib/apiBaseUrl";
import type { GitHubStats, WeatherData } from "./contracts";

const GITHUB_STATS_CACHE_KEY = "github-stats-cache-v1";
const WEATHER_CACHE_PREFIX = "weather-cache-v1:";

let githubStatsCache: GitHubStats | null = null;
let githubStatsPromise: Promise<GitHubStats> | null = null;
const weatherCache = new Map<string, WeatherData>();
const weatherPromises = new Map<string, Promise<WeatherData>>();

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

const getWeatherCacheKey = (query?: { lat: number; lon: number } | { city: string }) => {
  if (!query) {
    return `${WEATHER_CACHE_PREFIX}auto`;
  }

  return "city" in query
    ? `${WEATHER_CACHE_PREFIX}city:${query.city.toLowerCase()}`
    : `${WEATHER_CACHE_PREFIX}coords:${query.lat},${query.lon}`;
};

const readWeatherCache = (key: string) => {
  const cached = weatherCache.get(key);
  if (cached) return cached;
  if (!canUseStorage()) return null;
  try {
    const value = window.sessionStorage.getItem(key);
    const parsed = value ? (JSON.parse(value) as WeatherData) : null;
    if (parsed) {
      weatherCache.set(key, parsed);
    }
    return parsed;
  } catch {
    return null;
  }
};

const writeWeatherCache = (key: string, value: WeatherData) => {
  weatherCache.set(key, value);
  if (!canUseStorage()) return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures.
  }
};

export const getCachedWeather = (query?: { lat: number; lon: number } | { city: string }) =>
  readWeatherCache(getWeatherCacheKey(query));

export const clearGitHubStatsCache = () => {
  githubStatsCache = null;
  if (!canUseStorage()) return;
  try {
    window.sessionStorage.removeItem(GITHUB_STATS_CACHE_KEY);
  } catch {
    // Ignore storage failures.
  }
};

export const fetchGitHubStats = async (
  options?: {
    signal?: AbortSignal;
    forceRefresh?: boolean;
  }
) => {
  const signal = options?.signal;
  const forceRefresh = options?.forceRefresh === true;
  const cached = readGitHubStatsCache();
  if (cached && !forceRefresh) {
    return cached;
  }

  if (forceRefresh) {
    clearGitHubStatsCache();
  }

  if (!signal && githubStatsPromise) {
    return githubStatsPromise;
  }

  const request = axios
    .get<GitHubStats>(`${getApiBaseUrl()}/api/github/stats${forceRefresh ? "?force=true" : ""}`, {
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

export const fetchWeather = async (
  query?: { lat: number; lon: number } | { city: string },
  signal?: AbortSignal
) => {
  const cacheKey = getWeatherCacheKey(query);
  const cached = readWeatherCache(cacheKey);
  if (cached) {
    return cached;
  }

  if (!signal) {
    const inFlight = weatherPromises.get(cacheKey);
    if (inFlight) {
      return inFlight;
    }
  }

  const search = !query
    ? ""
    : "city" in query
      ? `q=${encodeURIComponent(query.city)}`
      : `lat=${query.lat}&lon=${query.lon}`;
  const request = axios
    .get<WeatherData>(
      search ? `${getApiBaseUrl()}/api/weather?${search}` : `${getApiBaseUrl()}/api/weather`,
      {
      signal,
      timeout: 4000,
      }
    )
    .then((response) => {
      writeWeatherCache(cacheKey, response.data);
      return response.data;
    })
    .finally(() => {
      if (!signal) {
        weatherPromises.delete(cacheKey);
      }
    });

  if (!signal) {
    weatherPromises.set(cacheKey, request);
  }

  return request;
};
