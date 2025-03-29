"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIntroData = void 0;
const axios_1 = __importDefault(require("axios"));
const intro_1 = require("../data/intro");
const github_1 = require("../config/github");
const headers = github_1.GITHUB_TOKEN ? { Authorization: `token ${github_1.GITHUB_TOKEN}` } : {};
// Helper to fetch GitHub commit stats (reuse from githubController if desired)
function fetchGitHubCommitStats() {
    return __awaiter(this, void 0, void 0, function* () {
        const repos = [];
        let page = 1;
        while (true) {
            const url = `https://api.github.com/users/${github_1.GITHUB_USERNAME}/repos?per_page=100&page=${page}`;
            const res = yield axios_1.default.get(url, { headers });
            console.log(`(Intro) Page ${page}: fetched ${res.data.length} repos`);
            if (res.data.length === 0)
                break;
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
                const commitRes = yield axios_1.default.get(commitUrl, { headers });
                if (commitRes.data.length === 0)
                    break;
                count += commitRes.data.length;
                commitPage++;
            }
            totalCommits += count;
        }
        return { totalRepos, totalCommits };
    });
}
const getIntroData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const responseData = {
            personalPhoto: intro_1.introStaticData.personalPhoto,
            latestUpdate: intro_1.introStaticData.latestUpdate,
            funFact: intro_1.introStaticData.funFact,
            featuredBlog: intro_1.introStaticData.featuredBlog,
            aiProjects: intro_1.introStaticData.aiProjects,
            travelPlans: intro_1.introStaticData.travelPlans,
            githubStats: null,
            leetCodeStats: null,
            weather: null,
        };
        // Fetch live GitHub stats
        const githubStats = yield fetchGitHubCommitStats();
        responseData.githubStats = githubStats;
        // Fetch LeetCode stats (using mock data)
        responseData.leetCodeStats = {
            totalSolved: 350,
            rank: "Top 10%",
        };
        // Fetch weather data if an API key is provided
        const apiKey = process.env.OPENWEATHER_API_KEY;
        if (apiKey) {
            const weatherRes = yield axios_1.default.get(`https://api.openweathermap.org/data/2.5/weather?q=Austin&units=imperial&appid=${apiKey}`);
            responseData.weather = {
                city: weatherRes.data.name,
                temp: weatherRes.data.main.temp,
                description: weatherRes.data.weather[0].description,
            };
        }
        else {
            console.warn("No OPENWEATHER_API_KEY provided");
        }
        res.json(responseData);
    }
    catch (error) {
        console.error("Error in getIntroData:", error);
        res.status(500).json({ error: "Failed to retrieve intro data" });
    }
});
exports.getIntroData = getIntroData;
