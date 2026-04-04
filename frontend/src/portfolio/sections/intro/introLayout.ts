export type DesktopCardKey = "photo" | "github" | "read" | "weather" | "fact" | "latest" | "pong";

export type CardPosition = {
  x: number;
  y: number;
};

export type DesktopStageLayout = {
  stageHeight: number;
  stageWidth: number;
  hero: {
    height: number;
    width: number;
    x: number;
    y: number;
  };
  cards: Record<DesktopCardKey, CardPosition>;
};

export const DESKTOP_CARD_BASE_LAYER: Record<DesktopCardKey, number> = {
  photo: 8,
  github: 7,
  read: 6,
  weather: 5,
  fact: 4,
  latest: 3,
  pong: 2,
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const getDesktopStageLayout = (
  viewportWidth: number,
  viewportHeight: number
): DesktopStageLayout => {
  const stageWidth = Math.max(viewportWidth - 48, 1180);
  const stageHeight = Math.max(viewportHeight - 64, 700);

  let heroWidth: number;
  if (stageWidth >= 1650) heroWidth = 560;
  else if (stageWidth >= 1480) heroWidth = 530;
  else if (stageWidth >= 1260) heroWidth = 510;
  else heroWidth = 480;

  const heroHeight = 360;
  const heroX = Math.round((stageWidth - heroWidth) / 2);
  const heroY = Math.round((stageHeight - heroHeight) / 2) - 20;

  const L = heroX;
  const R = stageWidth - heroX - heroWidth;
  const T = heroY;
  const B = stageHeight - heroY - heroHeight;
  const E = 16;

  const cards = {
    photo: {
      x: clamp(Math.round(L * 0.28), E, heroX - 260),
      y: clamp(Math.round(T * 0.12), E, heroY - 40),
    },
    read: {
      x: clamp(Math.round(heroX + heroWidth * 0.3), E, stageWidth - 252),
      y: clamp(Math.round(T * 0.1), E, heroY - 30),
    },
    weather: {
      x: clamp(
        Math.round(heroX + heroWidth + R * 0.42),
        heroX + heroWidth + 20,
        stageWidth - 252
      ),
      y: clamp(Math.round(heroY - T * 0.1), E, stageHeight - 120),
    },
    fact: {
      x: clamp(
        Math.round(heroX + heroWidth + R * 0.48),
        heroX + heroWidth + 20,
        stageWidth - 272
      ),
      y: clamp(Math.round(heroY + heroHeight * 0.5), heroY + 60, stageHeight - 140),
    },
    github: {
      x: clamp(Math.round(L * 0.22), E, heroX - 200),
      y: clamp(
        Math.round(heroY + heroHeight + B * 0.18),
        heroY + heroHeight * 0.65,
        stageHeight - 120
      ),
    },
    latest: {
      x: clamp(Math.round(heroX + heroWidth * 0.06), E, stageWidth - 272),
      y: clamp(
        Math.round(heroY + heroHeight + B * 0.52),
        heroY + heroHeight + 20,
        stageHeight - 140
      ),
    },
    pong: {
      x: clamp(
        Math.round(heroX + heroWidth + R * 0.08),
        heroX + heroWidth - 80,
        stageWidth - 352
      ),
      y: clamp(
        Math.round(heroY + heroHeight + B * 0.12),
        heroY + heroHeight - 80,
        stageHeight - 292
      ),
    },
  } satisfies Record<DesktopCardKey, CardPosition>;

  return {
    stageWidth,
    stageHeight,
    hero: { width: heroWidth, height: heroHeight, x: heroX, y: heroY },
    cards,
  };
};
