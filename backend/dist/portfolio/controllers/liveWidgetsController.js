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
exports.getWeather = exports.getGitHubStats = void 0;
const axios_1 = __importDefault(require("axios"));
const github_1 = require("../../config/github");
const githubStatsService_1 = require("../services/githubStatsService");
const weatherService_1 = require("../services/weatherService");
const INVALID_HEADER_VALUES = new Set(["", "null", "undefined", "unknown"]);
const getHeaderValue = (req, name) => {
    const value = req.header(name);
    if (typeof value !== "string") {
        return undefined;
    }
    const normalized = decodeURIComponent(value).trim();
    return INVALID_HEADER_VALUES.has(normalized.toLowerCase()) ? undefined : normalized;
};
const isFiniteCoordinate = (value) => value !== undefined && Number.isFinite(Number(value));
const resolveWeatherQueryFromRequest = (req) => {
    const lat = typeof req.query.lat === "string" ? req.query.lat : undefined;
    const lon = typeof req.query.lon === "string" ? req.query.lon : undefined;
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    if (isFiniteCoordinate(lat) && isFiniteCoordinate(lon)) {
        return { lat, lon };
    }
    if (q === null || q === void 0 ? void 0 : q.trim()) {
        return { q };
    }
    const headerLat = getHeaderValue(req, "x-vercel-ip-latitude");
    const headerLon = getHeaderValue(req, "x-vercel-ip-longitude");
    if (isFiniteCoordinate(headerLat) && isFiniteCoordinate(headerLon)) {
        return { lat: headerLat, lon: headerLon };
    }
    const city = getHeaderValue(req, "x-vercel-ip-city");
    const country = getHeaderValue(req, "x-vercel-ip-country");
    const locationParts = [city, country].filter(Boolean);
    if (locationParts.length > 0) {
        return { q: locationParts.join(", ") };
    }
    return {};
};
const getGitHubStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!github_1.GITHUB_USERNAME) {
        res.status(500).json({ error: "GitHub username is not configured" });
        return;
    }
    try {
        const force = req.query.force === "true";
        const stats = yield (0, githubStatsService_1.fetchGitHubStats)(force);
        res.set("Cache-Control", force
            ? "no-store, max-age=0"
            : `public, max-age=${Math.floor(Number(process.env.GITHUB_STATS_TTL_MS || 600000) / 1000)}`);
        res.json(stats);
    }
    catch (error) {
        console.error("Error fetching GitHub stats:", error);
        res.status(500).json({ error: "Failed to fetch GitHub stats" });
    }
});
exports.getGitHubStats = getGitHubStats;
const getWeather = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const weather = yield (0, weatherService_1.fetchWeather)(resolveWeatherQueryFromRequest(req));
        res.json(weather);
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error) && error.response) {
            console.error("Error fetching weather:", {
                status: error.response.status,
                data: error.response.data,
            });
            const upstreamMessage = typeof error.response.data === "object" && error.response.data
                ? error.response.data.message
                : undefined;
            res.status(error.response.status).json({
                error: upstreamMessage || "Failed to fetch weather data",
            });
            return;
        }
        const message = error instanceof Error ? error.message : "Failed to fetch weather data";
        const statusCode = message === "No location provided" ? 400 : 500;
        console.error("Error fetching weather:", error);
        res.status(statusCode).json({ error: message });
    }
});
exports.getWeather = getWeather;
