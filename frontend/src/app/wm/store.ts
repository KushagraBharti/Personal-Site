import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { produce } from "immer";
import type {
  AppId,
  WindowCreateOptions,
  WindowManagerState,
  WindowState,
} from "./types";

const STORAGE_KEY = "portfolio-os::windows";

interface WindowManagerActions {
  createWindow: (options: WindowCreateOptions) => WindowState;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  updateWindow: (id: string, updater: Partial<WindowState>) => void;
  setPayload: (id: string, payload: unknown) => void;
  closeByAppId: (appId: AppId) => void;
  reset: () => void;
}

export type WindowManagerStore = WindowManagerState & WindowManagerActions;

const ensureMaxZ = (windows: WindowState[], zCounter: number) => {
  if (!windows.length) {
    return { zCounter: 1, maxZ: 1 };
  }
  const maxZ = Math.max(...windows.map((window) => window.z));
  return { zCounter: Math.max(zCounter, maxZ), maxZ };
};

const createWindowState = (
  options: WindowCreateOptions,
  state: WindowManagerState,
): WindowState => {
  const { zCounter } = ensureMaxZ(state.windows, state.zCounter);
  return {
    id: options.windowId ?? crypto.randomUUID(),
    appId: options.appId,
    title: options.title,
    icon: options.icon,
    x: options.position?.x ?? Math.max(24, 120 + state.windows.length * 24),
    y: options.position?.y ?? Math.max(24, 120 + state.windows.length * 16),
    width: options.size?.width ?? 640,
    height: options.size?.height ?? 420,
    z: zCounter + 1,
    minimized: false,
    maximized: false,
    payload: options.payload,
  };
};

export const useWindowManager = create<WindowManagerStore>()(
  persist(
    (set, get) => ({
      windows: [],
      activeWindowId: null,
      zCounter: 1,
      createWindow: (options) => {
        const state = get();
        const byId = options.windowId
          ? state.windows.find((window) => window.id === options.windowId)
          : undefined;
        const fallback = state.windows.find((window) => window.appId === options.appId);

        if (options.reuseExisting && (byId || fallback)) {
          const target = byId ?? fallback;
          if (target) {
            set(
              produce<WindowManagerStore>((draft) => {
                const { zCounter } = ensureMaxZ(draft.windows, draft.zCounter);
                draft.zCounter = zCounter + 1;
                const existingWindow = draft.windows.find((window) => window.id === target.id);
                if (!existingWindow) return;
                existingWindow.z = draft.zCounter;
                existingWindow.minimized = false;
                if (options.payload !== undefined) {
                  existingWindow.payload = options.payload;
                }
                draft.activeWindowId = existingWindow.id;
              }),
            );
            return target;
          }
        }

        const newWindow = createWindowState(options, state);
        set(
          produce<WindowManagerStore>((draft) => {
            draft.windows.push(newWindow);
            draft.zCounter = newWindow.z;
            draft.activeWindowId = options.focus !== false ? newWindow.id : draft.activeWindowId;
          }),
        );
        return newWindow;
      },
      closeWindow: (id) => {
        set(
          produce<WindowManagerStore>((draft) => {
            draft.windows = draft.windows.filter((window) => window.id !== id);
            if (draft.activeWindowId === id) {
              draft.activeWindowId = draft.windows.at(-1)?.id ?? null;
            }
            const { zCounter } = ensureMaxZ(draft.windows, draft.zCounter);
            draft.zCounter = zCounter;
          }),
        );
      },
      minimizeWindow: (id) => {
        set(
          produce<WindowManagerStore>((draft) => {
            const target = draft.windows.find((window) => window.id === id);
            if (!target) return;
            target.minimized = true;
            target.maximized = false;
            if (draft.activeWindowId === id) {
              draft.activeWindowId = null;
            }
          }),
        );
      },
      maximizeWindow: (id) => {
        set(
          produce<WindowManagerStore>((draft) => {
            const target = draft.windows.find((window) => window.id === id);
            if (!target) return;
            target.maximized = true;
            target.minimized = false;
            draft.activeWindowId = id;
            const { zCounter } = ensureMaxZ(draft.windows, draft.zCounter);
            draft.zCounter = zCounter + 1;
            target.z = draft.zCounter;
          }),
        );
      },
      restoreWindow: (id) => {
        set(
          produce<WindowManagerStore>((draft) => {
            const target = draft.windows.find((window) => window.id === id);
            if (!target) return;
            target.minimized = false;
            target.maximized = false;
            draft.activeWindowId = id;
            const { zCounter } = ensureMaxZ(draft.windows, draft.zCounter);
            draft.zCounter = zCounter + 1;
            target.z = draft.zCounter;
          }),
        );
      },
      focusWindow: (id) => {
        set(
          produce<WindowManagerStore>((draft) => {
            const target = draft.windows.find((window) => window.id === id);
            if (!target) return;
            const { zCounter } = ensureMaxZ(draft.windows, draft.zCounter);
            draft.zCounter = zCounter + 1;
            target.z = draft.zCounter;
            target.minimized = false;
            draft.activeWindowId = id;
          }),
        );
      },
      updateWindow: (id, updater) => {
        set(
          produce<WindowManagerStore>((draft) => {
            const target = draft.windows.find((window) => window.id === id);
            if (!target) return;
            Object.assign(target, updater);
          }),
        );
      },
      setPayload: (id, payload) => {
        set(
          produce<WindowManagerStore>((draft) => {
            const target = draft.windows.find((window) => window.id === id);
            if (!target) return;
            target.payload = payload;
          }),
        );
      },
      closeByAppId: (appId) => {
        set(
          produce<WindowManagerStore>((draft) => {
            draft.windows = draft.windows.filter((window) => window.appId !== appId);
            if (draft.activeWindowId && !draft.windows.find((w) => w.id === draft.activeWindowId)) {
              draft.activeWindowId = draft.windows.at(-1)?.id ?? null;
            }
            const { zCounter } = ensureMaxZ(draft.windows, draft.zCounter);
            draft.zCounter = zCounter;
          }),
        );
      },
      reset: () => {
        set(() => ({
          windows: [],
          activeWindowId: null,
          zCounter: 1,
        }));
      },
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      partialize: (state) => ({
        windows: state.windows.map((window) => ({
          ...window,
          minimized: false,
          maximized: false,
        })),
        zCounter: state.zCounter,
      }),
      storage: createJSONStorage(() => localStorage),
      skipHydration: false,
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.windows = state.windows.filter((window) => window.appId !== "projectDetails");
        const { zCounter } = ensureMaxZ(state.windows, state.zCounter);
        state.zCounter = zCounter;
        state.activeWindowId = null;
      },
    },
  ),
);
