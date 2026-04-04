import React, { useEffect, useState } from "react";
import { motion, Variants } from "framer-motion";
import { useTypewriter, Cursor } from "react-simple-typewriter";
import GlassCard from "../../../shared/components/ui/GlassCard";
import { fetchEducation } from "../../api/portfolioApi";
import type { PortfolioEducation } from "../../api/contracts";

const leftColumnVariants: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
};

const rightColumnVariants: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
};

const Education: React.FC = () => {
  const [education, setEducation] = useState<PortfolioEducation[]>(() => {
    const cached = sessionStorage.getItem("education-cache");
    if (!cached) return [];
    try {
      return JSON.parse(cached) as PortfolioEducation[];
    } catch {
      return [];
    }
  });
  const [selectedEducation, setSelectedEducation] = useState<PortfolioEducation | null>(null);

  // Fetch education data on mount
  useEffect(() => {
    const controller = new AbortController();

    const loadEducation = async () => {
      try {
        const response = await fetchEducation(controller.signal);
        setEducation(response);
        sessionStorage.setItem("education-cache", JSON.stringify(response));
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Error fetching education:", error);
        }
      }
    };

    void loadEducation();
    return () => {
      controller.abort();
    };
  }, []);

  // Typed heading
  const [startTyping, setStartTyping] = useState(false);
  const [typedText] = useTypewriter({
    words: startTyping ? ["Education"] : [""],
    loop: false,
    typeSpeed: 120,
    deleteSpeed: 60,
    delaySpeed: 1000,
  });

  const openDetails = (edu: PortfolioEducation) => {
    setSelectedEducation(edu);
  };
  const closeDetails = () => {
    setSelectedEducation(null);
  };
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

        {/* --- Desktop/Tablet Layout (2-column grid) --- */}
        <div className="hidden md:grid gap-8 md:grid-cols-2 items-stretch">
          {education.map((edu, index) => {
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
                    <h3 className="text-xl font-semibold text-gray-50 break-words mb-1.5">
                      {edu.position}
                    </h3>
                    <p className="text-gray-200/90 font-medium break-words">{edu.focus}</p>
                  </div>

                  <div className="absolute inset-0 z-10 premium-hover-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center space-y-4 opacity-0 transition-opacity duration-150 delay-0 group-hover:opacity-100 group-hover:delay-100 pointer-events-auto">
                    <h3 className="text-xl font-semibold text-white px-2 text-center">
                      {edu.position}
                    </h3>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => openDetails(edu)}
                        className="btn-glass-pill"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handleViewSite(edu.schoolLink)}
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
          {education.map((edu, index) => (
            <GlassCard key={index} className="w-full max-w-none mx-0 text-center p-5">
              <h3 className="text-lg font-semibold text-gray-50 break-words mb-1">
                {edu.position}
              </h3>
              <p className="text-gray-200/90 font-medium break-words mb-3">{edu.focus}</p>
              <div className="flex justify-center gap-3 mt-3">
                <button
                  onClick={() => openDetails(edu)}
                  className="btn-glass-pill"
                >
                  Details
                </button>
                <button
                  onClick={() => handleViewSite(edu.schoolLink)}
                  className="btn-glass-pill"
                >
                  View Site
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Modal for detailed info */}
      {selectedEducation && (
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
              aria-label="Close education details"
            >
              &times;
            </button>
            <h3 className="flex items-center text-2xl font-bold text-white mb-3 space-x-2.5 pr-10">
              <span>{selectedEducation.position}</span>
              <a
                href={selectedEducation.schoolLink}
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
            <p className="text-white/60 mb-4 text-sm font-medium tracking-wide uppercase">{selectedEducation.dateRange}</p>
            <p className="text-white/90 leading-relaxed">{selectedEducation.description}</p>
          </GlassCard>
        </div>
      )}
    </section>
  );
};

export default Education;
