// frontend/src/components/Education.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, Variants } from "framer-motion";
import { useTypewriter, Cursor } from "react-simple-typewriter";
import GlassCard from "./ui/GlassCard";
import { EducationData } from "../../../backend/src/data/education";

const leftColumnVariants: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
};

const rightColumnVariants: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
};

const Education: React.FC = () => {
  const [education, setEducation] = useState<EducationData[]>([]);
  const [selectedEducation, setSelectedEducation] = useState<EducationData | null>(null);

  // Fetch education data on mount
  useEffect(() => {
    const fetchEducation = async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "");
        const response = await axios.get(`${apiBaseUrl}/api/education`);
        setEducation(response.data);
      } catch (error) {
        console.error("Error fetching education:", error);
      }
    };
    fetchEducation();
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

  const openDetails = (edu: EducationData) => {
    setSelectedEducation(edu);
  };
  const closeDetails = () => {
    setSelectedEducation(null);
  };
  const handleViewSite = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <section className="py-16">
      <div className="container mx-auto max-w-screen-xl px-4 md:px-16">
        {/* Typed heading */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          onViewportEnter={() => setStartTyping(true)}
          viewport={{ once: true }}
          transition={{ duration: 1.5 }}
          className="mb-10 text-center"
        >
          <h2 className="relative inline-block text-4xl font-bold text-gray-50">
            {typedText}
            <Cursor />
            <span className="block w-16 h-1 bg-primary mx-auto mt-2 rounded"></span>
          </h2>
        </motion.div>

        {/* --- Desktop/Tablet Layout (draggable grid) --- */}
        <div className="hidden md:grid gap-8 md:grid-cols-2 items-stretch">
          {education.map((edu, index) => {
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
                <GlassCard className="group relative flex flex-col items-center text-center w-full h-full px-6 py-6 overflow-hidden">
                  {/* Always visible title & focus text */}
                  <div className="relative z-20 flex flex-col items-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <h3 className="text-xl font-semibold text-gray-50 whitespace-nowrap">
                        {edu.position}
                      </h3>
                    </div>
                    <p className="text-gray-200 font-medium group-hover:hidden">
                      {edu.focus}
                    </p>
                  </div>

                  {/* Background gradient overlay on hover */}
                  <div className="absolute inset-0 z-10 bg-gradient-to-r from-blue-500 to-purple-600 opacity-0 group-hover:opacity-70 transition-opacity duration-300 pointer-events-none" />

                  {/* Overlay with centered buttons */}
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    {/* Title always on top */}
                    <div className="pointer-events-auto text-center mt-4">
                      <h3 className="text-xl font-semibold text-gray-50 group-hover:opacity-0">{edu.position}</h3>
                    </div>
                    {/* Buttons container */}
                    <div className="pointer-events-auto mt-6 flex flex-col sm:flex-row gap-4">
                      <button
                        onClick={() => openDetails(edu)}
                        className="w-28 px-4 py-2 text-white font-semibold bg-black/40 rounded hover:bg-black/70 transition-colors"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handleViewSite(edu.schoolLink)}
                        className="w-28 px-4 py-2 text-white font-semibold bg-black/40 rounded hover:bg-black/70 transition-colors"
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
            <GlassCard key={index} className="w-full text-center p-4">
              <h3 className="text-lg font-semibold text-gray-50">{edu.position}</h3>
              <p className="text-gray-200 font-medium">{edu.focus}</p>
              <div className="flex justify-center gap-4 mt-4">
                <button
                  onClick={() => openDetails(edu)}
                  className="w-24 px-3 py-2 text-white font-semibold bg-black/40 rounded hover:bg-black/70 transition-colors"
                >
                  Details
                </button>
                <button
                  onClick={() => handleViewSite(edu.schoolLink)}
                  className="w-24 px-3 py-2 text-white font-semibold bg-black/40 rounded hover:bg-black/70 transition-colors"
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
          className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDetails();
          }}
        >
          <GlassCard className="relative w-full max-w-3xl mx-auto p-6 text-left modal-glass-card">
            <button
              className="absolute top-4 right-4 text-gray-200 hover:text-red-600 text-2xl"
              onClick={closeDetails}
            >
              ✖
            </button>
            <h3 className="flex items-center text-2xl font-bold text-white mb-2 space-x-2">
              <span>{selectedEducation.position}</span>
              <a
                href={selectedEducation.schoolLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-primary-dark transition-colors cursor-pointer"
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
            <p className="text-white/80 mb-4 italic">{selectedEducation.dateRange}</p>
            <p className="text-white mb-4">{selectedEducation.description}</p>
          </GlassCard>
        </div>
      )}
    </section>
  );
};

export default Education;
