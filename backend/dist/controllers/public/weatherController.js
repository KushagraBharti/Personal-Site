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
exports.getWeather = void 0;
const axios_1 = __importDefault(require("axios"));
const getWeather = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { lat, lon, q } = req.query;
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
        res.status(500).json({ error: "OPENWEATHER_API_KEY is missing" });
        return; // return nothing => OK
    }
    let url;
    if (lat && lon) {
        url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`;
    }
    else if (q) {
        url = `https://api.openweathermap.org/data/2.5/weather?q=${q}&units=imperial&appid=${apiKey}`;
    }
    else {
        res.status(400).json({ error: "No location provided" });
        return; // return nothing => OK
    }
    try {
        const weatherRes = yield axios_1.default.get(url);
        res.json(weatherRes.data);
        return; // return nothing => OK
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
        console.error("Error fetching weather:", error);
        res.status(500).json({ error: "Failed to fetch weather data" });
        return; // return nothing => OK
    }
});
exports.getWeather = getWeather;
