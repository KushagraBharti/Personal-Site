// src/components/Projects.tsx
import React, { useEffect, useRef, useState } from "react";
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
  const [projects, setProjects] = useState<ProjectData[]>(() => {
    const cached = sessionStorage.getItem("projects-cache");
    if (!cached) return [];
    try {
      return JSON.parse(cached) as ProjectData[];
    } catch {
      return [];
    }
  });
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const hasFetched = useRef(false);

  // Fetch projects from backend
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const apiBaseUrl =
      (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "");
    const controller = new AbortController();

    const fetchProjects = async () => {
      try {
        const response = await axios.get<ProjectData[]>(`${apiBaseUrl}/api/projects`, {
          signal: controller.signal,
          timeout: 5000,
        });
        setProjects(response.data);
        sessionStorage.setItem("projects-cache", JSON.stringify(response.data));
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Error fetching projects:", error);
        }
      }
    };

    const delayId = window.setTimeout(fetchProjects, 250);
    return () => {
      controller.abort();
      window.clearTimeout(delayId);
    };
  }, []);

  // Typed heading setup
  const [startTyping, setStartTyping] = useState(false);
  const [typedText] = useTypewriter({
    words: startTyping ? ["Projects"] : [""],
    loop: false,
    typeSpeed: 120,
    deleteSpeed: 60,
    delaySpeed: 1000,
  });

  // Modal handlers
  const openDetails = (project: ProjectData) => {
    setSelectedProject(project);
  };
  const closeDetails = () => {
    setSelectedProject(null);
  };

  // "View Site" opens the GitHub link (or site) in a new tab
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
          viewport={{ once: true, amount: 0.2, margin: "0px 0px -12% 0px" }}
          transition={{ duration: 1.5 }}
          className="mb-10"
        >
          <h2 className="relative inline-block text-4xl font-bold text-gray-50">
            {typedText}
            <Cursor />
            <span className="block w-16 h-1 bg-primary mx-auto mt-2 rounded"></span>
          </h2>
        </motion.div>

        {/* --- Desktop/Tablet Layout (Draggable Grid) --- */}
        <div className="hidden md:grid gap-8 md:grid-cols-2 items-stretch">
          {projects.map((project, index) => {
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
                <GlassCard className="group relative flex flex-col items-center text-center w-full h-full px-6 py-6 overflow-hidden">
                  {/* If thumbnail exists, render it */}
                  {project.thumbnail && (
                    <img
                      src={project.thumbnail}
                      alt={project.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-auto object-cover rounded mb-4"
                    />
                  )}
                  {/* Always-visible title and summary */}
                  <div className="relative z-20 flex flex-col items-center">
                    <h3 className="text-xl font-semibold text-gray-50 break-words opacity-100 group-hover:opacity-0">
                      {project.title}
                    </h3>
                    <p className="text-gray-200 font-medium opacity-100 group-hover:opacity-0">
                      {project.summary}
                    </p>
                  </div>
                  {/* Background gradient overlay (appears on hover) */}
                  <div className="absolute inset-0 z-10 bg-gradient-to-r from-blue-500 to-purple-600 opacity-0 group-hover:opacity-80 transition-opacity duration-300 pointer-events-none" />
                  {/* Centered overlay: title at top and buttons below */}
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className="pointer-events-auto text-center mt-4">
                      <h3 className="text-xl font-semibold text-gray-50">
                        {project.title}
                      </h3>
                    </div>
                    <div className="pointer-events-auto mt-6 flex flex-col sm:flex-row gap-4">
                      <button
                        onClick={() => openDetails(project)}
                        className="w-28 px-4 py-2 text-white font-semibold bg-black/40 rounded hover:bg-black/70 transition-colors"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handleViewSite(project.githubLink)}
                        className="w-28 px-4 py-2 text-white font-semibold bg-black/40 rounded hover:bg-black/70 transition-colors"
                      >
                        View Github
                      </button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>

        {/* --- Mobile Layout (Stacked Cards) --- */}
        <div className="block md:hidden space-y-4">
          {projects.map((project, index) => (
            <GlassCard key={index} className="w-full text-center p-4">
              {project.thumbnail && (
                <img
                  src={project.thumbnail}
                  alt={project.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-auto object-cover rounded mb-4"
                />
              )}
              <h3 className="text-lg font-semibold text-gray-50">{project.title}</h3>
              <p className="text-gray-200 font-medium">{project.summary}</p>
              <div className="flex justify-center gap-4 mt-4">
                <button
                  onClick={() => openDetails(project)}
                  className="w-24 px-3 py-2 text-white font-semibold bg-black/40 rounded hover:bg-black/70 transition-colors"
                >
                  Details
                </button>
                <button
                  onClick={() => handleViewSite(project.githubLink)}
                  className="w-24 px-3 py-2 text-white font-semibold bg-black/40 rounded hover:bg-black/70 transition-colors"
                >
                  View Github
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Modal for Detailed Project Info */}
      {selectedProject && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDetails();
          }}
        >
          <GlassCard className="relative w-full max-w-[1850px] mx-auto p-8 bg-white/10 backdrop-blur-lg rounded-lg shadow-xl animate-fadeIn">
            <button
              className="absolute top-4 right-4 text-gray-200 hover:text-red-600 text-2xl"
              onClick={closeDetails}
              aria-label="Close project details"
            >
              ×
            </button>
            <div className="flex flex-col md:flex-row" style={{ maxHeight: "90vh" }}>
              {/* Left Column: Project Thumbnail */}
              {selectedProject.thumbnail && (
                <div className="md:w-1/2 flex items-center justify-center">
                  <img
                    src={selectedProject.thumbnail}
                    alt={selectedProject.title}
                    className="w-full h-auto object-contain rounded"
                  />
                </div>
              )}
              {/* Right Column: Project Details */}
              <div
                className="md:w-1/2 mt-4 md:mt-0 md:pl-6 overflow-y-auto"
                style={{ maxHeight: "80vh" }}
              >
                <h3 className="text-3xl font-bold text-white mb-3">
                  {selectedProject.title}
                </h3>
                <p className="text-white/80 mb-4 text-lg">{selectedProject.summary}</p>
                <ul className="list-disc list-outside pl-6 space-y-2 text-white">
                  {selectedProject.description.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-2 mt-4">
                  {selectedProject.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 text-base font-semibold text-white bg-white/20 backdrop-blur-md border border-white/30 rounded shadow-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-6">
                  <a
                    href={selectedProject.githubLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-6 py-3 bg-blue-600 text-white text-lg font-semibold rounded hover:bg-blue-700 transition-colors"
                  >
                    View on GitHub
                  </a>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </section>
  );
};

export default Projects;
