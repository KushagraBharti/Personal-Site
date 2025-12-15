// src/pages/Home.tsx
import React, { Suspense, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Intro from "../components/Intro";
import GlassCard from "../components/ui/GlassCard";

const About = React.lazy(() => import("../components/About"));
const Education = React.lazy(() => import("../components/Education"));
const Experiences = React.lazy(() => import("../components/Experience"));
const Projects = React.lazy(() => import("../components/Projects"));

const sectionPrefetchers = [
  () => import("../components/About"),
  () => import("../components/Education"),
  () => import("../components/Experience"),
  () => import("../components/Projects"),
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

const Home: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const preloadSections = () => sectionPrefetchers.forEach((loader) => loader());
    const idle = (window as any).requestIdleCallback;
    let idleId: number | undefined;
    let timeoutId: number | undefined;

    if (typeof idle === "function") {
      idleId = idle(preloadSections, { timeout: 1500 }) as number;
    } else {
      timeoutId = window.setTimeout(preloadSections, 600);
    }

    return () => {
      if (typeof idle === "function" && idleId) {
        (window as any).cancelIdleCallback?.(idleId);
      }
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if (e.key?.toLowerCase() !== "t" || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isTyping = tag === "input" || tag === "textarea" || target?.isContentEditable;
      if (isTyping) return;
      navigate("/tracker");
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [navigate]);

  return (
    <div>
      <section id="intro">
        <Intro />
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

export default Home;
