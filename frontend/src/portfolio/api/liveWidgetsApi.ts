import axios from "axios";
import { getApiBaseUrl } from "../../shared/lib/apiBaseUrl";
import type { GitHubStats, LeetCodeStats, WeatherData } from "./contracts";

export const fetchGitHubStats = async (signal?: AbortSignal) => {
  const response = await axios.get<GitHubStats>(`${getApiBaseUrl()}/api/github/stats`, {
    signal,
    timeout: 5000,
  });
  return response.data;
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
