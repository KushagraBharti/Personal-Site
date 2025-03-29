// backend/src/controllers/introController.ts
import { Request, Response, RequestHandler } from "express";
import axios from "axios";
import { introStaticData } from "../data/intro";
import { GITHUB_USERNAME, GITHUB_TOKEN } from "../config/github";

const headers = GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {};

interface IntroResponse {
  personalPhoto: string;
  githubStats: { totalRepos: number; totalCommits: number } | null;
  leetCodeStats: { totalSolved: number; rank: string } | null;
  weather: { city: string; temp: number; description: string } | null;
  latestUpdate: string;
  funFact: string;
  featuredBlog: { title: string; link: string };
  aiProjects: string[];
  travelPlans: string;
}

// Helper to fetch GitHub commit stats (reuse from githubController if desired)
async function fetchGitHubCommitStats(): Promise<{ totalRepos: number; totalCommits: number }> {
  const repos: any[] = [];
  let page = 1;
  while (true) {
    const url = `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&page=${page}`;
    const res = await axios.get(url, { headers });
    console.log(`(Intro) Page ${page}: fetched ${res.data.length} repos`);
    if (res.data.length === 0) break;
    repos.push(...res.data);
    page++;
  }
  const totalRepos = repos.length;
  let totalCommits = 0;
  for (const repo of repos) {
    let count = 0;
    let commitPage = 1;
    while (true) {
      const commitUrl = `https://api.github.com/repos/${repo.owner.login}/${repo.name}/commits?per_page=100&page=${commitPage}`;
      const commitRes = await axios.get(commitUrl, { headers });
      if (commitRes.data.length === 0) break;
      count += commitRes.data.length;
      commitPage++;
    }
    totalCommits += count;
  }
  return { totalRepos, totalCommits };
}

export const getIntroData: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const responseData: IntroResponse = {
      personalPhoto: introStaticData.personalPhoto,
      latestUpdate: introStaticData.latestUpdate,
      funFact: introStaticData.funFact,
      featuredBlog: introStaticData.featuredBlog,
      aiProjects: introStaticData.aiProjects,
      travelPlans: introStaticData.travelPlans,
      githubStats: null,
      leetCodeStats: null,
      weather: null,
    };

    // Fetch live GitHub stats
    const githubStats = await fetchGitHubCommitStats();
    responseData.githubStats = githubStats;

    // Fetch LeetCode stats (using mock data)
    responseData.leetCodeStats = {
      totalSolved: 350,
      rank: "Top 10%",
    };

    // Fetch weather data if an API key is provided
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (apiKey) {
      const weatherRes = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=Austin&units=imperial&appid=${apiKey}`
      );
      responseData.weather = {
        city: weatherRes.data.name,
        temp: weatherRes.data.main.temp,
        description: weatherRes.data.weather[0].description,
      };
    } else {
      console.warn("No OPENWEATHER_API_KEY provided");
    }

    res.json(responseData);
  } catch (error) {
    console.error("Error in getIntroData:", error);
    res.status(500).json({ error: "Failed to retrieve intro data" });
  }
};
