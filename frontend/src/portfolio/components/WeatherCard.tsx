import React, { useEffect, useState } from "react";
import GlassCard from "../../shared/components/ui/GlassCard";
import { fetchWeather as fetchWeatherData, getCachedWeather } from "../api/liveWidgetsApi";
import type { WeatherData } from "../api/contracts";

const WeatherCard: React.FC<{
  weather?: WeatherData | null;
  isLoading?: boolean;
}> = ({ weather: controlledWeather, isLoading: controlledLoading }) => {
  const isControlled = controlledWeather !== undefined || controlledLoading !== undefined;
  const [weather, setWeather] = useState<WeatherData | null>(() =>
    isControlled ? controlledWeather ?? null : getCachedWeather()
  );

  useEffect(() => {
    if (isControlled) {
      return;
    }

    const controller = new AbortController();

    const loadWeather = async () => {
      try {
        setWeather(await fetchWeatherData(undefined, controller.signal));
      } catch (err: unknown) {
        if (!controller.signal.aborted) {
          console.error("Error fetching weather:", err);
        }
      }
    };

    loadWeather();
    return () => controller.abort();
  }, [isControlled]);

  const effectiveWeather = isControlled ? controlledWeather ?? null : weather;
  const isLoading = isControlled ? controlledLoading ?? effectiveWeather === null : effectiveWeather === null;

  if (isLoading || !effectiveWeather) {
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
        {effectiveWeather.name}: {effectiveWeather.main.temp}&deg;F
        <br />
        {effectiveWeather.weather[0].description}
      </p>
    </GlassCard>
  );
};

export default WeatherCard;
