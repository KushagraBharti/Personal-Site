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

  // Reset the timeout when there's activity
  const resetTimer = () => {
    setIsVisible(true);
    if (timeoutId.current) clearTimeout(timeoutId.current);
    timeoutId.current = window.setTimeout(() => {
      setIsVisible(false);
    }, 1000); // 15 seconds
  };

  useEffect(() => {
    const handleScroll = () => {
      let current = "intro";
      sections.forEach((section) => {
        const element = document.getElementById(section.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (
            rect.top <= window.innerHeight / 2 &&
            rect.bottom >= window.innerHeight / 2
          ) {
            current = section.id;
          }
        }
      });
      setActiveSection(current);
      resetTimer();
    };

    const handleMouseMove = () => {
      resetTimer();
    };

    const handleTouchStart = () => {
      resetTimer();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchstart", handleTouchStart);

    // Initial call
    resetTimer();
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchstart", handleTouchStart);
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
