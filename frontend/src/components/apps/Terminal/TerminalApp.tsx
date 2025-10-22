import clsx from "clsx";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { appRegistry } from "../../../app/routes/appRegistry";
import { useTheme } from "../../../app/providers/ThemeProvider";
import { useWindowActions } from "../../../app/wm/hooks";
import type { AppId } from "../../../app/wm/types";
import { useProjectsQuery } from "../../../hooks/usePortfolioQueries";
import { toSlug } from "../../../lib/utils";

interface TerminalEntry {
  type: "command" | "output" | "system";
  text: string;
}

const appCommands: Array<{ id: AppId; label: string }> = [
  { id: "projects", label: "Projects" },
  { id: "experience", label: "Experience" },
  { id: "education", label: "Education" },
  { id: "about", label: "About" },
  { id: "weather", label: "Weather" },
  { id: "stats", label: "Stats" },
  { id: "settings", label: "Settings" },
  { id: "terminal", label: "Terminal" },
];

const wallpaperCycle = ["default", "aurora", "galaxy"] as const;

const TerminalApp: React.FC = () => {
  const { createWindow } = useWindowActions();
  const { data: projectsData } = useProjectsQuery();
  const { theme, setTheme, wallpaper, setWallpaper, setAccent } = useTheme();

  const [inputValue, setInputValue] = useState("");
  const [history, setHistory] = useState<TerminalEntry[]>([
    { type: "system", text: "Portfolio OS shell ready. Type 'help' to get started." },
  ]);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const projects = useMemo(
    () =>
      (projectsData ?? []).map((project) => ({
        ...project,
        slug: toSlug(project.title),
      })),
    [projectsData],
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const appendEntries = (entries: TerminalEntry[]) => {
    setHistory((prev) => [...prev, ...entries]);
  };

  const handleOpenApp = (appId: AppId) => {
    const definition = appRegistry.get(appId);
    createWindow({
      appId,
      title: definition?.title ?? appId,
      icon: definition?.icon,
      size: definition?.defaultSize,
      windowId: definition?.appId ?? appId,
      reuseExisting: true,
    });
  };

  const handleCommand = (commandRaw: string) => {
    const command = commandRaw.trim();
    if (!command) return;

    appendEntries([{ type: "command", text: `> ${command}` }]);

    const [primary, secondary, ...rest] = command.toLowerCase().split(" ");

    if (primary === "help") {
      appendEntries([
        { type: "output", text: "Available commands:" },
        { type: "output", text: "  help" },
        { type: "output", text: "  projects" },
        { type: "output", text: "  open <app>" },
        { type: "output", text: "  open project <slug>" },
        { type: "output", text: "  theme <light|dark|system>" },
        { type: "output", text: "  accent <indigo|emerald|amber|rose>" },
        { type: "output", text: "  wallpaper next" },
        { type: "output", text: "  wallpaper <default|aurora|galaxy>" },
        { type: "output", text: "  resume" },
        { type: "output", text: "  about" },
        { type: "output", text: "  credits" },
        { type: "output", text: "  clear" },
      ]);
      return;
    }

    if (primary === "clear") {
      setHistory([]);
      return;
    }

    if (primary === "projects") {
      if (!projects.length) {
        appendEntries([{ type: "output", text: "No projects loaded yet." }]);
        return;
      }
      appendEntries([
        { type: "output", text: "Projects:" },
        ...projects.map((project) => ({
          type: "output" as const,
          text: `  ${project.slug} — ${project.title}`,
        })),
      ]);
      return;
    }

    if (primary === "open" && secondary) {
      if (secondary === "project") {
        const slug = rest[0];
        if (!slug) {
          appendEntries([{ type: "output", text: "Usage: open project <slug>" }]);
          return;
        }
        const project = projects.find((item) => item.slug === slug);
        if (!project) {
          appendEntries([{ type: "output", text: `Unknown project: ${slug}` }]);
          return;
        }
        handleOpenApp("projects");
        createWindow({
          appId: "projectDetails",
          title: project.title,
          icon: "[DOC]",
          size: { width: 760, height: 560 },
          payload: { projectId: project.slug },
          windowId: `projectDetails:${project.slug}`,
          reuseExisting: true,
        });
        return;
      }
      const targetApp = appCommands.find((app) => app.label.toLowerCase() === secondary);
      if (!targetApp) {
        appendEntries([{ type: "output", text: `Unknown app: ${secondary}` }]);
        return;
      }
      handleOpenApp(targetApp.id);
      return;
    }

    if (primary === "theme" && secondary) {
      if (["light", "dark", "system"].includes(secondary)) {
        setTheme(secondary as typeof theme);
        appendEntries([{ type: "output", text: `Theme set to ${secondary}` }]);
      } else {
        appendEntries([{ type: "output", text: "Unknown theme. Use light, dark, or system." }]);
      }
      return;
    }

    if (primary === "accent" && secondary) {
      if (["indigo", "emerald", "amber", "rose"].includes(secondary)) {
        setAccent(secondary as any);
        appendEntries([{ type: "output", text: `Accent set to ${secondary}` }]);
      } else {
        appendEntries([{ type: "output", text: "Unknown accent. Try indigo, emerald, amber, rose." }]);
      }
      return;
    }

    if (primary === "wallpaper") {
      if (secondary === "next") {
        const currentIndex = wallpaperCycle.indexOf(wallpaper as (typeof wallpaperCycle)[number]);
        const next = wallpaperCycle[(currentIndex + 1) % wallpaperCycle.length];
        setWallpaper(next);
        appendEntries([{ type: "output", text: `Wallpaper set to ${next}` }]);
        return;
      }
      if (secondary && wallpaperCycle.includes(secondary as (typeof wallpaperCycle)[number])) {
        setWallpaper(secondary as (typeof wallpaperCycle)[number]);
        appendEntries([{ type: "output", text: `Wallpaper set to ${secondary}` }]);
        return;
      }
      appendEntries([{ type: "output", text: "Usage: wallpaper next | wallpaper <default|aurora|galaxy>" }]);
      return;
    }

    if (primary === "resume") {
      window.open("https://drive.google.com", "_blank");
      appendEntries([{ type: "output", text: "Opening resume..." }]);
      return;
    }

    if (primary === "credits") {
      appendEntries([
        { type: "output", text: "Portfolio OS crafted by Kushagra Bharti." },
        { type: "output", text: "Frontend: React, Zustand, Tailwind." },
        { type: "output", text: "Backend: Node + Express." },
      ]);
      return;
    }

    if (primary === "about") {
      appendEntries([
        { type: "output", text: "Software engineer. Builder. Explorer." },
        { type: "output", text: "Working across ML, full-stack, and playful UX." },
      ]);
      return;
    }

    appendEntries([{ type: "output", text: `Command not recognized: ${command}` }]);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const command = inputValue.trim();
    setInputValue("");
    handleCommand(command);
  };

  return (
    <div className="flex h-full flex-col bg-slate-950/90 text-xs text-slate-200">
      <div ref={scrollRef} className="flex-1 overflow-auto p-4 font-mono leading-relaxed">
        {history.map((entry, index) => (
          <div
            key={index}
            className={clsx(
              entry.type === "command" ? "text-slate-100" : "text-slate-300",
              entry.type === "system" && "text-accent-foreground",
            )}
          >
            {entry.text}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="border-t border-slate-800/60 bg-slate-900/80 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">$</span>
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            className="flex-1 bg-transparent text-slate-100 outline-none"
            autoComplete="off"
          />
        </div>
      </form>
    </div>
  );
};

export default TerminalApp;
