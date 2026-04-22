import React, { Suspense } from "react";
import GlassCard from "../../shared/components/ui/GlassCard";
import PortfolioNavbar from "../components/PortfolioNavbar";
import HeroLandingSection from "../sections/hero/HeroLandingSection";

const About = React.lazy(() => import("../sections/about/AboutSection"));
const Featured = React.lazy(() => import("../sections/featured/FeaturedSection"));
const Experiences = React.lazy(() => import("../sections/experiences/ExperiencesSection"));
const Projects = React.lazy(() => import("../sections/projects/ProjectsSection"));
const Film = React.lazy(() => import("../sections/film/FilmSection"));
const Misc = React.lazy(() => import("../sections/misc/MiscSection"));

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
  return (
    <div className="portfolio-overhaul-page">
      <PortfolioNavbar />
      <section id="intro">
        <HeroLandingSection />
      </section>
      <section id="about">
        <Suspense fallback={<SectionFallback title="About" />}>
          <About />
        </Suspense>
      </section>
      <section id="featured">
        <Suspense fallback={<SectionFallback title="Featured" />}>
          <Featured />
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
      <section id="film">
        <Suspense fallback={<SectionFallback title="Film" />}>
          <Film />
        </Suspense>
      </section>
      <section id="misc">
        <Suspense fallback={<SectionFallback title="Misc" />}>
          <Misc />
        </Suspense>
      </section>
    </div>
  );
};

export default HomePage;
