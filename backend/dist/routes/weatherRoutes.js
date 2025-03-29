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
// backend/src/routes/weatherRoutes.ts
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const router = express_1.default.Router();
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { lat, lon, q } = req.query;
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
        res.status(500).json({ error: "OPENWEATHER_API_KEY is missing" });
        return;
    }
    let url = "";
    if (lat && lon) {
        // Use latitude and longitude if provided
        url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`;
    }
    else if (q) {
        // Use city name if provided
        url = `https://api.openweathermap.org/data/2.5/weather?q=${q}&units=imperial&appid=${apiKey}`;
    }
    else {
        res.status(400).json({ error: "No location provided" });
        return;
    }
    try {
        const weatherRes = yield axios_1.default.get(url);
        res.json(weatherRes.data); // Just call res.json without returning it
    }
    catch (error) {
        console.error("Error fetching weather:", error);
        res.status(500).json({ error: "Failed to fetch weather data" });
    }
}));
exports.default = router;
