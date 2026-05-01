import React, { useEffect, useMemo, useState } from "react";
import PortfolioNavbar from "../components/PortfolioNavbar";
import HeroLandingSection from "../sections/hero/HeroLandingSection";

type SectionKey = "about" | "featured" | "experiences" | "projects" | "film" | "misc";
type LoadedSection = React.ComponentType;

const sectionLoaders: Array<{
  key: SectionKey;
  load: () => Promise<{ default: LoadedSection }>;
}> = [
  { key: "about", load: () => import("../sections/about/AboutSection") },
  { key: "featured", load: () => import("../sections/featured/FeaturedSection") },
  { key: "experiences", load: () => import("../sections/experiences/ExperiencesSection") },
  { key: "projects", load: () => import("../sections/projects/ProjectsSection") },
  { key: "film", load: () => import("../sections/film/FilmSection") },
  { key: "misc", load: () => import("../sections/misc/MiscSection") },
];

const HomePage: React.FC = () => {
  const [loadedSections, setLoadedSections] = useState<Partial<Record<SectionKey, LoadedSection>>>({});

  useEffect(() => {
    let isMounted = true;

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

    return () => {
      isMounted = false;
    };
  }, []);

  const sectionsToRender = useMemo(() => {
    const readySections: Array<{ key: SectionKey; Component: LoadedSection }> = [];

    for (const section of sectionLoaders) {
      const Component = loadedSections[section.key];
      if (!Component) break;
      readySections.push({ key: section.key, Component });
    }

    return readySections;
  }, [loadedSections]);

  return (
    <div className="portfolio-overhaul-page">
      <PortfolioNavbar />
      <section id="intro">
        <HeroLandingSection />
      </section>
      {sectionsToRender.map(({ key, Component }) => (
        <section key={key} id={key}>
          <Component />
        </section>
      ))}
    </div>
  );
};

export default HomePage;
