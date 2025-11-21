import React, { useEffect, useState } from "react";
import axios from "axios";
import GlassCard from "./ui/GlassCard";

interface WeatherData {
  name: string;
  main: { temp: number };
  weather: { description: string }[];
}

const WeatherCard: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(
      /\/$/,
      ""
    );
    const controller = new AbortController();
    const fallbackCity = "Austin";

    const fetchWeather = async () => {
      try {
        const weatherRes = await axios.get<WeatherData>(
          `${baseUrl}/api/weather?q=${encodeURIComponent(fallbackCity)}`,
          { signal: controller.signal, timeout: 4000 }
        );
        setWeather(weatherRes.data);
      } catch (err: any) {
        if (!controller.signal.aborted) {
          console.error("Error fetching weather:", err);
          setError("Unable to load weather data");
        }
      }
    };

    fetchWeather();
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
