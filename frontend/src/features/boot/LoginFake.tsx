import clsx from "clsx";
import React from "react";
import { themePacks } from "../../app/theme/themePacks";

interface LoginFakeProps {
  activeThemePackId: string;
  skipBoot: boolean;
  onToggleSkipBoot: (value: boolean) => void;
  onSelectProfile: (profile: "guest" | "admin") => void;
  onSelectThemePack: (packId: string) => void;
}

const profiles: Array<{
  id: "guest" | "admin";
  title: string;
  description: string;
  shortcut: string;
}> = [
  {
    id: "guest",
    title: "Guest Session",
    description: "Explore the desktop in read-only mode. Perfect for recruiters and curious travelers.",
    shortcut: "Enter ↵",
  },
  {
    id: "admin",
    title: "Admin Console",
    description: "Unlock editing, theme workbench, and experimental labs. (Password not required.)",
    shortcut: "Ctrl + Enter",
  },
];

const LoginFake: React.FC<LoginFakeProps> = ({
  activeThemePackId,
  skipBoot,
  onToggleSkipBoot,
  onSelectProfile,
  onSelectThemePack,
}) => {
  return (
    <div className="grid w-full max-w-5xl gap-8 rounded-3xl border border-slate-700/60 bg-slate-900/70 p-8 shadow-2xl shadow-slate-950/50 backdrop-blur-2xl md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section className="flex flex-col gap-6">
        <header>
          <span className="text-xs uppercase tracking-[0.45em] text-slate-400">Sign in</span>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-50">Welcome aboard</h2>
          <p className="mt-2 text-sm text-slate-300">
            Choose a persona to boot into Portfolio OS. Both profiles share the same sandbox; pick the vibe that fits.
          </p>
        </header>

        <div className="flex flex-col gap-3">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              type="button"
              onClick={() => onSelectProfile(profile.id)}
              className="group flex items-start gap-4 rounded-2xl border border-slate-700/60 bg-slate-900/70 px-5 py-4 text-left transition hover:border-accent/70 hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-700/60 bg-slate-950/70 text-sm font-semibold text-slate-200 transition group-hover:border-accent/70 group-hover:text-accent-foreground">
                {profile.id === "guest" ? "G" : "A"}
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-100">{profile.title}</h3>
                  <span className="rounded-full border border-slate-700/60 px-2 py-0.5 text-[10px] uppercase tracking-[0.3em] text-slate-400">
                    {profile.shortcut}
                  </span>
                </div>
                <p className="text-xs text-slate-300">{profile.description}</p>
              </div>
            </button>
          ))}
        </div>

        <label className="mt-auto flex items-center gap-3 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={skipBoot}
            onChange={(event) => onToggleSkipBoot(event.target.checked)}
            className="h-4 w-4 rounded border border-slate-600 bg-slate-900"
          />
          Always skip boot sequence on this device
        </label>
      </section>

      <section className="flex flex-col gap-4">
        <header>
          <span className="text-xs uppercase tracking-[0.45em] text-slate-400">Theme packs</span>
          <h3 className="mt-2 text-lg font-semibold text-slate-100">Pick a starting look</h3>
        </header>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {themePacks.map((pack) => (
            <button
              key={pack.id}
              type="button"
              onClick={() => onSelectThemePack(pack.id)}
              className={clsx(
                "group flex flex-col overflow-hidden rounded-2xl border text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                activeThemePackId === pack.id
                  ? "border-accent/70 shadow-lg shadow-accent/30"
                  : "border-slate-700/50 hover:border-accent/60 hover:shadow-md hover:shadow-accent/20",
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
              <div className="flex flex-1 flex-col gap-1 border-t border-slate-700/50 bg-slate-900/70 px-4 py-3">
                <span className="text-xs font-semibold text-slate-100">{pack.name}</span>
                {pack.description && <span className="text-[11px] text-slate-400">{pack.description}</span>}
                {pack.iconPack && (
                  <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Icon pack - {pack.iconPack}</span>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4 text-xs text-slate-300">
          <p className="font-medium text-slate-200">Need inspiration?</p>
          <p className="mt-1">
            Theme packs are sourced from Midjourney explorations. Swap them anytime inside Settings → Theme Workbench.
          </p>
        </div>
      </section>
    </div>
  );
};

export default LoginFake;
