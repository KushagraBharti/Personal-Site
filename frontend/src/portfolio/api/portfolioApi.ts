import { getApiBaseUrl } from "../../shared/lib/apiBaseUrl";
import type {
  PortfolioEducation,
  PortfolioExperience,
  PortfolioIntroResponse,
  PortfolioProject,
  PortfolioSnapshot,
  PortfolioWriting,
} from "./contracts";

const PORTFOLIO_CACHE_VERSION = "v5";
const PORTFOLIO_SNAPSHOT_CACHE_KEY = `portfolio-snapshot-cache-${PORTFOLIO_CACHE_VERSION}`;
const INTRO_RESPONSE_CACHE_KEY = `portfolio-intro-cache-${PORTFOLIO_CACHE_VERSION}`;

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

const requestJson = async <T>(path: string, signal?: AbortSignal) => {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Portfolio request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
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
  if (!signal && snapshotPromise) {
    return snapshotPromise;
  }

  const request = requestJson<PortfolioSnapshot>("/api/portfolio", signal)
    .then((data) => {
      snapshotCache = data;
      writeSessionStorage(PORTFOLIO_SNAPSHOT_CACHE_KEY, data);
      return data;
    })
    .catch((error) => {
      if (cached) {
        return cached;
      }
      throw error;
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
  if (!signal && introPromise) {
    return introPromise;
  }

  const request = requestJson<PortfolioIntroResponse>("/api/intro", signal)
    .then((data) => {
      introCache = data;
      writeSessionStorage(INTRO_RESPONSE_CACHE_KEY, data);
      return data;
    })
    .catch((error) => {
      if (cached) {
        return cached;
      }
      throw error;
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
  void fetchPortfolioSnapshot().catch(() => {
    // Generated bootstrap data keeps the portfolio renderable when the API is unavailable.
  });
};

export const fetchEducation = async (signal?: AbortSignal): Promise<PortfolioEducation[]> =>
  (await fetchPortfolioSnapshot(signal)).education;

export const fetchExperiences = async (
  signal?: AbortSignal
): Promise<PortfolioExperience[]> => (await fetchPortfolioSnapshot(signal)).experiences;

export const fetchProjects = async (signal?: AbortSignal): Promise<PortfolioProject[]> =>
  (await fetchPortfolioSnapshot(signal)).projects;

export const fetchWritings = async (signal?: AbortSignal): Promise<PortfolioWriting[]> =>
  (await fetchPortfolioSnapshot(signal)).writings ?? [];
