import React from "react";
import { useWindowActions } from "../../app/wm/hooks";
import type { WindowState } from "../../app/wm/types";

interface TitleBarProps {
  windowState: WindowState;
  onDragStart?: (event: React.PointerEvent<HTMLDivElement>) => void;
}

const TitleBar: React.FC<TitleBarProps> = ({ windowState, onDragStart }) => {
  const { minimizeWindow, maximizeWindow, restoreWindow, closeWindow } = useWindowActions();

  const toggleMaximize = () => {
    if (windowState.maximized) {
      restoreWindow(windowState.id);
    } else {
      maximizeWindow(windowState.id);
    }
  };

  return (
    <div
      className="flex cursor-move select-none items-center justify-between rounded-t-xl bg-slate-900/80 px-3 py-1.5 text-xs"
      onDoubleClick={toggleMaximize}
      onPointerDown={onDragStart}
    >
      <div className="flex items-center gap-2 font-semibold tracking-wide text-slate-100/90">
        {windowState.icon && <span aria-hidden>{windowState.icon}</span>}
        <span>{windowState.title}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="grid h-6 w-6 place-items-center rounded bg-slate-700/70 text-[11px] text-slate-100 transition hover:bg-slate-600/80"
          onClick={() => minimizeWindow(windowState.id)}
          aria-label="Minimize window"
        >
          -
        </button>
        <button
          type="button"
          className="grid h-6 w-6 place-items-center rounded bg-slate-700/70 text-[11px] text-slate-100 transition hover:bg-slate-600/80"
          onClick={toggleMaximize}
          aria-label={windowState.maximized ? "Restore window" : "Maximize window"}
        >
          {windowState.maximized ? "[]" : "[ ]"}
        </button>
        <button
          type="button"
          className="grid h-6 w-6 place-items-center rounded bg-rose-500/90 text-xs text-white transition hover:bg-rose-500"
          onClick={() => closeWindow(windowState.id)}
          aria-label="Close window"
        >
          X
        </button>
      </div>
    </div>
  );
};

export default TitleBar;
