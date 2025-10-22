import clsx from "clsx";
import React from "react";
import { useTheme } from "../../../app/providers/ThemeProvider";

const accentOptions = [
  { id: "indigo", label: "Indigo" },
  { id: "emerald", label: "Emerald" },
  { id: "amber", label: "Amber" },
  { id: "rose", label: "Rose" },
] as const;

const wallpaperOptions = [
  { id: "default", label: "Nebula" },
  { id: "aurora", label: "Aurora" },
  { id: "galaxy", label: "Galaxy" },
] as const;

const SettingsApp: React.FC = () => {
  const {
    theme,
    setTheme,
    accent,
    setAccent,
    wallpaper,
    setWallpaper,
    showDesktopIcons,
    setShowDesktopIcons,
    performanceMode,
    setPerformanceMode,
    resetPreferences,
  } = useTheme();

  return (
    <div className="flex h-full flex-col gap-4 overflow-auto bg-slate-950/30 p-6 text-sm text-slate-200">
      <section className="space-y-3 rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
        <h2 className="text-sm font-semibold text-slate-100">Theme</h2>
        <div className="flex gap-3">
          {(["light", "dark", "system"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setTheme(mode)}
              className={clsx(
                "rounded-md border px-3 py-1.5 text-xs font-medium transition",
                theme === mode
                  ? "border-accent/60 bg-accent/20 text-accent-foreground"
                  : "border-slate-700/60 text-slate-300 hover:border-accent/40",
              )}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
        <h2 className="text-sm font-semibold text-slate-100">Accent Color</h2>
        <div className="flex flex-wrap gap-2">
          {accentOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setAccent(option.id)}
              className={clsx(
                "rounded-md border px-3 py-1 text-xs transition",
                accent === option.id
                  ? "border-accent/60 bg-accent/20 text-accent-foreground"
                  : "border-slate-700/60 text-slate-300 hover:border-accent/40",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
        <h2 className="text-sm font-semibold text-slate-100">Wallpaper</h2>
        <div className="flex flex-wrap gap-2">
          {wallpaperOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setWallpaper(option.id)}
              className={clsx(
                "rounded-md border px-3 py-1 text-xs transition",
                wallpaper === option.id
                  ? "border-accent/60 bg-accent/20 text-accent-foreground"
                  : "border-slate-700/60 text-slate-300 hover:border-accent/40",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
        <h2 className="text-sm font-semibold text-slate-100">Display Options</h2>
        <label className="flex items-center gap-2 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={showDesktopIcons}
            onChange={(event) => setShowDesktopIcons(event.target.checked)}
            className="h-4 w-4 rounded border-slate-600 bg-slate-900"
          />
          Show desktop icons
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={performanceMode}
            onChange={(event) => setPerformanceMode(event.target.checked)}
            className="h-4 w-4 rounded border-slate-600 bg-slate-900"
          />
          Performance mode (reduced shadows & animations)
        </label>
      </section>

      <section className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4 text-xs text-slate-300">
        <h2 className="text-sm font-semibold text-slate-100">Layout</h2>
        <p className="mt-2">Reset desktop layout and visual preferences to defaults.</p>
        <button
          type="button"
          onClick={() => resetPreferences()}
          className="mt-3 rounded-md border border-rose-500/60 px-3 py-1.5 font-medium text-rose-200 transition hover:bg-rose-500/10"
        >
          Reset Preferences
        </button>
      </section>
    </div>
  );
};

export default SettingsApp;
