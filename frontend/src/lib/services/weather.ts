import { apiClient } from "../api";
import type { WeatherResponse } from "../types";

interface WeatherQuery {
  lat?: number;
  lon?: number;
  q?: string;
}

export const getWeather = async ({ lat, lon, q }: WeatherQuery) => {
  const response = await apiClient.get<WeatherResponse>("/api/weather", {
    params: {
      lat,
      lon,
      q,
    },
  });
  return response.data;
};
