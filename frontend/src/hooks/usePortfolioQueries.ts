import { useQuery } from "@tanstack/react-query";
import {
  getEducation,
  getExperience,
  getGitHubStats,
  getIntro,
  getLeetCodeStats,
  getProjects,
  getWeather,
} from "../lib/services";
import type { WeatherResponse } from "../lib/types";

export const useProjectsQuery = () =>
  useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
    staleTime: 1000 * 60 * 60,
  });

export const useExperienceQuery = () =>
  useQuery({
    queryKey: ["experience"],
    queryFn: getExperience,
    staleTime: 1000 * 60 * 60,
  });

export const useEducationQuery = () =>
  useQuery({
    queryKey: ["education"],
    queryFn: getEducation,
    staleTime: 1000 * 60 * 60,
  });

export const useIntroQuery = () =>
  useQuery({
    queryKey: ["intro"],
    queryFn: getIntro,
    staleTime: 1000 * 60 * 60,
  });

export const useWeatherQuery = (params: { lat?: number; lon?: number; q?: string }) =>
  useQuery<WeatherResponse>({
    queryKey: ["weather", params],
    queryFn: () => getWeather(params),
    staleTime: 1000 * 60 * 15,
    enabled: Boolean(params.lat || params.lon || params.q),
  });

export const useGitHubStatsQuery = () =>
  useQuery({
    queryKey: ["github", "stats"],
    queryFn: getGitHubStats,
    staleTime: 1000 * 60 * 60 * 6,
  });

export const useLeetCodeStatsQuery = () =>
  useQuery({
    queryKey: ["leetcode", "stats"],
    queryFn: getLeetCodeStats,
    staleTime: 1000 * 60 * 60,
  });
