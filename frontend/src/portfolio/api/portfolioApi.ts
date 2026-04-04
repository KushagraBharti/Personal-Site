import axios from "axios";
import { getApiBaseUrl } from "../../shared/lib/apiBaseUrl";
import type {
  PortfolioEducation,
  PortfolioExperience,
  PortfolioIntroResponse,
  PortfolioProject,
  PortfolioSnapshot,
} from "./contracts";

const PORTFOLIO_SNAPSHOT_CACHE_KEY = "portfolio-snapshot-cache-v1";
const INTRO_RESPONSE_CACHE_KEY = "portfolio-intro-cache-v1";

let snapshotCache: PortfolioSnapshot | null = null;
let snapshotPromise: Promise<PortfolioSnapshot> | null = null;
let introCache: PortfolioIntroResponse | null = null;
let introPromise: Promise<PortfolioIntroResponse> | null = null;

const canUseStorage = () => typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";

const readSessionStorage = <T>(key: string): T | null => {
  if (!canUseStorage()) return null;
  try {
    const value = window.sessionStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
};

const writeSessionStorage = (key: string, value: unknown) => {
  if (!canUseStorage()) return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures.
  }
};

export const getCachedPortfolioSnapshot = () => {
  if (snapshotCache) return snapshotCache;
  snapshotCache = readSessionStorage<PortfolioSnapshot>(PORTFOLIO_SNAPSHOT_CACHE_KEY);
  return snapshotCache;
};

export const getCachedIntroSection = () => {
  if (introCache) return introCache;
  introCache = readSessionStorage<PortfolioIntroResponse>(INTRO_RESPONSE_CACHE_KEY);
  return introCache;
};

export const fetchPortfolioSnapshot = async (signal?: AbortSignal) => {
  const cached = getCachedPortfolioSnapshot();
  if (cached) {
    return cached;
  }

  if (!signal && snapshotPromise) {
    return snapshotPromise;
  }

  const request = axios
    .get<PortfolioSnapshot>(`${getApiBaseUrl()}/api/portfolio`, { signal })
    .then((response) => {
      snapshotCache = response.data;
      writeSessionStorage(PORTFOLIO_SNAPSHOT_CACHE_KEY, response.data);
      return response.data;
    })
    .finally(() => {
      if (!signal) {
        snapshotPromise = null;
      }
    });

  if (!signal) {
    snapshotPromise = request;
  }

  return request;
};

export const fetchIntroSection = async (signal?: AbortSignal) => {
  const cached = getCachedIntroSection();
  if (cached) {
    return cached;
  }

  if (!signal && introPromise) {
    return introPromise;
  }

  const request = axios
    .get<PortfolioIntroResponse>(`${getApiBaseUrl()}/api/intro`, { signal })
    .then((response) => {
      introCache = response.data;
      writeSessionStorage(INTRO_RESPONSE_CACHE_KEY, response.data);
      return response.data;
    })
    .finally(() => {
      if (!signal) {
        introPromise = null;
      }
    });

  if (!signal) {
    introPromise = request;
  }

  return request;
};

export const prefetchPortfolioSnapshot = () => {
  void fetchPortfolioSnapshot();
};

export const fetchEducation = async (signal?: AbortSignal): Promise<PortfolioEducation[]> =>
  (await fetchPortfolioSnapshot(signal)).education;

export const fetchExperiences = async (
  signal?: AbortSignal
): Promise<PortfolioExperience[]> => (await fetchPortfolioSnapshot(signal)).experiences;

export const fetchProjects = async (signal?: AbortSignal): Promise<PortfolioProject[]> =>
  (await fetchPortfolioSnapshot(signal)).projects;
