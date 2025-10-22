export type AppId =
  | "projects"
  | "projectDetails"
  | "experience"
  | "education"
  | "about"
  | "weather"
  | "stats"
  | "settings"
  | "terminal";

export interface WindowState {
  id: string;
  appId: AppId;
  title: string;
  icon?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
  payload?: unknown;
}

export interface AppDefinition<TProps = any> {
  appId: AppId;
  title: string;
  icon?: string;
  defaultSize: { width: number; height: number };
  minSize?: { width: number; height: number };
  routes?: string[];
  mount: React.ComponentType<TProps>;
}

export interface WindowManagerState {
  windows: WindowState[];
  activeWindowId: string | null;
  zCounter: number;
}

export interface WindowCreateOptions {
  appId: AppId;
  title: string;
  icon?: string;
  size?: Partial<Pick<WindowState, "width" | "height">>;
  position?: Partial<Pick<WindowState, "x" | "y">>;
  payload?: unknown;
  bringToFront?: boolean;
  focus?: boolean;
  reuseExisting?: boolean;
  windowId?: string;
}
