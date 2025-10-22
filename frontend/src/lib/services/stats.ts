import { apiClient } from "../api";
import type { GitHubStats, LeetCodeStats } from "../types";

export const getGitHubStats = async () => {
  const response = await apiClient.get<GitHubStats>("/api/github/stats");
  return response.data;
};

export const getLeetCodeStats = async () => {
  const response = await apiClient.get<LeetCodeStats>("/api/leetcode/stats");
  return response.data;
};
