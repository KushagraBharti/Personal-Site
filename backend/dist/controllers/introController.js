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
const githubStatsService_1 = require("../services/githubStatsService");
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
        // Fetch live GitHub stats (shared cached service)
        if (github_1.GITHUB_USERNAME) {
            const githubStats = yield (0, githubStatsService_1.fetchGitHubStats)(req.query.force === "true");
            responseData.githubStats = { totalRepos: githubStats.totalRepos, totalCommits: githubStats.totalCommits };
        }
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
        const ttlSeconds = Math.floor(Number(process.env.GITHUB_STATS_TTL_MS || 600000) / 1000);
        res.set("Cache-Control", `public, max-age=${ttlSeconds}`);
        res.json(responseData);
    }
    catch (error) {
        console.error("Error in getIntroData:", error);
        res.status(500).json({ error: "Failed to retrieve intro data" });
    }
});
exports.getIntroData = getIntroData;
