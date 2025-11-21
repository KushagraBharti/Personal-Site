import React, { useEffect, useRef, useState } from "react";
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
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const baseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
    if (!baseUrl) {
      setError("Weather service unavailable");
      return;
    }

    const cachedCity = sessionStorage.getItem("weather-cache-city");
    const controller = new AbortController();
    const fallbackCity = "Austin";

    const fetchWeather = async () => {
      try {
        let city = cachedCity || fallbackCity;

        if (!cachedCity) {
          const ipLocationRes = await axios.get("https://ipapi.co/json/", {
            signal: controller.signal,
            timeout: 3000,
          });
          city = ipLocationRes.data.city || fallbackCity;
          sessionStorage.setItem("weather-cache-city", city);
        }

        const targetCity = city || fallbackCity;
        const weatherRes = await axios.get<WeatherData>(
          `${baseUrl}/api/weather?q=${encodeURIComponent(targetCity)}`,
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

    const idle = (window as any).requestIdleCallback;
    let idleCallbackId: number | undefined;
    const delayId = window.setTimeout(() => {
      if (typeof idle === "function") {
        idleCallbackId = idle(fetchWeather, { timeout: 1500 }) as number;
      }
      if (!idleCallbackId) {
        fetchWeather();
      }
    }, 350);

    return () => {
      controller.abort();
      if (typeof idle === "function" && idleCallbackId) {
        (window as any).cancelIdleCallback?.(idleCallbackId);
      }
      window.clearTimeout(delayId);
    };
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
