import { useMemo } from "react";
import { useWindowManager } from "./store";
import type { AppId, WindowState } from "./types";

export const useWindows = () => useWindowManager((state) => state.windows);

export const useOrderedWindows = () => {
  const windows = useWindows();
  return useMemo(() => [...windows].sort((a, b) => a.z - b.z), [windows]);
};

export const useActiveWindowId = () =>
  useWindowManager((state) => state.activeWindowId);

export const useWindowById = (id: string | null) =>
  useWindowManager((state) => state.windows.find((window) => window.id === id) ?? null);

export const useWindowsByAppId = (appId: AppId) =>
  useWindowManager((state) => state.windows.filter((window) => window.appId === appId));

export const useWindowActions = () => {
  const createWindow = useWindowManager((state) => state.createWindow);
  const closeWindow = useWindowManager((state) => state.closeWindow);
  const minimizeWindow = useWindowManager((state) => state.minimizeWindow);
  const maximizeWindow = useWindowManager((state) => state.maximizeWindow);
  const restoreWindow = useWindowManager((state) => state.restoreWindow);
  const focusWindow = useWindowManager((state) => state.focusWindow);
  const updateWindow = useWindowManager((state) => state.updateWindow);
  const setPayload = useWindowManager((state) => state.setPayload);
  const closeByAppId = useWindowManager((state) => state.closeByAppId);
  const reset = useWindowManager((state) => state.reset);

  return useMemo(
    () => ({
      createWindow,
      closeWindow,
      minimizeWindow,
      maximizeWindow,
      restoreWindow,
      focusWindow,
      updateWindow,
      setPayload,
      closeByAppId,
      reset,
    }),
    [
      closeByAppId,
      closeWindow,
      createWindow,
      focusWindow,
      maximizeWindow,
      minimizeWindow,
      reset,
      restoreWindow,
      setPayload,
      updateWindow,
    ],
  );
};

export const useWindowState = (windowId: string) =>
  useWindowManager((state) => state.windows.find((window) => window.id === windowId)) as WindowState | undefined;
