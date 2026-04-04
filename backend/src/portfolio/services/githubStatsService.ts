import axios from "axios";
import { GITHUB_TOKEN, GITHUB_USERNAME } from "../../config/github";

const headers = {
  Accept: "application/vnd.github+json",
  ...(GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {}),
};

const cacheTtlMs = Number(process.env.GITHUB_STATS_TTL_MS || 10 * 60 * 1000); // 10 minutes default
type GitHubStatsResult = { totalRepos: number; totalCommits: number };

let cachedStats: GitHubStatsResult | null = null;
let lastFetched = 0;
let refreshPromise: Promise<GitHubStatsResult> | null = null;

const getAllRepos = async () => {
  const repos: any[] = [];
  let page = 1;
  while (true) {
    const url = `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&page=${page}`;
    const res = await axios.get(url, { headers });
    if (res.data.length === 0) break;
    repos.push(...res.data);
    page++;
  }
  return repos;
};

const fetchUserProfile = async () => {
  const url = `https://api.github.com/users/${GITHUB_USERNAME}`;
  const res = await axios.get(url, { headers });
  return res.data as { public_repos?: number };
};

const fetchCommitSearchCount = async () => {
  const url = "https://api.github.com/search/commits";
  const res = await axios.get(url, {
    headers,
    params: {
      q: `author:${GITHUB_USERNAME}`,
      per_page: 1,
    },
  });
  return Number(res.data?.total_count || 0);
};

const getCommitCountForRepo = async (owner: string, repoName: string) => {
  const url = `https://api.github.com/repos/${owner}/${repoName}/commits`;
  const res = await axios.get(url, {
    headers,
    params: { per_page: 1 },
    // Surface rate-limit info to logs if it happens
    validateStatus: (status) => status === 200 || status === 304 || status === 404 || status === 409,
  });

  // 409 happens on empty repos; 404 for access issues
  if (res.status !== 200 || !res.headers.link) {
    return res.data?.length ? res.data.length : 0;
  }

  const match = res.headers.link.match(/&page=(\d+)>; rel="last"/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return res.data?.length || 0;
};

const mapWithConcurrency = async <T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>
) => {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  const worker = async () => {
    while (true) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      if (currentIndex >= items.length) {
        return;
      }
      results[currentIndex] = await mapper(items[currentIndex]);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  );

  return results;
};

const fetchCommitCountFallback = async () => {
  const repos = await getAllRepos();
  const commitCounts = await mapWithConcurrency(repos, 6, async (repo) =>
    getCommitCountForRepo(repo.owner.login, repo.name)
  );

  return {
    totalRepos: repos.length,
    totalCommits: commitCounts.reduce((sum, count) => sum + count, 0),
  };
};

const refreshGitHubStats = async (): Promise<GitHubStatsResult> => {
  try {
    const [profile, commitSearchCount] = await Promise.all([
      fetchUserProfile(),
      fetchCommitSearchCount(),
    ]);

    return {
      totalRepos: Number(profile.public_repos || 0),
      totalCommits: commitSearchCount,
    };
  } catch (error) {
    console.warn("Primary GitHub stats query failed, falling back to repo walk.", error);
    return fetchCommitCountFallback();
  }
};

export const fetchGitHubStats = async (forceRefresh = false) => {
  const now = Date.now();
  if (!forceRefresh && cachedStats && now - lastFetched < cacheTtlMs) {
    return { ...cachedStats, cached: true };
  }

  if (!forceRefresh && cachedStats && refreshPromise) {
    return { ...cachedStats, cached: true, stale: true };
  }

  if (!forceRefresh && cachedStats) {
    refreshPromise ??= refreshGitHubStats()
      .then((result) => {
        cachedStats = result;
        lastFetched = Date.now();
        return result;
      })
      .finally(() => {
        refreshPromise = null;
      });
    return { ...cachedStats, cached: true, stale: true };
  }

  refreshPromise ??= refreshGitHubStats()
    .then((result) => {
      cachedStats = result;
      lastFetched = Date.now();
      return result;
    })
    .finally(() => {
      refreshPromise = null;
    });

  const result = await refreshPromise;
  cachedStats = result;
  lastFetched = Date.now();
  return result;
};

// Allow manual cache reset (e.g., tests, admin)
export const clearGitHubCache = () => {
  cachedStats = null;
  lastFetched = 0;
};
