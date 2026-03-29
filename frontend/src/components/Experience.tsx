// src/components/Experiences.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion, Variants } from "framer-motion";
import { useTypewriter, Cursor } from "react-simple-typewriter";
import GlassCard from "./ui/GlassCard";
import { ExperienceData } from "../../../backend/src/data/experiences";

// Animation variants for left and right columns (desktop)
const leftColumnVariants: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
};

const rightColumnVariants: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
};

const Experiences: React.FC = () => {
  const [experiences, setExperiences] = useState<ExperienceData[]>(() => {
    const cached = sessionStorage.getItem("experiences-cache");
    if (!cached) return [];
    try {
      return JSON.parse(cached) as ExperienceData[];
    } catch {
      return [];
    }
  });
  const [selectedExperience, setSelectedExperience] = useState<ExperienceData | null>(null);

  // Fetch experiences from backend
  useEffect(() => {
    const apiBaseUrl =
      (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "");
    const controller = new AbortController();

    const fetchExperiences = async () => {
      try {
        const response = await axios.get<ExperienceData[]>(`${apiBaseUrl}/api/experiences`, {
          signal: controller.signal,
          timeout: 5000,
        });
        setExperiences(response.data);
        sessionStorage.setItem("experiences-cache", JSON.stringify(response.data));
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Error fetching experiences:", error);
        }
      }
    };

    const delayId = window.setTimeout(fetchExperiences, 250);
    return () => {
      controller.abort();
      window.clearTimeout(delayId);
    };
  }, []);

  // Typed heading setup
  const [startTyping, setStartTyping] = useState(false);
  const [typedText] = useTypewriter({
    words: startTyping ? ["Experiences"] : [""],
    loop: false,
    typeSpeed: 120,
    deleteSpeed: 60,
    delaySpeed: 1000,
  });

  // Modal handlers
  const openDetails = (exp: ExperienceData) => {
    setSelectedExperience(exp);
  };
  const closeDetails = () => {
    setSelectedExperience(null);
  };

  // "View Site" opens company link in a new tab
  const handleViewSite = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <section className="py-20">
      <div className="container mx-auto max-w-screen-2xl px-4 md:px-10 lg:px-12">
        {/* Typed heading */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          onViewportEnter={() => setStartTyping(true)}
          viewport={{ once: true, amount: 0.2, margin: "0px 0px -12% 0px" }}
          transition={{ duration: 1.5 }}
          className="mb-12"
        >
          <h2 className="relative inline-block text-4xl md:text-5xl font-bold text-gray-50">
            {typedText}
            <Cursor />
            <span className="section-accent-bar"></span>
          </h2>
        </motion.div>

        {/* --- Desktop/Tablet Layout --- */}
        <div className="hidden md:grid gap-8 md:grid-cols-2 items-stretch">
          {experiences.map((exp, index) => {
            const variants = index % 2 === 0 ? leftColumnVariants : rightColumnVariants;
            return (
              <motion.div
                key={index}
                variants={variants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2, margin: "0px 0px -12% 0px" }}
                className="h-full"
              >
                <GlassCard className="group relative flex flex-col items-center text-center w-full max-w-none mx-0 h-52 px-6 py-6 overflow-hidden">
                  <div className="relative z-20 flex flex-col items-center justify-center h-full opacity-100 transition-opacity duration-150 delay-100 group-hover:opacity-0 group-hover:delay-0">
                    <div className="mb-2 w-full">
                      <h3 className="text-xl font-semibold text-gray-50 break-words">
                        {exp.position}
                      </h3>
                    </div>
                    <p className="text-gray-200/90 font-medium">{exp.summary}</p>
                  </div>

                  <div className="absolute inset-0 z-10 premium-hover-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center space-y-4 opacity-0 transition-opacity duration-150 delay-0 group-hover:opacity-100 group-hover:delay-100 pointer-events-auto">
                    <h3 className="text-xl font-semibold text-white px-2 text-center">
                      {exp.position}
                    </h3>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => openDetails(exp)}
                        className="btn-glass-pill"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handleViewSite(exp.companyLink)}
                        className="btn-glass-pill"
                      >
                        View Site
                      </button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>

        {/* --- Mobile Layout (Stacked cards) --- */}
        <div className="block md:hidden space-y-4">
          {experiences.map((exp, index) => (
            <GlassCard key={index} className="w-full max-w-none mx-0 text-center p-5">
              <h3 className="text-lg font-semibold text-gray-50 break-words">
                {exp.position}
              </h3>
              <p className="text-gray-200/90 font-medium mt-1">{exp.summary}</p>
              <div className="flex justify-center gap-3 mt-4">
                <button
                  onClick={() => openDetails(exp)}
                  className="btn-glass-pill"
                >
                  Details
                </button>
                <button
                  onClick={() => handleViewSite(exp.companyLink)}
                  className="btn-glass-pill"
                >
                  View Site
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Modal for detailed experience info */}
      {selectedExperience && (
        <div
          className="fixed inset-0 modal-backdrop flex justify-center items-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDetails();
          }}
        >
          <GlassCard className="relative w-full max-w-3xl mx-auto p-7 md:p-8 text-left modal-glass-card animate-fadeIn">
            <button
              className="modal-close-btn"
              onClick={closeDetails}
              aria-label="Close experience details"
            >
              &times;
            </button>
            <h3 className="flex items-center text-2xl font-bold text-white mb-3 space-x-2.5 pr-10">
              <span>{selectedExperience.position}</span>
              <a
                href={selectedExperience.companyLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="2 2 20 20"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                  />
                </svg>
              </a>
            </h3>
            <p className="text-white/70 mb-5 leading-relaxed">{selectedExperience.summary}</p>
            <ul className="list-disc list-outside pl-5 mb-5 space-y-2.5 text-white/90 leading-relaxed">
              {selectedExperience.description.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-white/10">
              {selectedExperience.tags.map((tag, idx) => (
                <span key={idx} className="tag-pill">
                  {tag}
                </span>
              ))}
            </div>
          </GlassCard>
        </div>
      )}
    </section>
  );
};

export default Experiences;
