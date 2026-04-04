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
exports.fetchWeather = void 0;
const axios_1 = __importDefault(require("axios"));
const DEFAULT_WEATHER_CITY = "Austin";
const OPENWEATHER_URL = "https://api.openweathermap.org/data/2.5/weather";
const isRetryableLocationError = (error) => { var _a; return axios_1.default.isAxiosError(error) && ((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 400; };
const requestWeather = (apiKey, params) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield axios_1.default.get(OPENWEATHER_URL, {
        params: Object.assign(Object.assign({}, params), { units: "imperial", appid: apiKey }),
    });
    return response.data;
});
const fetchWeather = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
        throw new Error("OPENWEATHER_API_KEY is missing");
    }
    const { lat, lon, q } = params;
    if (lat && lon) {
        try {
            return yield requestWeather(apiKey, { lat, lon });
        }
        catch (error) {
            if (!isRetryableLocationError(error)) {
                throw error;
            }
        }
    }
    if (q) {
        try {
            return yield requestWeather(apiKey, { q });
        }
        catch (error) {
            if (!isRetryableLocationError(error)) {
                throw error;
            }
        }
    }
    return requestWeather(apiKey, { q: DEFAULT_WEATHER_CITY });
});
exports.fetchWeather = fetchWeather;
