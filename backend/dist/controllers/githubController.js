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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGitHubStats = void 0;
const github_1 = require("../config/github");
const githubStatsService_1 = require("../services/githubStatsService");
const getGitHubStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!github_1.GITHUB_USERNAME) {
        res.status(500).json({ error: "GitHub username is not configured" });
        return;
    }
    try {
        const force = req.query.force === "true";
        const stats = yield (0, githubStatsService_1.fetchGitHubStats)(force);
        res.set("Cache-Control", `public, max-age=${Math.floor((Number(process.env.GITHUB_STATS_TTL_MS || 600000)) / 1000)}`);
        res.json(stats);
    }
    catch (error) {
        console.error("Error fetching GitHub stats:", error);
        res.status(500).json({ error: "Failed to fetch GitHub stats" });
    }
});
exports.getGitHubStats = getGitHubStats;
