import React from "react";
import { useTheme } from "../providers/ThemeProvider";
import { useWindowActions } from "../wm/hooks";
import { appRegistry } from "../routes/appRegistry";
import type { AppId } from "../wm/types";

const ICONS: AppId[] = ["projects", "experience", "education", "terminal", "settings"];

const DesktopIcons: React.FC = () => {
  const { showDesktopIcons } = useTheme();
  const { createWindow } = useWindowActions();

  if (!showDesktopIcons) return null;

  const handleOpen = (appId: AppId) => {
    const definition = appRegistry.get(appId);
    if (!definition) return;
    createWindow({
      appId: definition.appId,
      title: definition.title,
      icon: definition.icon,
      size: definition.defaultSize,
      windowId: definition.appId,
      reuseExisting: true,
    });
  };

  return (
    <div className="pointer-events-none absolute inset-0 p-6">
      <div className="pointer-events-auto grid max-w-xs gap-6 text-xs text-slate-100">
        {ICONS.map((appId) => {
          const definition = appRegistry.get(appId);
          if (!definition) return null;
          return (
            <button
              key={appId}
              type="button"
              className="flex w-20 flex-col items-center gap-2 rounded-lg bg-slate-900/20 p-3 text-center text-[11px] font-medium text-slate-100 transition hover:bg-slate-900/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              onClick={() => handleOpen(appId)}
            >
              <span className="grid h-10 w-10 place-items-center rounded-md bg-slate-900/60 text-[10px] font-mono uppercase text-slate-300">
                {definition.icon}
              </span>
              <span className="leading-tight">{definition.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DesktopIcons;
