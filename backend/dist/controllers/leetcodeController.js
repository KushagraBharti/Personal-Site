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
    // Here, we're using a community API endpoint.
    // Replace the URL below with your chosen LeetCode API endpoint.
    const leetUsername = process.env.LEETCODE_USERNAME || "your_leetcode_username";
    try {
        const url = `https://leetcode-stats-api.herokuapp.com/${leetUsername}`;
        const response = yield axios_1.default.get(url);
        // Adjust the response data if needed:
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
