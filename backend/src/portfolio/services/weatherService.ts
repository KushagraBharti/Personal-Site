import axios from "axios";

const DEFAULT_WEATHER_CITY = "Austin";

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
    const response = await axios.get("https://api.openweathermap.org/data/2.5/weather", {
      params: { lat, lon, units: "imperial", appid: apiKey },
    });
    return response.data;
  }

  if (q) {
    const response = await axios.get("https://api.openweathermap.org/data/2.5/weather", {
      params: { q, units: "imperial", appid: apiKey },
    });
    return response.data;
  }

  const response = await axios.get("https://api.openweathermap.org/data/2.5/weather", {
    params: { q: DEFAULT_WEATHER_CITY, units: "imperial", appid: apiKey },
  });
  return response.data;
};
