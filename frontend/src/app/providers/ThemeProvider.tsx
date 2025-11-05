import { createContext, useContext, useEffect, useMemo } from "react";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { usePrefersDark } from "../../hooks/usePrefersDark";
import { loadThemePackAssets, resolveThemePack } from "../theme/ThemePackLoader";
import { getDefaultThemePack, type ThemePack } from "../theme/themePacks";

export type ThemeMode = "light" | "dark" | "system";
export type AccentPreset = "indigo" | "emerald" | "amber" | "rose" | "custom";
export type DensityPreset = "cozy" | "balanced" | "compact";

interface Preferences {
  theme: ThemeMode;
  accentPreset: AccentPreset;
  accentHue: number;
  accentSaturation: number;
  accentLightness: number;
  wallpaperId: string;
  iconPack: string;
  showDesktopIcons: boolean;
  performanceMode: boolean;
  skipBoot: boolean;
  selectedThemePack: string;
  bootHintsVersion: number;
  density: DensityPreset;
  surfaceRadius: number;
}

interface ThemeContextValue extends Preferences {
  resolvedTheme: "light" | "dark";
  wallpaperUrl: string;
  activeThemePack: ThemePack;
  setTheme: (theme: ThemeMode) => void;
  setAccent: (preset: AccentPreset) => void;
  setAccentHue: (value: number) => void;
  setAccentSaturation: (value: number) => void;
  setAccentLightness: (value: number) => void;
  setWallpaper: (wallpaperId: string) => void;
  setIconPack: (iconPack: string) => void;
  setShowDesktopIcons: (show: boolean) => void;
  setPerformanceMode: (value: boolean) => void;
  setSkipBoot: (value: boolean) => void;
  applyThemePack: (packId: string) => void;
  setSelectedThemePack: (packId: string) => void;
  setSurfaceRadius: (value: number) => void;
  setDensity: (value: DensityPreset) => void;
  setBootHintsVersion: (version: number) => void;
  resetPreferences: () => void;
}

const PREFERENCES_STORAGE_KEY = "portfolio-os::preferences";

const DEFAULT_THEME_PACK = getDefaultThemePack();

const DEFAULT_PREFERENCES: Preferences = {
  theme: "system",
  accentPreset: "custom",
  accentHue: DEFAULT_THEME_PACK.accent.hue,
  accentSaturation: DEFAULT_THEME_PACK.accent.saturation,
  accentLightness: DEFAULT_THEME_PACK.accent.lightness ?? 58,
  wallpaperId: DEFAULT_THEME_PACK.wallpaper,
  iconPack: DEFAULT_THEME_PACK.iconPack ?? "system",
  showDesktopIcons: true,
  performanceMode: false,
  skipBoot: false,
  selectedThemePack: DEFAULT_THEME_PACK.id,
  bootHintsVersion: 0,
  density: "balanced",
  surfaceRadius: 14,
};

const PRESET_ACCENTS: Record<Exclude<AccentPreset, "custom">, { hue: number; saturation: number; lightness: number }> =
  {
    indigo: { hue: 226, saturation: 76, lightness: 55 },
    emerald: { hue: 153, saturation: 72, lightness: 45 },
    amber: { hue: 36, saturation: 94, lightness: 54 },
    rose: { hue: 343, saturation: 74, lightness: 56 },
  };

