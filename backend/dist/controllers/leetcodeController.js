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
exports.getLeetCodeStats = void 0;
const axios_1 = __importDefault(require("axios"));
const getLeetCodeStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Use the environment variable LEETCODE_USERNAME or fallback to a default.
    const leetUsername = process.env.LEETCODE_USERNAME;
    if (!leetUsername) {
        res.status(400).json({ error: "LEETCODE_USERNAME is not configured" });
        return;
    }
    const url = `https://leetcode-stats-api.herokuapp.com/${leetUsername}`;
    try {
        const response = yield axios_1.default.get(url);
        // Adjust the returned data if necessary. Here we assume the API returns these fields:
        const data = {
            totalSolved: response.data.totalSolved,
            easySolved: response.data.easySolved,
            mediumSolved: response.data.mediumSolved,
            hardSolved: response.data.hardSolved,
        };
        res.json(data);
    }
    catch (error) {
        console.error("Error fetching LeetCode stats:", error);
        res.status(500).json({ error: "Failed to fetch LeetCode stats" });
    }
});
exports.getLeetCodeStats = getLeetCodeStats;
