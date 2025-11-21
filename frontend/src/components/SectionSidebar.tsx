// src/components/SectionSidebar.tsx
import React, { useState, useEffect, useRef } from "react";

const sections = [
  { id: "intro", label: "Home" },
  { id: "about", label: "About" },
  { id: "education", label: "Education" },
  { id: "experiences", label: "Experiences" },
  { id: "projects", label: "Projects" },
];

const SectionSidebar: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>("intro");
  const [isVisible, setIsVisible] = useState(true);
  const timeoutId = useRef<number | null>(null);
  const hideDelay = 2200;

  // Reset the timeout when there's activity
  const resetTimer = () => {
    setIsVisible(true);
    if (timeoutId.current) clearTimeout(timeoutId.current);
    timeoutId.current = window.setTimeout(() => {
      setIsVisible(false);
    }, hideDelay);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const topEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (topEntry?.target?.id) {
          setActiveSection(topEntry.target.id);
        }
      },
      {
        threshold: [0.35, 0.6, 0.85],
        rootMargin: "-10% 0px -10% 0px",
      }
    );

    const elements = sections
      .map((section) => document.getElementById(section.id))
      .filter(Boolean) as HTMLElement[];
    elements.forEach((element) => observer.observe(element));

    const handleUserActivity = () => resetTimer();
    window.addEventListener("mousemove", handleUserActivity);
    window.addEventListener("touchstart", handleUserActivity);
    window.addEventListener("scroll", handleUserActivity, { passive: true });

    resetTimer();

    return () => {
      observer.disconnect();
      window.removeEventListener("mousemove", handleUserActivity);
      window.removeEventListener("touchstart", handleUserActivity);
      window.removeEventListener("scroll", handleUserActivity);
      if (timeoutId.current) clearTimeout(timeoutId.current);
    };
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div
      className={`fixed top-1/2 right-4 transform -translate-y-1/2 z-50 flex flex-col items-end space-y-4 transition-opacity duration-500 ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Vertical connecting line */}
      <div className="absolute right-2 top-0 bottom-0 w-px bg-gradient-to-b from-white/20 to-white/80"></div>
      {sections.map((section) => (
        <button
          key={section.id}
          onClick={() => scrollToSection(section.id)}
          className="relative group flex items-center focus:outline-none"
          aria-label={section.label}
        >
          <div
            className={`w-4 h-4 rounded-full border border-white/30 backdrop-blur-sm transition-all duration-300 ${
              activeSection === section.id ? "bg-primary" : "bg-white/20"
            }`}
          ></div>
          {/* Tooltip appears on hover */}
          <span className="absolute right-6 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-semibold px-2 py-1 bg-black bg-opacity-50 rounded whitespace-nowrap">
            {section.label}
          </span>
        </button>
      ))}
    </div>
  );
};

export default SectionSidebar;
