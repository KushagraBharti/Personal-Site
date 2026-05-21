import React, { useEffect, useMemo, useState } from "react";
import HomePageShell from "./HomePageShell";
import type {
  HomePageSectionComponent,
  HomePageSectionKey,
} from "./HomePageShell";
import { scheduleIdle } from "../../shared/lib/scheduleIdle";

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

const SECTION_LOAD_ROOT_MARGIN = "160px 0px";

const loadPortfolioSnapshotWhenIdle = () =>
  import("../api/portfolioApi").then(({ prefetchPortfolioSnapshot }) => {
    prefetchPortfolioSnapshot();
  });

const HomePage: React.FC = () => {
  const [loadedSections, setLoadedSections] = useState<
    Partial<Record<HomePageSectionKey, HomePageSectionComponent>>
  >({});

  useEffect(() => {
    let isMounted = true;
    const loadedKeys = new Set<HomePageSectionKey>();

    const loadSection = (key: HomePageSectionKey) => {
      if (loadedKeys.has(key)) return;

      const section = sectionLoaders.find((candidate) => candidate.key === key);
      if (!section) return;

      loadedKeys.add(key);
      void section.load().then((module) => {
        if (!isMounted) return;
        setLoadedSections((current) => ({
          ...current,
          [section.key]: module.default,
        }));
      });
    };

    const cancelSnapshotPrefetch = scheduleIdle(() => {
      void loadPortfolioSnapshotWhenIdle().catch(() => {
        // Generated bootstrap data keeps the portfolio renderable when the API is unavailable.
      });
    }, 2200);

    if (typeof IntersectionObserver === "undefined") {
      const cancelFallback = scheduleIdle(() => {
        sectionLoaders.forEach((section) => loadSection(section.key));
      }, 1800);

      return () => {
        isMounted = false;
        cancelSnapshotPrefetch();
        cancelFallback();
      };
    }

    let observer: IntersectionObserver | null = null;
    let hasStartedSectionObservers = false;

    const startSectionObservers = () => {
      if (hasStartedSectionObservers) return;
      hasStartedSectionObservers = true;

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const key = (entry.target as HTMLElement).dataset
              .shellSection as HomePageSectionKey | undefined;
            if (!key) return;

            loadSection(key);
            observer?.unobserve(entry.target);
          });
        },
        { rootMargin: SECTION_LOAD_ROOT_MARGIN },
      );

      sectionLoaders.forEach((section) => {
        const element = document.querySelector(
          `[data-shell-section="${section.key}"]`,
        );
        if (element) {
          observer?.observe(element);
        }
      });
    };

    if (window.location.hash && window.location.hash !== "#top") {
      startSectionObservers();
    } else {
      window.addEventListener("scroll", startSectionObservers, {
        once: true,
        passive: true,
      });
      window.addEventListener("hashchange", startSectionObservers, {
        once: true,
      });
    }

    return () => {
      isMounted = false;
      cancelSnapshotPrefetch();
      window.removeEventListener("scroll", startSectionObservers);
      window.removeEventListener("hashchange", startSectionObservers);
      observer?.disconnect();
    };
  }, []);

  const sectionsToRender = useMemo(() => {
    return loadedSections;
  }, [loadedSections]);

  return <HomePageShell enhancedSections={sectionsToRender} />;
};

export default HomePage;
