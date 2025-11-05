import clsx from "clsx";
import React from "react";
import { useTheme } from "../../../app/providers/ThemeProvider";
import { themePacks } from "../../../app/theme/themePacks";

const accentOptions = [
  { id: "indigo", label: "Indigo" },
  { id: "emerald", label: "Emerald" },
  { id: "amber", label: "Amber" },
  { id: "rose", label: "Rose" },
] as const;

const SettingsApp: React.FC = () => {
  const {
    theme,
    setTheme,
    accentPreset,
    setAccent,
    wallpaperUrl,
    activeThemePack,
    applyThemePack,
    selectedThemePack,
    showDesktopIcons,
    setShowDesktopIcons,
    performanceMode,
    setPerformanceMode,
    skipBoot,
    setSkipBoot,
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
        <p className="text-xs text-slate-400">Active pack: {activeThemePack.name}</p>
      </section>

      <section className="space-y-3 rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
        <h2 className="text-sm font-semibold text-slate-100">Theme Packs</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {themePacks.map((pack) => (
            <button
              key={pack.id}
              type="button"
              onClick={() => applyThemePack(pack.id)}
              className={clsx(
                "group relative overflow-hidden rounded-lg border text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                selectedThemePack === pack.id
                  ? "border-accent/70 shadow-lg shadow-accent/20"
                  : "border-slate-700/40 hover:border-accent/40 hover:shadow-md hover:shadow-accent/10",
              )}
            >
              <div className="aspect-video w-full overflow-hidden">
                <img
                  src={pack.wallpaper}
                  alt=""
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]"
                  loading="lazy"
                />
              </div>
              <div className="flex flex-col gap-1 border-t border-slate-700/40 bg-slate-900/60 px-3 py-2">
                <span className="text-xs font-medium text-slate-100">{pack.name}</span>
                {pack.description && <span className="text-[11px] text-slate-400">{pack.description}</span>}
              </div>
            </button>
          ))}
        </div>
        <div className="rounded-lg border border-slate-700/40 bg-slate-900/60 p-3 text-xs text-slate-300">
          <p className="font-medium text-slate-200">Current wallpaper</p>
          <div className="mt-2 h-24 overflow-hidden rounded-md border border-slate-700/50">
            <img src={wallpaperUrl} alt="" className="h-full w-full object-cover" />
          </div>
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
                accentPreset === option.id
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
        <h2 className="text-sm font-semibold text-slate-100">Display & Boot</h2>
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
          Performance mode (reduce blur & motion)
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={skipBoot}
            onChange={(event) => setSkipBoot(event.target.checked)}
            className="h-4 w-4 rounded border-slate-600 bg-slate-900"
          />
          Always skip boot sequence
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
