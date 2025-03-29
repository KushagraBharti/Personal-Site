// backend/src/controllers/githubController.ts
import axios from "axios";
import { Request, Response, RequestHandler } from "express";
import { GITHUB_USERNAME, GITHUB_TOKEN } from "../config/github";

// Throw an error if username is missing
if (!GITHUB_USERNAME) {
  throw new Error("GITHUB_USERNAME is not defined in environment variables");
}

const headers = GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {};

// Fetch all repos with pagination
async function getAllRepos(): Promise<any[]> {
  const repos: any[] = [];
  let page = 1;
  while (true) {
    const url = `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&page=${page}`;
    const res = await axios.get(url, { headers });
    console.log(`Page ${page}: fetched ${res.data.length} repos`);
    if (res.data.length === 0) break;
    repos.push(...res.data);
    page++;
  }
  console.log("Total repos fetched:", repos.length);
  return repos;
}

// Fetch commit count for a repo using its actual owner login
async function getCommitCountForRepo(owner: string, repoName: string): Promise<number> {
  let count = 0;
  let page = 1;
  while (true) {
    const url = `https://api.github.com/repos/${owner}/${repoName}/commits?per_page=100&page=${page}`;
    const res = await axios.get(url, { headers });
    console.log(`Repo ${repoName} (Owner: ${owner}) Page ${page}: ${res.data.length} commits`);
    if (res.data.length === 0) break;
    count += res.data.length;
    page++;
  }
  console.log(`Total commits for ${repoName}: ${count}`);
  return count;
}

let cachedStats: { totalRepos: number; totalCommits: number } | null = null;
let lastFetched = 0;

export const getGitHubStats: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const now = Date.now();
  // Use cache for 1 hour
  if (cachedStats && now - lastFetched < 3600000) {
    console.log("Returning cached stats:", cachedStats);
    res.json(cachedStats);
    return;
  }

  try {
    const repos = await getAllRepos();
    const totalRepos = repos.length;
    let totalCommits = 0;
    for (const repo of repos) {
      // Use repo.owner.login to get the proper case for the owner
      const commits = await getCommitCountForRepo(repo.owner.login, repo.name);
      totalCommits += commits;
    }
    const result = { totalRepos, totalCommits };
    console.log("Final GitHub stats:", result);
    cachedStats = result;
    lastFetched = now;
    res.json(result);
  } catch (error) {
    console.error("Error fetching GitHub stats:", error);
    res.status(500).json({ error: "Failed to fetch GitHub stats" });
  }
};
