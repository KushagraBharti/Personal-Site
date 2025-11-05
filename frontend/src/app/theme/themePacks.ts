export interface ThemePack {
  id: string;
  name: string;
  author?: string;
  accent: {
    hue: number;
    saturation: number;
    lightness?: number;
  };
  wallpaper: string;
  iconPack?: string;
  description?: string;
}

export const themePacks: ThemePack[] = [
  {
    id: "default-nebula",
    name: "Nebula Core",
    author: "Portfolio OS",
    accent: { hue: 226, saturation: 78, lightness: 58 },
    wallpaper: "/assets/wallpapers/default-nebula.svg",
    iconPack: "system",
    description: "Signature deep space gradient with electric violets.",
  },
  {
    id: "aurora-veil",
    name: "Aurora Veil",
    author: "Portfolio OS",
    accent: { hue: 160, saturation: 62, lightness: 54 },
    wallpaper: "/assets/wallpapers/aurora-veil.svg",
    iconPack: "luminous",
    description: "Emerald aurora curtains and cool glacial glow.",
  },
  {
    id: "noir-grid",
    name: "Noir Grid",
    author: "Portfolio OS",
    accent: { hue: 32, saturation: 85, lightness: 56 },
    wallpaper: "/assets/wallpapers/noir-grid.svg",
    iconPack: "mono",
    description: "Midnight productivity with soft neon hotspots.",
  },
];

export const getThemePackById = (id: string) => themePacks.find((pack) => pack.id === id);
export const getDefaultThemePack = () => themePacks[0];
