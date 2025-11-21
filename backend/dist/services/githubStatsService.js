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
exports.clearGitHubCache = exports.fetchGitHubStats = void 0;
const axios_1 = __importDefault(require("axios"));
const github_1 = require("../config/github");
const headers = github_1.GITHUB_TOKEN ? { Authorization: `token ${github_1.GITHUB_TOKEN}` } : {};
const cacheTtlMs = Number(process.env.GITHUB_STATS_TTL_MS || 10 * 60 * 1000); // 10 minutes default
let cachedStats = null;
let lastFetched = 0;
const getAllRepos = () => __awaiter(void 0, void 0, void 0, function* () {
    const repos = [];
    let page = 1;
    while (true) {
        const url = `https://api.github.com/users/${github_1.GITHUB_USERNAME}/repos?per_page=100&page=${page}`;
        const res = yield axios_1.default.get(url, { headers });
        if (res.data.length === 0)
            break;
        repos.push(...res.data);
        page++;
    }
    return repos;
});
// Much cheaper than paginating commits: uses Link header last page to estimate total commits
const getCommitCountForRepo = (owner, repoName) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const url = `https://api.github.com/repos/${owner}/${repoName}/commits`;
    const res = yield axios_1.default.get(url, {
        headers,
        params: { per_page: 1 },
        // Surface rate-limit info to logs if it happens
        validateStatus: (status) => status === 200 || status === 304 || status === 404 || status === 409,
    });
    // 409 happens on empty repos; 404 for access issues
    if (res.status !== 200 || !res.headers.link) {
        return ((_a = res.data) === null || _a === void 0 ? void 0 : _a.length) ? res.data.length : 0;
    }
    const match = res.headers.link.match(/&page=(\d+)>; rel="last"/);
    if (match) {
        return parseInt(match[1], 10);
    }
    return ((_b = res.data) === null || _b === void 0 ? void 0 : _b.length) || 0;
});
const fetchGitHubStats = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && cachedStats && now - lastFetched < cacheTtlMs) {
        return Object.assign(Object.assign({}, cachedStats), { cached: true });
    }
    const repos = yield getAllRepos();
    let totalCommits = 0;
    for (const repo of repos) {
        const commits = yield getCommitCountForRepo(repo.owner.login, repo.name);
        totalCommits += commits;
    }
    const result = { totalRepos: repos.length, totalCommits };
    cachedStats = result;
    lastFetched = now;
    return result;
});
exports.fetchGitHubStats = fetchGitHubStats;
// Allow manual cache reset (e.g., tests, admin)
const clearGitHubCache = () => {
    cachedStats = null;
    lastFetched = 0;
};
exports.clearGitHubCache = clearGitHubCache;
