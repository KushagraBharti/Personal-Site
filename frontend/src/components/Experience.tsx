// src/components/Experiences.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, Variants } from "framer-motion";
import { useTypewriter, Cursor } from "react-simple-typewriter";
import GlassCard from "./ui/GlassCard";
import { ExperienceData } from "../../../backend/src/data/experiences";

const leftColumnVariants: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
};

const rightColumnVariants: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
};

const Experiences: React.FC = () => {
  const [experiences, setExperiences] = useState<ExperienceData[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<ExperienceData | null>(null);

  // Fetch experiences from backend
  useEffect(() => {
    const fetchExperiences = async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "");
        const response = await axios.get(`${apiBaseUrl}/api/experiences`);
        setExperiences(response.data);
      } catch (error) {
        console.error("Error fetching experiences:", error);
      }
    };
    fetchExperiences();
  }, []);

  // For typed heading
  const [startTyping, setStartTyping] = useState(false);
  const [typedText] = useTypewriter({
    words: startTyping ? ["Experiences"] : [""],
    loop: false,
    typeSpeed: 120,
    deleteSpeed: 60,
    delaySpeed: 5000,
  });

  // Modal handlers
  const openDetails = (experience: ExperienceData) => {
    setSelectedExperience(experience);
  };
  const closeDetails = () => {
    setSelectedExperience(null);
  };

  // "View Site" in new tab
  const handleViewSite = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <section className="py-16">
      <div className="container mx-auto max-w-screen-xl px-16">
        {/* Typed heading */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          onViewportEnter={() => setStartTyping(true)}
          viewport={{ once: true }}
          transition={{ duration: 1.5 }}
          className="mb-10"
        >
          <h2 className="relative inline-block text-4xl font-bold text-gray-50">
            {typedText}
            <Cursor />
            <span className="block w-16 h-1 bg-primary mx-auto mt-2 rounded"></span>
          </h2>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2 items-stretch">
          {experiences.map((exp, index) => {
            const variants = index % 2 === 0 ? leftColumnVariants : rightColumnVariants;

            return (
              <motion.div
                key={index}
                variants={variants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                className="h-full"
              >
                {/* 
                  group to trigger hover states
                  relative + overflow-hidden on the card
                  so the overlay matches the glass card's shape
                */}
                <GlassCard className="group relative flex flex-col justify-center items-center text-center hover:shadow-lg transition-shadow w-full h-full px-6 py-6 overflow-hidden">
                  {/* Title & link icon */}
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <h3 className="text-xl font-semibold text-gray-50 whitespace-nowrap">
                      {exp.position}
                    </h3>
                    <a
                      href={exp.companyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary-dark transition-colors cursor-pointer"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 2 24 24"
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
                  </div>
                  {/* Summary */}
                  <p className="text-gray-200 font-medium">{exp.summary}</p>

                  {/* 
                    Split overlay with improved text visibility
                    (blue left side, red right side)
                  */}
                  <div className="absolute inset-0 flex opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {/* Left half: View Site */}
                    <div
                      className="w-1/2 h-full bg-blue-600 bg-opacity-40 flex items-center justify-center cursor-pointer"
                      onClick={() => handleViewSite(exp.companyLink)}
                    >
                      <span className="text-lg font-bold text-white drop-shadow-md">
                        View Site
                      </span>
                    </div>
                    {/* Right half: Click for Details */}
                    <div
                      className="w-1/2 h-full bg-red-600 bg-opacity-40 flex items-center justify-center cursor-pointer"
                      onClick={() => openDetails(exp)}
                    >
                      <span className="text-lg font-bold text-white drop-shadow-md">
                        Click for Details
                      </span>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Glass-styled modal for Detailed View */}
      {selectedExperience && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDetails();
          }}
        >
          {/* Reuse GlassCard for consistent styling */}
          <GlassCard className="relative w-full max-w-3xl mx-auto p-6 text-left">
            <button
              className="absolute top-4 right-4 text-gray-200 hover:text-gray-400"
              onClick={closeDetails}
            >
              ✖
            </button>
            <h3 className="text-2xl font-bold text-white mb-4">
              {selectedExperience.position}
            </h3>
            <p className="text-white/80 mb-4">{selectedExperience.summary}</p>
            {/* Detailed bullet points */}
            <ul className="list-disc list-inside mb-4 space-y-2">
              {selectedExperience.description.map((item, idx) => (
                <li key={idx} className="text-white">
                  {item}
                </li>
              ))}
            </ul>
            {/* Tags, if any */}
            <div className="flex flex-wrap gap-2 mt-4">
              {selectedExperience.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-gray-200 text-sm text-gray-700 rounded"
                >
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
