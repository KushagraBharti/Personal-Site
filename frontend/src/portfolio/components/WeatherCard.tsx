import React, { useEffect, useState } from "react";
import axios from "axios";
import GlassCard from "../../shared/components/ui/GlassCard";
import { fetchWeather as fetchWeatherData } from "../api/liveWidgetsApi";
import type { WeatherData } from "../api/contracts";

interface GeoResponse {
  latitude: number;
  longitude: number;
  success?: boolean;
}

const WeatherCard: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const fallbackCity = "Austin";

    const getIpLocation = async () => {
      try {
        const locationRes = await axios.get<GeoResponse>("https://ipwho.is/", {
          signal: controller.signal,
          timeout: 4000,
        });
        if (
          locationRes.data.success === false ||
          typeof locationRes.data.latitude !== "number" ||
          typeof locationRes.data.longitude !== "number"
        ) {
          return null;
        }
        if (typeof locationRes.data.latitude === "number" && typeof locationRes.data.longitude === "number") {
          return { lat: locationRes.data.latitude, lon: locationRes.data.longitude };
        }
      } catch {
        return null;
      }
      return null;
    };

    const loadWeather = async () => {
      try {
        const ipLocation = await getIpLocation();
        const query = ipLocation
          ? { lat: ipLocation.lat, lon: ipLocation.lon }
          : { city: fallbackCity };
        setWeather(await fetchWeatherData(query, controller.signal));
      } catch (err: unknown) {
        if (!controller.signal.aborted) {
          console.error("Error fetching weather:", err);
          setError("Unable to load weather data");
        }
      }
    };

    loadWeather();
    return () => controller.abort();
  }, []);

  if (error) {
    return (
      <GlassCard className="p-4 w-60 text-center">
        <h4 className="text-sm font-bold text-white mb-1">Weather</h4>
        <p className="text-sm text-red-300">{error}</p>
      </GlassCard>
    );
  }

  if (!weather) {
    return (
      <GlassCard className="p-4 w-60 text-center">
        <h4 className="text-sm font-bold text-white mb-1">Weather</h4>
        <p className="text-sm text-gray-200">Loading weather...</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-4 w-60 text-center">
      <h4 className="text-sm font-bold text-white mb-1">Weather</h4>
      <p className="text-sm text-gray-200">
        {weather.name}: {weather.main.temp}&deg;F
        <br />
        {weather.weather[0].description}
      </p>
    </GlassCard>
  );
};

export default WeatherCard;
