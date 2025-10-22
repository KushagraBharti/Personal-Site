import { createContext, useContext, useEffect, useMemo } from "react";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { usePrefersDark } from "../../hooks/usePrefersDark";

export type ThemeMode = "light" | "dark" | "system";
export type Accent = "indigo" | "emerald" | "amber" | "rose";

interface Preferences {
  theme: ThemeMode;
  accent: Accent;
  wallpaper: string;
  showDesktopIcons: boolean;
  performanceMode: boolean;
}

interface ThemeContextValue extends Preferences {
  resolvedTheme: "light" | "dark";
  setTheme: (theme: ThemeMode) => void;
  setAccent: (accent: Accent) => void;
  setWallpaper: (wallpaper: string) => void;
  setShowDesktopIcons: (show: boolean) => void;
  setPerformanceMode: (value: boolean) => void;
  resetPreferences: () => void;
}

const DEFAULT_PREFERENCES: Preferences = {
  theme: "system",
  accent: "indigo",
  wallpaper: "default",
  showDesktopIcons: true,
  performanceMode: false,
};

const PREFERENCES_STORAGE_KEY = "portfolio-os::preferences";

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const applyAccentClass = (accent: Accent) => {
  const root = document.documentElement;
  root.classList.remove(
    "theme-accent-indigo",
    "theme-accent-emerald",
    "theme-accent-amber",
    "theme-accent-rose",
  );
  root.classList.add(`theme-accent-${accent}`);
};

const applyTheme = (theme: "light" | "dark") => {
  const root = document.documentElement;
  root.dataset.theme = theme;
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemPrefersDark = usePrefersDark();
  const [preferences, setPreferences, reset] = useLocalStorage<Preferences>(
    PREFERENCES_STORAGE_KEY,
    DEFAULT_PREFERENCES,
  );

  const resolvedTheme =
    preferences.theme === "system"
      ? systemPrefersDark
        ? "dark"
        : "light"
      : preferences.theme;

  useEffect(() => {
    if (typeof document === "undefined") return;
    applyTheme(resolvedTheme);
    applyAccentClass(preferences.accent);
  }, [preferences.accent, resolvedTheme]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (preferences.performanceMode) {
      document.documentElement.dataset.performance = "reduced";
    } else {
      delete document.documentElement.dataset.performance;
    }
  }, [preferences.performanceMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      ...preferences,
      resolvedTheme,
      setTheme: (theme) =>
        setPreferences((prev) => ({
          ...prev,
          theme,
        })),
      setAccent: (accent) =>
        setPreferences((prev) => ({
          ...prev,
          accent,
        })),
      setWallpaper: (wallpaper) =>
        setPreferences((prev) => ({
          ...prev,
          wallpaper,
        })),
      setShowDesktopIcons: (show) =>
        setPreferences((prev) => ({
          ...prev,
          showDesktopIcons: show,
        })),
      setPerformanceMode: (performanceMode) =>
        setPreferences((prev) => ({
          ...prev,
          performanceMode,
        })),
      resetPreferences: () => reset(),
    }),
    [preferences, resolvedTheme, reset, setPreferences],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