const DENSITY_SCALE: Record<DensityPreset, number> = {
  cozy: 1.08,
  balanced: 1,
  compact: 0.92,
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const applyDocumentTheme = (preferences: Preferences, resolvedTheme: "light" | "dark") => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.theme = resolvedTheme;
  root.style.setProperty("--accent-h", `${preferences.accentHue}`);
  root.style.setProperty("--accent-s", `${preferences.accentSaturation}%`);
  root.style.setProperty("--accent-l", `${preferences.accentLightness}%`);
  root.style.setProperty(
    "--accent",
    `${preferences.accentHue} ${preferences.accentSaturation}% ${preferences.accentLightness}%`,
  );
  root.style.setProperty("--accent-foreground", "0 0% 100%");
  root.style.setProperty("--surface-radius", `${preferences.surfaceRadius}px`);
  root.style.setProperty("--density-scale", `${DENSITY_SCALE[preferences.density]}`);

  if (preferences.performanceMode) {
    root.dataset.performance = "reduced";
  } else {
    delete root.dataset.performance;
  }

  root.dataset.iconPack = preferences.iconPack;
  root.dataset.density = preferences.density;
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemPrefersDark = usePrefersDark();
  const [preferences, setPreferences, reset] = useLocalStorage<Preferences>(
    PREFERENCES_STORAGE_KEY,
    DEFAULT_PREFERENCES,
  );

  const resolvedTheme: "light" | "dark" =
    preferences.theme === "system"
      ? systemPrefersDark
        ? "dark"
        : "light"
      : preferences.theme;

  const activeThemePack = useMemo(
    () => resolveThemePack(preferences.selectedThemePack),
    [preferences.selectedThemePack],
  );

  const wallpaperUrl = useMemo(() => {
    return preferences.wallpaperId || activeThemePack.wallpaper;
  }, [preferences.wallpaperId, activeThemePack.wallpaper]);

  useEffect(() => {
    applyDocumentTheme(preferences, resolvedTheme);
  }, [preferences, resolvedTheme]);

  useEffect(() => {
    loadThemePackAssets(preferences.selectedThemePack).catch(() => undefined);
  }, [preferences.selectedThemePack]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      ...preferences,
      resolvedTheme,
      wallpaperUrl,
      activeThemePack,
      setTheme: (theme) =>
        setPreferences((prev) => ({
          ...prev,
          theme,
        })),
      setAccent: (preset) =>
        setPreferences((prev) => {
          if (preset === "custom") {
            return { ...prev, accentPreset: preset };
          }
          const accent = PRESET_ACCENTS[preset];
          return {
            ...prev,
            accentPreset: preset,
            accentHue: accent.hue,
            accentSaturation: accent.saturation,
            accentLightness: accent.lightness,
          };
        }),
      setAccentHue: (value) =>
        setPreferences((prev) => ({
          ...prev,
          accentPreset: "custom",
          accentHue: value,
        })),
      setAccentSaturation: (value) =>
        setPreferences((prev) => ({
          ...prev,
          accentPreset: "custom",
          accentSaturation: value,
        })),
      setAccentLightness: (value) =>
        setPreferences((prev) => ({
          ...prev,
          accentPreset: "custom",
          accentLightness: value,
        })),
      setWallpaper: (wallpaperId) =>
        setPreferences((prev) => ({
          ...prev,
          wallpaperId,
        })),
      setIconPack: (iconPack) =>
        setPreferences((prev) => ({
          ...prev,
          iconPack,
        })),
      setShowDesktopIcons: (show) =>
        setPreferences((prev) => ({
          ...prev,
          showDesktopIcons: show,
        })),
      setPerformanceMode: (value) =>
        setPreferences((prev) => ({
          ...prev,
          performanceMode: value,
        })),
      setSkipBoot: (value) =>
        setPreferences((prev) => ({
          ...prev,
          skipBoot: value,
        })),
      applyThemePack: (packId) =>
        setPreferences((prev) => {
          const pack = resolveThemePack(packId);
          return {
            ...prev,
            accentPreset: "custom",
            accentHue: pack.accent.hue,
            accentSaturation: pack.accent.saturation,
            accentLightness: pack.accent.lightness ?? prev.accentLightness,
            wallpaperId: pack.wallpaper,
            iconPack: pack.iconPack ?? prev.iconPack,
            selectedThemePack: pack.id,
          };
        }),
      setSelectedThemePack: (packId) =>
        setPreferences((prev) => {
          const pack = resolveThemePack(packId);
          return {
            ...prev,
            selectedThemePack: pack.id,
          };
        }),
      setSurfaceRadius: (value) =>
        setPreferences((prev) => ({
          ...prev,
          surfaceRadius: value,
        })),
      setDensity: (value) =>
        setPreferences((prev) => ({
          ...prev,
          density: value,
        })),
      setBootHintsVersion: (version) =>
        setPreferences((prev) => ({
          ...prev,
          bootHintsVersion: version,
        })),
      resetPreferences: () => reset(),
    }),
    [activeThemePack, preferences, reset, resolvedTheme, setPreferences, wallpaperUrl],
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
