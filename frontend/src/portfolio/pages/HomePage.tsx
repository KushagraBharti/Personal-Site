import React, { useEffect, useMemo, useState } from "react";
import HomePageShell from "./HomePageShell";
import type {
  HomePageSectionComponent,
  HomePageSectionKey,
} from "./HomePageShell";

const sectionLoaders: Array<{
  key: HomePageSectionKey;
  load: () => Promise<{ default: HomePageSectionComponent }>;
}> = [
  { key: "about", load: () => import("../sections/about/AboutSection") },
  {
    key: "featured",
    load: () => import("../sections/featured/FeaturedSection"),
  },
  {
    key: "experiences",
    load: () => import("../sections/experiences/ExperiencesSection"),
  },
  {
    key: "projects",
    load: () => import("../sections/projects/ProjectsSection"),
  },
  { key: "film", load: () => import("../sections/film/FilmSection") },
  { key: "misc", load: () => import("../sections/misc/MiscSection") },
];

const HERO_MEDIA_KICKED_EVENT = "portfolio:hero-media-kicked";
const SECTION_START_DELAY_MS = 160;
const SECTION_IMPORT_STAGGER_MS = 90;
const SECTION_FALLBACK_DELAY_MS = 900;

const HomePage: React.FC = () => {
  const [loadedSections, setLoadedSections] = useState<
    Partial<Record<HomePageSectionKey, HomePageSectionComponent>>
  >({});

  useEffect(() => {
    let isMounted = true;
    let hasStarted = false;
    const timeoutIds: number[] = [];

    const startEnhancements = () => {
      if (hasStarted) return;
      hasStarted = true;

      timeoutIds.push(
        window.setTimeout(() => {
          if (!isMounted) return;

          void import("../api/portfolioApi").then(
            ({ prefetchPortfolioSnapshot }) => {
              if (isMounted) {
                prefetchPortfolioSnapshot();
              }
            },
          );

          sectionLoaders.forEach((section, index) => {
            timeoutIds.push(
              window.setTimeout(() => {
                void section.load().then((module) => {
                  if (!isMounted) return;
                  setLoadedSections((current) => ({
                    ...current,
                    [section.key]: module.default,
                  }));
                });
              }, index * SECTION_IMPORT_STAGGER_MS),
            );
          });
        }, SECTION_START_DELAY_MS),
      );
    };

    window.addEventListener(HERO_MEDIA_KICKED_EVENT, startEnhancements, {
      once: true,
    });
    timeoutIds.push(
      window.setTimeout(startEnhancements, SECTION_FALLBACK_DELAY_MS),
    );

    return () => {
      isMounted = false;
      window.removeEventListener(HERO_MEDIA_KICKED_EVENT, startEnhancements);
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, []);

  const sectionsToRender = useMemo(() => {
    const readySections: Partial<
      Record<HomePageSectionKey, HomePageSectionComponent>
    > = {};

    for (const section of sectionLoaders) {
      const Component = loadedSections[section.key];
      if (!Component) break;
      readySections[section.key] = Component;
    }

    return readySections;
  }, [loadedSections]);

  return <HomePageShell enhancedSections={sectionsToRender} />;
};

export default HomePage;
