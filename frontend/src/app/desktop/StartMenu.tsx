import { forwardRef, useMemo } from "react";
import { appDefinitions } from "../routes/appRegistry";
import { useWindowActions } from "../wm/hooks";

interface StartMenuProps {
  open: boolean;
  onClose: () => void;
}

const StartMenu = forwardRef<HTMLDivElement, StartMenuProps>(({ open, onClose }, ref) => {
  const { createWindow } = useWindowActions();
  const menuApps = useMemo(
    () => appDefinitions.filter((app) => app.appId !== "projectDetails"),
    [],
  );

  if (!open) return null;

  const handleLaunch = (appId: string) => {
    const definition = menuApps.find((app) => app.appId === appId);
    if (!definition) return;
    createWindow({
      appId: definition.appId,
      title: definition.title,
      icon: definition.icon,
      size: definition.defaultSize,
      windowId: definition.appId,
      reuseExisting: true,
    });
    onClose();
  };

  return (
    <div
      ref={ref}
      className="pointer-events-auto absolute bottom-16 left-4 w-[22rem] max-w-sm rounded-2xl border border-slate-700/50 bg-slate-900/90 p-4 text-slate-200 shadow-xl backdrop-blur-lg"
    >
      <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Apps
      </div>
      <div className="grid grid-cols-2 gap-2">
        {menuApps.map((app) => (
          <button
            key={app.appId}
            type="button"
            className="flex h-16 flex-col justify-center rounded-lg bg-slate-800/60 px-3 text-left text-sm transition hover:bg-slate-700/80"
            onClick={() => handleLaunch(app.appId)}
          >
            <span className="text-[10px] font-mono uppercase text-slate-400">{app.icon}</span>
            <span className="mt-1 font-medium text-slate-100">{app.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
});

StartMenu.displayName = "StartMenu";

export default StartMenu;
