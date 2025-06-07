import React, { useState, useEffect } from "react";
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
    const fetchLocationAndWeather = async () => {
      try {
        // Get approximate location based on IP using ipapi.co
        const ipLocationRes = await axios.get("https://ipapi.co/json/");
        const city = ipLocationRes.data.city;
        console.log("Detected city from IP:", city);
        
        // Call your backend weather endpoint using the detected city
        const weatherRes = await axios.get<WeatherData>(
          `${import.meta.env.VITE_API_BASE_URL}/api/weather?q=${city}`
        );
        setWeather(weatherRes.data);
      } catch (err: unknown) {
        console.error("Error fetching weather:", err);
        setError("Unable to load weather data");
      }
    };

    fetchLocationAndWeather();
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
        {weather.name}: {weather.main.temp}°F
        <br />
        {weather.weather[0].description}
      </p>
    </GlassCard>
  );
};

export default WeatherCard;
