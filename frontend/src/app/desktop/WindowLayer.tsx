import React from "react";
import { useOrderedWindows } from "../wm/hooks";
import Window from "../../components/window/Window";
import type { WindowState } from "../wm/types";

interface WindowLayerProps {
  renderWindowContent?: (windowState: WindowState) => React.ReactNode;
}

const WindowLayer: React.FC<WindowLayerProps> = ({ renderWindowContent }) => {
  const windows = useOrderedWindows();

  if (!windows.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-sm text-slate-400">
        <p>Welcome to Portfolio OS.</p>
        <p className="text-xs text-slate-500">Open an app from the Start menu to begin.</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {windows.map((windowState) => {
        const content = renderWindowContent?.(windowState);
        return (
          <Window key={windowState.id} windowState={windowState}>
            {content}
          </Window>
        );
      })}
    </div>
  );
};

export default WindowLayer;
