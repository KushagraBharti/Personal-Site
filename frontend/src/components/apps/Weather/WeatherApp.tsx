import React, { useMemo, useState } from "react";
import { useWeatherQuery } from "../../../hooks/usePortfolioQueries";

const WeatherApp: React.FC = () => {
  const [searchValue, setSearchValue] = useState("Austin, US");
  const [request, setRequest] = useState<{ q?: string; lat?: number; lon?: number }>({
    q: "Austin,US",
  });
  const [geoError, setGeoError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useWeatherQuery(request);

  const primaryConditions = data?.weather?.[0];
  const lastUpdated = useMemo(() => {
    if (!data) return null;
    return new Date((data.dt + data.timezone) * 1000).toUTCString();
  }, [data]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!searchValue.trim()) return;
    setRequest({ q: searchValue.trim() });
    setGeoError(null);
  };

  const handleUseLocation = () => {
    if (!("geolocation" in navigator)) {
      setGeoError("Geolocation not supported in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setRequest({
          lat: parseFloat(position.coords.latitude.toFixed(4)),
          lon: parseFloat(position.coords.longitude.toFixed(4)),
        });
        setGeoError(null);
      },
      () => {
        setGeoError("Permission denied. Using saved location instead.");
      },
    );
  };

  return (
    <div className="flex h-full flex-col bg-slate-950/30">
      <form onSubmit={handleSubmit} className="border-b border-slate-700/40 bg-slate-900/60 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search city (e.g., Austin, US)"
            className="w-60 rounded-md border border-slate-700/60 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-accent"
          />
          <button
            type="submit"
            className="rounded-md border border-accent/60 px-3 py-1.5 text-xs font-medium text-accent-foreground transition hover:bg-accent/20"
          >
            Search
          </button>
          <button
            type="button"
            onClick={handleUseLocation}
            className="rounded-md border border-slate-700/60 px-3 py-1.5 text-xs text-slate-200 transition hover:border-accent/40"
          >
            Use Current Location
          </button>
          <button
            type="button"
            onClick={() => refetch()}
            className="ml-auto rounded-md border border-slate-700/60 px-3 py-1.5 text-xs text-slate-200 transition hover:border-accent/40"
          >
            Refresh
          </button>
        </div>
        {geoError && <p className="mt-2 text-xs text-amber-300">{geoError}</p>}
      </form>

      <div className="flex-1 overflow-auto px-4 py-4 text-sm text-slate-200">
        {(isLoading || isFetching) && (
          <div className="h-64 animate-pulse rounded-xl border border-slate-800/60 bg-slate-900/40" />
        )}

        {(isError || !data) && !isLoading && !isFetching && (
          <div className="rounded-md border border-rose-500/60 bg-rose-500/10 p-4 text-sm text-rose-200">
            Unable to retrieve weather data. Try a different city.
          </div>
        )}

        {data && !isFetching && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">{data.name}</h2>
                  <p className="text-sm text-slate-300">{primaryConditions?.description ?? ""}</p>
                </div>
                <div className="text-right">
                  <span className="text-4xl font-semibold text-slate-100">
                    {Math.round(data.main.temp)}°F
                  </span>
                  <p className="text-xs text-slate-400">
                    Feels like {Math.round(data.main.feels_like)}°F
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-300">
                <div>Humidity: {data.main.humidity}%</div>
                <div>Wind: {Math.round(data.wind.speed)} mph</div>
                <div>Pressure: {data.main.pressure} hPa</div>
                <div>Temp Range: {Math.round(data.main.temp_min)}°F – {Math.round(data.main.temp_max)}°F</div>
              </div>
              {lastUpdated && (
                <p className="mt-3 text-[11px] uppercase tracking-wide text-slate-400">
                  Last updated: {lastUpdated}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherApp;
