import React, { Suspense, useEffect } from "react";
import SectionSidebar from "../components/SectionSidebar";
import GlassCard from "../../shared/components/ui/GlassCard";
import IntroSection from "../sections/intro/IntroSection";
import { prefetchPortfolioSnapshot } from "../api/portfolioApi";

const About = React.lazy(() => import("../sections/about/AboutSection"));
const Education = React.lazy(() => import("../sections/education/EducationSection"));
const Experiences = React.lazy(() => import("../sections/experiences/ExperiencesSection"));
const Projects = React.lazy(() => import("../sections/projects/ProjectsSection"));

const sectionPrefetchers = [
  () => import("../sections/about/AboutSection"),
  () => import("../sections/education/EducationSection"),
  () => import("../sections/experiences/ExperiencesSection"),
  () => import("../sections/projects/ProjectsSection"),
];

const SectionFallback: React.FC<{ title: string }> = ({ title }) => (
  <div className="container mx-auto max-w-screen-xl px-4 md:px-16 py-10">
    <GlassCard className="p-6 animate-pulse text-gray-200">
      <div className="h-6 w-40 bg-white/30 rounded mb-4" />
      <div className="space-y-2">
        <div className="h-3 w-full bg-white/10 rounded" />
        <div className="h-3 w-5/6 bg-white/10 rounded" />
        <div className="h-3 w-2/3 bg-white/10 rounded" />
      </div>
      <p className="mt-4 text-xs uppercase tracking-wide text-white/70">
        Preparing {title}
      </p>
    </GlassCard>
  </div>
);

const HomePage: React.FC = () => {
  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      prefetchPortfolioSnapshot();
      sectionPrefetchers.forEach((loader) => {
        void loader();
      });
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div>
      <SectionSidebar />
      <section id="intro">
        <IntroSection />
      </section>
      <section id="about">
        <Suspense fallback={<SectionFallback title="About" />}>
          <About />
        </Suspense>
      </section>
      <section id="education">
        <Suspense fallback={<SectionFallback title="Education" />}>
          <Education />
        </Suspense>
      </section>
      <section id="experiences">
        <Suspense fallback={<SectionFallback title="Experiences" />}>
          <Experiences />
        </Suspense>
      </section>
      <section id="projects">
        <Suspense fallback={<SectionFallback title="Projects" />}>
          <Projects />
        </Suspense>
      </section>
    </div>
  );
};

export default HomePage;
