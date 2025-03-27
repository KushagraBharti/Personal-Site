// src/components/Projects.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, Variants } from "framer-motion";
import { useTypewriter, Cursor } from "react-simple-typewriter";
import GlassCard from "./ui/GlassCard";
import { ProjectData } from "../../../backend/src/data/projects";

const leftColumnVariants: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
};

const rightColumnVariants: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
};

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);

  // Fetch projects from backend
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "");
        const response = await axios.get(`${apiBaseUrl}/api/projects`);
        setProjects(response.data);
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };
    fetchProjects();
  }, []);

  // For typed heading
  const [startTyping, setStartTyping] = useState(false);
  const [typedText] = useTypewriter({
    words: startTyping ? ["Projects"] : [""],
    loop: false,
    typeSpeed: 120,
    deleteSpeed: 60,
    delaySpeed: 5000,
  });

  // Modal handlers
  const openDetails = (project: ProjectData) => {
    setSelectedProject(project);
  };
  const closeDetails = () => {
    setSelectedProject(null);
  };

  // "View Site" in new tab (here using githubLink)
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

        {/* 
          1) items-stretch ensures each row has uniform height 
          2) gap-8 for spacing 
        */}
        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          {projects.map((project, index) => {
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
                  GlassCard: 
                  - group & relative for overlay 
                  - h-full so it stretches within the grid 
                  - remove whitespace-nowrap from the title to allow wrapping 
                */}
                <GlassCard className="group relative flex flex-col justify-center items-center text-center hover:shadow-lg transition-shadow w-full h-full px-6 py-6 overflow-hidden">
                  {/* Title & link icon */}
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <h3 className="text-xl font-semibold text-gray-50 break-words">
                      {project.title}
                    </h3>
                    {/* Optional GitHub icon link */}
                    <a
                      href={project.githubLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary-dark transition-colors cursor-pointer"
                    >
                      {/* Example GitHub icon */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.263.82-.58v-2.026c-3.338.726-4.043-1.416-4.043-1.416-.546-1.387-1.334-1.757-1.334-1.757-1.091-.745.082-.73.082-.73 1.205.084 1.84 1.236 1.84 1.236 1.07 1.835 2.807 1.304 3.495.997.108-.776.417-1.305.76-1.606-2.665-.3-5.466-1.333-5.466-5.93 0-1.31.469-2.381 1.236-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.007-.322 3.3 1.23.958-.266 1.983-.398 3.003-.404 1.02.006 2.045.138 3.003.404 2.29-1.552 3.295-1.23 3.295-1.23.653 1.653.242 2.873.118 3.176.77.84 1.235 1.91 1.235 3.221 0 4.61-2.807 5.626-5.48 5.92.43.371.81 1.102.81 2.222v3.293c0 .319.22.697.825.58C20.565 21.796 24 17.299 24 12c0-6.63-5.373-12-12-12z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </a>
                  </div>
                  {/* Summary */}
                  <p className="text-gray-200 font-medium">
                    {project.summary}
                  </p>

                  {/* 
                    Split overlay with improved text visibility
                    (blue left side, red right side)
                  */}
                  <div className="absolute inset-0 flex opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {/* Left half: View Site (GitHub link) */}
                    <div
                      className="w-1/2 h-full bg-blue-600 bg-opacity-40 flex items-center justify-center cursor-pointer"
                      onClick={() => handleViewSite(project.githubLink)}
                    >
                      <span className="text-lg font-bold text-white drop-shadow-md">
                        View Site
                      </span>
                    </div>
                    {/* Right half: Click for Details */}
                    <div
                      className="w-1/2 h-full bg-red-600 bg-opacity-40 flex items-center justify-center cursor-pointer"
                      onClick={() => openDetails(project)}
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
      {selectedProject && (
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
              {selectedProject.title}
            </h3>
            <p className="text-white/80 mb-4">{selectedProject.summary}</p>
            {/* Detailed bullet points */}
            <ul className="list-disc list-inside mb-4 space-y-2">
              {selectedProject.description.map((item, idx) => (
                <li key={idx} className="text-white">
                  {item}
                </li>
              ))}
            </ul>
            {/* Tags, if any */}
            <div className="flex flex-wrap gap-2 mt-4">
              {selectedProject.tags.map((tag, idx) => (
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

export default Projects;
