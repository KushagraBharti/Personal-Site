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
exports.getGitHubStats = void 0;
// backend/src/controllers/githubController.ts
const axios_1 = __importDefault(require("axios"));
const github_1 = require("../config/github");
// Throw an error if username is missing
if (!github_1.GITHUB_USERNAME) {
    throw new Error("GITHUB_USERNAME is not defined in environment variables");
}
const headers = github_1.GITHUB_TOKEN ? { Authorization: `token ${github_1.GITHUB_TOKEN}` } : {};
// Fetch all repos with pagination
function getAllRepos() {
    return __awaiter(this, void 0, void 0, function* () {
        const repos = [];
        let page = 1;
        while (true) {
            const url = `https://api.github.com/users/${github_1.GITHUB_USERNAME}/repos?per_page=100&page=${page}`;
            const res = yield axios_1.default.get(url, { headers });
            console.log(`Page ${page}: fetched ${res.data.length} repos`);
            if (res.data.length === 0)
                break;
            repos.push(...res.data);
            page++;
        }
        console.log("Total repos fetched:", repos.length);
        return repos;
    });
}
// Fetch commit count for a repo using its actual owner login
function getCommitCountForRepo(owner, repoName) {
    return __awaiter(this, void 0, void 0, function* () {
        let count = 0;
        let page = 1;
        while (true) {
            const url = `https://api.github.com/repos/${owner}/${repoName}/commits?per_page=100&page=${page}`;
            const res = yield axios_1.default.get(url, { headers });
            console.log(`Repo ${repoName} (Owner: ${owner}) Page ${page}: ${res.data.length} commits`);
            if (res.data.length === 0)
                break;
            count += res.data.length;
            page++;
        }
        console.log(`Total commits for ${repoName}: ${count}`);
        return count;
    });
}
let cachedStats = null;
let lastFetched = 0;
const getGitHubStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const now = Date.now();
    // Use cache for 1 hour
    if (cachedStats && now - lastFetched < 3600000) {
        console.log("Returning cached stats:", cachedStats);
        res.json(cachedStats);
        return;
    }
    try {
        const repos = yield getAllRepos();
        const totalRepos = repos.length;
        let totalCommits = 0;
        for (const repo of repos) {
            // Use repo.owner.login to get the proper case for the owner
            const commits = yield getCommitCountForRepo(repo.owner.login, repo.name);
            totalCommits += commits;
        }
        const result = { totalRepos, totalCommits };
        console.log("Final GitHub stats:", result);
        cachedStats = result;
        lastFetched = now;
        res.json(result);
    }
    catch (error) {
        console.error("Error fetching GitHub stats:", error);
        res.status(500).json({ error: "Failed to fetch GitHub stats" });
    }
});
exports.getGitHubStats = getGitHubStats;
