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
const github_1 = require("../../config/github");
const headers = Object.assign({ Accept: "application/vnd.github+json" }, (github_1.GITHUB_TOKEN ? { Authorization: `token ${github_1.GITHUB_TOKEN}` } : {}));
const graphqlHeaders = Object.assign({ Accept: "application/vnd.github+json" }, (github_1.GITHUB_TOKEN ? { Authorization: `bearer ${github_1.GITHUB_TOKEN}` } : {}));
const cacheTtlMs = Number(process.env.GITHUB_STATS_TTL_MS || 10 * 60 * 1000); // 10 minutes default
let cachedStats = null;
let lastFetched = 0;
let refreshPromise = null;
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
const fetchUserProfile = () => __awaiter(void 0, void 0, void 0, function* () {
    const url = `https://api.github.com/users/${github_1.GITHUB_USERNAME}`;
    const res = yield axios_1.default.get(url, { headers });
    return res.data;
});
const fetchCommitSearchCount = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const url = "https://api.github.com/search/commits";
    const res = yield axios_1.default.get(url, {
        headers,
        params: {
            q: `author:${github_1.GITHUB_USERNAME}`,
            per_page: 1,
        },
    });
    return Number(((_a = res.data) === null || _a === void 0 ? void 0 : _a.total_count) || 0);
});
const fetchCommitContributionCount = (profile) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    if (!github_1.GITHUB_TOKEN) {
        throw new Error("GITHUB_TOKEN is required for GraphQL commit contributions");
    }
    const start = profile.created_at ? new Date(profile.created_at) : new Date();
    const end = new Date();
    const yearlyCounts = [];
    for (let cursor = new Date(start); cursor < end;) {
        const next = new Date(cursor);
        next.setUTCFullYear(next.getUTCFullYear() + 1);
        const windowEnd = next < end ? next : end;
        const from = cursor.toISOString();
        const to = windowEnd.toISOString();
        const response = yield axios_1.default.post("https://api.github.com/graphql", {
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
                login: github_1.GITHUB_USERNAME,
                from,
                to,
            },
        }, {
            headers: graphqlHeaders,
        });
        if ((_a = response.data.errors) === null || _a === void 0 ? void 0 : _a.length) {
            throw new Error(response.data.errors
                .map((error) => error.message)
                .filter(Boolean)
                .join("; ") || "GitHub GraphQL commit contributions query failed");
        }
        yearlyCounts.push(Number(((_d = (_c = (_b = response.data.data) === null || _b === void 0 ? void 0 : _b.user) === null || _c === void 0 ? void 0 : _c.contributionsCollection) === null || _d === void 0 ? void 0 : _d.totalCommitContributions) || 0));
        cursor = windowEnd;
    }
    return yearlyCounts.reduce((sum, count) => sum + count, 0);
});
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
const mapWithConcurrency = (items, concurrency, mapper) => __awaiter(void 0, void 0, void 0, function* () {
    const results = new Array(items.length);
    let nextIndex = 0;
    const worker = () => __awaiter(void 0, void 0, void 0, function* () {
        while (true) {
            const currentIndex = nextIndex;
            nextIndex += 1;
            if (currentIndex >= items.length) {
                return;
            }
            results[currentIndex] = yield mapper(items[currentIndex]);
        }
    });
    yield Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
    return results;
});
const fetchCommitCountFallback = () => __awaiter(void 0, void 0, void 0, function* () {
    const repos = yield getAllRepos();
    const commitCounts = yield mapWithConcurrency(repos, 6, (repo) => __awaiter(void 0, void 0, void 0, function* () { return getCommitCountForRepo(repo.owner.login, repo.name); }));
    return {
        totalRepos: repos.length,
        totalCommits: commitCounts.reduce((sum, count) => sum + count, 0),
    };
});
const refreshGitHubStats = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const profile = yield fetchUserProfile();
        try {
            const commitContributionCount = yield fetchCommitContributionCount(profile);
            return {
                totalRepos: Number(profile.public_repos || 0),
                totalCommits: commitContributionCount,
            };
        }
        catch (graphQlError) {
            console.warn("GitHub GraphQL commit contributions query failed, falling back to commit search.", graphQlError);
        }
        const commitSearchCount = yield fetchCommitSearchCount();
        return {
            totalRepos: Number(profile.public_repos || 0),
            totalCommits: commitSearchCount,
        };
    }
    catch (error) {
        console.warn("Primary GitHub stats query failed, falling back to repo walk.", error);
        return fetchCommitCountFallback();
    }
});
const fetchGitHubStats = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && cachedStats && now - lastFetched < cacheTtlMs) {
        return Object.assign(Object.assign({}, cachedStats), { cached: true });
    }
    if (!forceRefresh && cachedStats && refreshPromise) {
        return Object.assign(Object.assign({}, cachedStats), { cached: true, stale: true });
    }
    if (!forceRefresh && cachedStats) {
        refreshPromise !== null && refreshPromise !== void 0 ? refreshPromise : (refreshPromise = refreshGitHubStats()
            .then((result) => {
            cachedStats = result;
            lastFetched = Date.now();
            return result;
        })
            .finally(() => {
            refreshPromise = null;
        }));
        return Object.assign(Object.assign({}, cachedStats), { cached: true, stale: true });
    }
    refreshPromise !== null && refreshPromise !== void 0 ? refreshPromise : (refreshPromise = refreshGitHubStats()
        .then((result) => {
        cachedStats = result;
        lastFetched = Date.now();
        return result;
    })
        .finally(() => {
        refreshPromise = null;
    }));
    const result = yield refreshPromise;
    cachedStats = result;
    lastFetched = Date.now();
    return result;
});
exports.fetchGitHubStats = fetchGitHubStats;
// Allow manual cache reset (e.g., tests, admin)
const clearGitHubCache = () => {
    cachedStats = null;
    lastFetched = 0;
};
exports.clearGitHubCache = clearGitHubCache;
