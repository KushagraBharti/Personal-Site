import axios from "axios";
import { GITHUB_TOKEN, GITHUB_USERNAME } from "../../config/github";

const headers = GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {};

const cacheTtlMs = Number(process.env.GITHUB_STATS_TTL_MS || 10 * 60 * 1000); // 10 minutes default
let cachedStats: { totalRepos: number; totalCommits: number } | null = null;
let lastFetched = 0;

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

// Much cheaper than paginating commits: uses Link header last page to estimate total commits
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

export const fetchGitHubStats = async (forceRefresh = false) => {
  const now = Date.now();
  if (!forceRefresh && cachedStats && now - lastFetched < cacheTtlMs) {
    return { ...cachedStats, cached: true };
  }

  const repos = await getAllRepos();
  let totalCommits = 0;

  for (const repo of repos) {
    const commits = await getCommitCountForRepo(repo.owner.login, repo.name);
    totalCommits += commits;
  }

  const result = { totalRepos: repos.length, totalCommits };
  cachedStats = result;
  lastFetched = now;
  return result;
};

// Allow manual cache reset (e.g., tests, admin)
export const clearGitHubCache = () => {
  cachedStats = null;
  lastFetched = 0;
};
