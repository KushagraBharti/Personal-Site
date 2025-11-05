import clsx from "clsx";
import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "../../app/providers/ThemeProvider";
import LoginFake from "./LoginFake";

const BOOT_TICKS = 6;

const tutorialHints = [
  {
    id: "windows",
    title: "Windows with physics",
    description: "Drag, fling, and snap apps. Double-click the title bar to toggle maximize.",
  },
  {
    id: "start",
    title: "Explore the Start menu",
    description: "Launch mini-apps, change themes, and pin favorites to the taskbar.",
  },
  {
    id: "secrets",
    title: "Find hidden easter eggs",
    description: "Hotspots across the desktop unlock achievements and secret notes.",
  },
] as const;

type BootPhase = "splash" | "login" | "tutorial";

interface BootSequenceProps {
  shouldShowTutorial: boolean;
  onTutorialComplete: () => void;
  onSequenceComplete: () => void;
}

const BootSequence: React.FC<BootSequenceProps> = ({
  shouldShowTutorial,
  onTutorialComplete,
  onSequenceComplete,
}) => {
  const { wallpaperUrl, activeThemePack, applyThemePack, skipBoot, setSkipBoot } = useTheme();
  const [phase, setPhase] = useState<BootPhase>("splash");
  const [progress, setProgress] = useState(0);
  const [tickProgress, setTickProgress] = useState(0);
  const [selectedProfile, setSelectedProfile] = useState<"guest" | "admin" | null>(null);
  const [tutorialIndex, setTutorialIndex] = useState(0);

  useEffect(() => {
    if (phase !== "splash") return;
    let frameId: number;
    const duration = 3200;
    const start = performance.now();

    const animate = () => {
      const elapsed = performance.now() - start;
      const ratio = Math.min(1, elapsed / duration);
      setProgress(ratio);
      setTickProgress(Math.min(BOOT_TICKS, Math.round(ratio * BOOT_TICKS)));
      if (ratio < 1) {
        frameId = requestAnimationFrame(animate);
      } else {
        setPhase("login");
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [phase]);

  const handleSkip = () => {
    if (shouldShowTutorial) {
      onTutorialComplete();
    }
    onSequenceComplete();
  };

  const handleProfileSelect = (profile: "guest" | "admin") => {
    setSelectedProfile(profile);
    if (shouldShowTutorial) {
      setPhase("tutorial");
      setTutorialIndex(0);
      return;
    }
    onSequenceComplete();
  };

  const handleHintAdvance = () => {
    if (tutorialIndex < tutorialHints.length - 1) {
      setTutorialIndex((prev) => prev + 1);
      return;
    }
    onTutorialComplete();
    onSequenceComplete();
  };

  const handleHintSkip = () => {
    onTutorialComplete();
    onSequenceComplete();
  };

  const handleThemePackSelect = (packId: string) => {
    applyThemePack(packId);
  };

  const backgroundStyle = useMemo(
    () =>
      ({
        backgroundImage: `url(${wallpaperUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }) satisfies React.CSSProperties,
    [wallpaperUrl],
  );

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-slate-950 text-slate-100">
      <div className="absolute inset-0 opacity-70 transition-opacity duration-700" style={backgroundStyle} />
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-3xl" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-10 py-6 text-xs uppercase tracking-[0.25em] text-slate-400">
          <span>Portfolio OS</span>
          <button
            type="button"
            onClick={handleSkip}
            className="rounded-full border border-slate-700/60 px-4 py-1.5 text-[11px] font-semibold text-slate-200 transition hover:border-accent/60 hover:bg-accent/20 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Skip Boot
          </button>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center gap-10 px-6 pb-16">
          {phase === "splash" && (
            <div className="flex flex-col items-center gap-8 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-3 text-sm uppercase tracking-[0.6em] text-slate-400">
                  <span>Portfolio</span>
                  <span className="h-4 w-px bg-slate-700/60" aria-hidden />
                  <span>OS</span>
                </div>
                <h1 className="text-5xl font-semibold tracking-tight text-slate-50">
                  Booting <span className="text-accent-foreground">Phase II</span>
                </h1>
                <p className="max-w-xl text-sm text-slate-300">
                  Initializing cinematic desktop, loading virtual filesystem, and calibrating theme packs.
                </p>
              </div>

              <div className="flex h-1.5 w-80 items-center gap-2 rounded-full bg-slate-900/70 p-1">
                {Array.from({ length: BOOT_TICKS }).map((_, index) => (
                  <div
                    key={index}
                    className={clsx(
                      "h-1 w-full rounded-full transition-all duration-300",
                      index < tickProgress ? "bg-gradient-to-r from-accent/40 to-accent/90 shadow-sm shadow-accent/40" : "bg-slate-800/80",
                    )}
                  />
                ))}
              </div>
              <span className="text-[11px] uppercase tracking-[0.4em] text-slate-500">
                {Math.round(progress * 100)}% systems online
              </span>
            </div>
          )}

          {phase === "login" && (
            <LoginFake
              activeThemePackId={activeThemePack.id}
              skipBoot={skipBoot}
              onToggleSkipBoot={setSkipBoot}
              onSelectProfile={handleProfileSelect}
              onSelectThemePack={handleThemePackSelect}
            />
          )}

          {phase === "tutorial" && (
            <div className="flex w-full max-w-3xl flex-col gap-6 rounded-2xl border border-slate-700/60 bg-slate-900/70 p-8 shadow-2xl shadow-slate-900/40">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase tracking-[0.45em] text-slate-400">Orientation</span>
                  <h2 className="text-2xl font-semibold text-slate-100">{tutorialHints[tutorialIndex].title}</h2>
                </div>
                <button
                  type="button"
                  onClick={handleHintSkip}
                  className="rounded-full border border-slate-700/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-300 transition hover:border-accent/60 hover:bg-accent/10 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  Skip
                </button>
              </div>
              <p className="max-w-xl text-sm text-slate-300">{tutorialHints[tutorialIndex].description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {tutorialHints.map((hint, index) => (
                    <button
                      key={hint.id}
                      type="button"
                      onClick={() => setTutorialIndex(index)}
                      className={clsx(
                        "h-2.5 w-8 rounded-full transition",
                        index === tutorialIndex ? "bg-accent/80" : "bg-slate-700/50 hover:bg-slate-600/60",
                      )}
                      aria-label={`Tutorial hint ${index + 1}`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleHintAdvance}
                  className="rounded-full border border-accent/70 bg-accent/10 px-6 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-accent-foreground shadow shadow-accent/20 transition hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {tutorialIndex === tutorialHints.length - 1 ? "Enter Desktop" : "Next"}
                </button>
              </div>
            </div>
          )}
        </main>

        <footer className="flex items-center justify-between px-10 pb-8 text-[10px] uppercase tracking-[0.35em] text-slate-500">
          <span>{selectedProfile ? `Logged in as ${selectedProfile.toUpperCase()}` : "Awaiting login"}</span>
          <span>Theme Pack - {activeThemePack.name}</span>
        </footer>
      </div>
    </div>
  );
};

export default BootSequence;
