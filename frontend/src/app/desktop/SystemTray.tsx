import React, { useEffect, useMemo, useState } from "react";
import { useWeatherQuery } from "../../hooks/usePortfolioQueries";

const formatTime = (date: Date) =>
  date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const SystemTray: React.FC = () => {
  const [now, setNow] = useState(() => new Date());
  const { data } = useWeatherQuery({ q: "Austin,US" });

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000 * 30);
    return () => window.clearInterval(interval);
  }, []);

  const temperatureDisplay = useMemo(() => {
    if (!data?.main?.temp) return "--";
    return `${Math.round(data.main.temp)}°F`;
  }, [data]);

  const locationDisplay = data?.name ?? "Weather";

  return (
    <div className="pointer-events-auto flex items-center gap-4 text-xs text-slate-200">
      <span className="flex items-center gap-2 rounded-md border border-slate-700/60 bg-slate-900/50 px-2 py-1">
        <span className="font-semibold text-accent-foreground">{temperatureDisplay}</span>
        <span className="text-slate-300">{locationDisplay}</span>
      </span>
      <span>{formatTime(now)}</span>
    </div>
  );
};

export default SystemTray;
