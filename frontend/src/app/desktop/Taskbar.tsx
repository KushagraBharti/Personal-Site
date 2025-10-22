import React from "react";
import { useActiveWindowId, useOrderedWindows, useWindowActions } from "../wm/hooks";
import SystemTray from "./SystemTray";

interface TaskbarProps {
  isStartOpen: boolean;
  onToggleStart: () => void;
  startButtonRef: React.RefObject<HTMLButtonElement>;
}

const Taskbar: React.FC<TaskbarProps> = ({ isStartOpen, onToggleStart, startButtonRef }) => {
  const windows = useOrderedWindows();
  const activeWindowId = useActiveWindowId();
  const { focusWindow, restoreWindow, minimizeWindow } = useWindowActions();

  const handleWindowClick = (id: string, minimized: boolean) => {
    if (minimized) {
      restoreWindow(id);
    } else {
      minimizeWindow(id);
    }
  };

  return (
    <div className="flex items-center justify-between bg-slate-900/85 px-4 py-2 backdrop-blur">
      <div className="flex items-center gap-3">
        <button
          ref={startButtonRef}
          type="button"
          onClick={onToggleStart}
          aria-pressed={isStartOpen}
          className={`pointer-events-auto flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium shadow transition ${
            isStartOpen
              ? "bg-accent/80 text-slate-900"
              : "bg-slate-700/70 text-slate-100 hover:bg-slate-600"
          }`}
        >
          <span className="text-sm font-mono leading-none" aria-hidden>
            []
          </span>
          Start
        </button>
        <div className="flex items-center gap-2">
          {windows.map((window) => (
            <button
              key={window.id}
              type="button"
              onClick={() => handleWindowClick(window.id, window.minimized)}
              onMouseDown={() => focusWindow(window.id)}
              className={`pointer-events-auto rounded-md px-3 py-1 text-xs transition ${
                window.minimized
                  ? "bg-slate-800/40 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
                  : window.id === activeWindowId
                  ? "bg-accent/25 text-accent-foreground"
                  : "bg-slate-800/70 text-slate-200 hover:bg-slate-700"
              }`}
            >
              {window.title}
            </button>
          ))}
        </div>
      </div>
      <SystemTray />
    </div>
  );
};

export default Taskbar;
