import axios from "axios";
import { GITHUB_TOKEN, GITHUB_USERNAME } from "../../config/github";

const headers = {
  Accept: "application/vnd.github+json",
  ...(GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {}),
};
const graphqlHeaders = {
  Accept: "application/vnd.github+json",
  ...(GITHUB_TOKEN ? { Authorization: `bearer ${GITHUB_TOKEN}` } : {}),
};

const cacheTtlMs = Number(process.env.GITHUB_STATS_TTL_MS || 10 * 60 * 1000); // 10 minutes default
type GitHubStatsResult = { totalRepos: number; totalCommits: number };
type GitHubUserProfile = { public_repos?: number; created_at?: string };

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
  return res.data as GitHubUserProfile;
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

const fetchCommitContributionCount = async (profile: GitHubUserProfile) => {
  if (!GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN is required for GraphQL commit contributions");
  }

  const start = profile.created_at ? new Date(profile.created_at) : new Date();
  const end = new Date();
  const yearlyCounts: number[] = [];

  for (let cursor = new Date(start); cursor < end; ) {
    const next = new Date(cursor);
    next.setUTCFullYear(next.getUTCFullYear() + 1);
    const windowEnd = next < end ? next : end;
    const from = cursor.toISOString();
    const to = windowEnd.toISOString();

    const response = await axios.post<{
      data?: {
        user?: {
          contributionsCollection?: {
            totalCommitContributions?: number;
          };
        };
      };
      errors?: Array<{ message?: string }>;
    }>(
      "https://api.github.com/graphql",
      {
        query: `
          query GitHubCommitContributions($login: String!, $from: DateTime!, $to: DateTime!) {
            user(login: $login) {
              contributionsCollection(from: $from, to: $to) {
                totalCommitContributions
              }
            }
          },
        `,
        variables: {
          login: GITHUB_USERNAME,
          from,
          to,
        },
      },
      {
        headers: graphqlHeaders,
      }
    );

    if (response.data.errors?.length) {
      throw new Error(
        response.data.errors
          .map((error) => error.message)
          .filter(Boolean)
          .join("; ") || "GitHub GraphQL commit contributions query failed"
      );
    }

    yearlyCounts.push(
      Number(response.data.data?.user?.contributionsCollection?.totalCommitContributions || 0)
    );
    cursor = windowEnd;
  }

  return yearlyCounts.reduce((sum, count) => sum + count, 0);
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
    const profile = await fetchUserProfile();

    try {
      const commitContributionCount = await fetchCommitContributionCount(profile);
      return {
        totalRepos: Number(profile.public_repos || 0),
        totalCommits: commitContributionCount,
      };
    } catch (graphQlError) {
      console.warn(
        "GitHub GraphQL commit contributions query failed, falling back to commit search.",
        graphQlError
      );
    }

    const commitSearchCount = await fetchCommitSearchCount();

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
