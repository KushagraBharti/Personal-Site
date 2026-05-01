import React, { useEffect, useMemo, useState } from "react";
import HomePageShell from "./HomePageShell";
import type { HomePageSectionComponent, HomePageSectionKey } from "./HomePageShell";

const sectionLoaders: Array<{
  key: HomePageSectionKey;
  load: () => Promise<{ default: HomePageSectionComponent }>;
}> = [
  { key: "about", load: () => import("../sections/about/AboutSection") },
  { key: "featured", load: () => import("../sections/featured/FeaturedSection") },
  { key: "experiences", load: () => import("../sections/experiences/ExperiencesSection") },
  { key: "projects", load: () => import("../sections/projects/ProjectsSection") },
  { key: "film", load: () => import("../sections/film/FilmSection") },
  { key: "misc", load: () => import("../sections/misc/MiscSection") },
];

const HomePage: React.FC = () => {
  const [loadedSections, setLoadedSections] = useState<
    Partial<Record<HomePageSectionKey, HomePageSectionComponent>>
  >({});

  useEffect(() => {
    let isMounted = true;

    const startEnhancements = () => {
      void import("../api/portfolioApi").then(({ prefetchPortfolioSnapshot }) => {
        if (isMounted) {
          prefetchPortfolioSnapshot();
        }
      });

      for (const section of sectionLoaders) {
        void section.load().then((module) => {
          if (!isMounted) return;
          setLoadedSections((current) => ({
            ...current,
            [section.key]: module.default,
          }));
        });
      }
    };

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(startEnhancements);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const sectionsToRender = useMemo(() => {
    const readySections: Partial<Record<HomePageSectionKey, HomePageSectionComponent>> = {};

    for (const section of sectionLoaders) {
      const Component = loadedSections[section.key];
      if (!Component) break;
      readySections[section.key] = Component;
    }

    return readySections;
  }, [loadedSections]);

  return (
    <HomePageShell enhancedSections={sectionsToRender} />
  );
};

export default HomePage;
