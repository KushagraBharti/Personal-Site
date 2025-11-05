import { getThemePackById, getDefaultThemePack, type ThemePack } from "./themePacks";

const loadedWallpapers = new Set<string>();

const preloadImage = (src: string) =>
  new Promise<void>((resolve, reject) => {
    if (!src) {
      resolve();
      return;
    }
    if (loadedWallpapers.has(src)) {
      resolve();
      return;
    }
    const image = new Image();
    image.onload = () => {
      loadedWallpapers.add(src);
      resolve();
    };
    image.onerror = () => reject(new Error(`Failed to preload wallpaper: ${src}`));
    image.src = src;
  });

export const resolveThemePack = (id?: string | null): ThemePack => {
  if (!id) return getDefaultThemePack();
  return getThemePackById(id) ?? getDefaultThemePack();
};

export const loadThemePackAssets = async (id?: string | null) => {
  const pack = resolveThemePack(id);
  await Promise.allSettled([preloadImage(pack.wallpaper)]);
  return pack;
};
