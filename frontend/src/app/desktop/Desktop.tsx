import React, { useEffect, useMemo, useRef, useState } from "react";
import { useHotkeys } from "../../hooks/useHotkeys";
import { useTheme } from "../providers/ThemeProvider";
import StartMenu from "./StartMenu";
import DesktopIcons from "./DesktopIcons";
import Taskbar from "./Taskbar";
import WindowLayer from "./WindowLayer";
import { appRegistry } from "../routes/appRegistry";
import { useActiveWindowId, useOrderedWindows, useWindowActions } from "../wm/hooks";
import type { WindowState } from "../wm/types";

const wallpapers: Record<string, string> = {
  default:
    "radial-gradient(circle at 20% 20%, rgba(96, 165, 250, 0.4), transparent 55%), radial-gradient(circle at 80% 10%, rgba(192, 132, 252, 0.45), transparent 50%), linear-gradient(135deg, #0f172a 0%, #1e293b 45%, #020617 100%)",
  aurora:
    "linear-gradient(120deg, rgba(34, 197, 94, 0.35), transparent), linear-gradient(200deg, rgba(59, 130, 246, 0.4), transparent), radial-gradient(circle at 10% 80%, rgba(96, 165, 250, 0.35), transparent 60%), #020617",
  galaxy:
    "radial-gradient(circle at 50% 0%, rgba(186, 230, 253, 0.3), transparent 55%), radial-gradient(circle at 100% 80%, rgba(244, 114, 182, 0.3), transparent 55%), linear-gradient(180deg, #0b1120 0%, #1e1b4b 100%)",
};

const Desktop: React.FC = () => {
  const { wallpaper } = useTheme();
  const [isStartOpen, setIsStartOpen] = useState(false);
  const startMenuRef = useRef<HTMLDivElement | null>(null);
  const startButtonRef = useRef<HTMLButtonElement | null>(null);
  const windows = useOrderedWindows();
  const activeWindowId = useActiveWindowId();
  const { focusWindow, closeWindow, createWindow } = useWindowActions();

  const wallpaperStyle = useMemo(() => {
    const background = wallpapers[wallpaper] ?? wallpapers.default;
    return { background };
  }, [wallpaper]);

  useEffect(() => {
    if (!isStartOpen) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (startMenuRef.current?.contains(target) || startButtonRef.current?.contains(target)) {
        return;
      }
      setIsStartOpen(false);
    };
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [isStartOpen]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsStartOpen(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useHotkeys(
    [
      {
        combo: "ctrl+tab",
        preventDefault: true,
        handler: () => {
          if (windows.length === 0) return;
          const currentIndex = windows.findIndex((window) => window.id === activeWindowId);
          const nextWindow = windows[(currentIndex + 1) % windows.length];
          if (nextWindow) {
            focusWindow(nextWindow.id);
          }
        },
      },
      {
        combo: "ctrl+w",
        preventDefault: true,
        handler: () => {
          if (activeWindowId) {
            closeWindow(activeWindowId);
          }
        },
      },
      {
        combo: "meta+space",
        preventDefault: true,
        handler: () => setIsStartOpen((prev) => !prev),
      },
      {
        combo: "meta+t",
        preventDefault: true,
        handler: () => {
          setIsStartOpen(false);
          createWindow({
            appId: "terminal",
            title: "Terminal",
            icon: "[TERM]",
            size: { width: 640, height: 320 },
            windowId: "terminal",
            reuseExisting: true,
          });
        },
      },
    ],
    [windows, activeWindowId, focusWindow, closeWindow, createWindow],
  );

  return (
    <div className="relative min-h-screen w-full overflow-hidden text-slate-100">
      <div
        aria-hidden
        className="absolute inset-0 transition-all duration-500 ease-out"
        style={wallpaperStyle}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_55%)] mix-blend-screen" />

      <div className="relative z-10 flex h-screen w-full flex-col">
        <div className="relative flex-1 overflow-hidden">
          <DesktopIcons />
          <WindowLayer
            renderWindowContent={(windowState: WindowState) => {
              const definition = appRegistry.get(windowState.appId);
              if (!definition) return null;
              const Component = definition.mount as React.ComponentType<any>;
              return <Component windowState={windowState} payload={windowState.payload} />;
            }}
          />
        </div>
        <Taskbar
          isStartOpen={isStartOpen}
          onToggleStart={() => setIsStartOpen((prev) => !prev)}
          startButtonRef={startButtonRef}
        />
        <StartMenu ref={startMenuRef} open={isStartOpen} onClose={() => setIsStartOpen(false)} />
      </div>
    </div>
  );
};

export default Desktop;

