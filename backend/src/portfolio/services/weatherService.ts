import axios from "axios";

const DEFAULT_WEATHER_CITY = "Austin";
const OPENWEATHER_URL = "https://api.openweathermap.org/data/2.5/weather";

const isRetryableLocationError = (error: unknown) =>
  axios.isAxiosError(error) && error.response?.status === 400;

const requestWeather = async (
  apiKey: string,
  params: { lat?: string; lon?: string; q?: string }
) => {
  const response = await axios.get(OPENWEATHER_URL, {
    params: {
      ...params,
      units: "imperial",
      appid: apiKey,
    },
  });
  return response.data;
};

export const fetchWeather = async (params: {
  lat?: string;
  lon?: string;
  q?: string;
}) => {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENWEATHER_API_KEY is missing");
  }

  const { lat, lon, q } = params;
  if (lat && lon) {
    try {
      return await requestWeather(apiKey, { lat, lon });
    } catch (error) {
      if (!isRetryableLocationError(error)) {
        throw error;
      }
    }
  }

  if (q) {
    try {
      return await requestWeather(apiKey, { q });
    } catch (error) {
      if (!isRetryableLocationError(error)) {
        throw error;
      }
    }
  }

  return requestWeather(apiKey, { q: DEFAULT_WEATHER_CITY });
};
