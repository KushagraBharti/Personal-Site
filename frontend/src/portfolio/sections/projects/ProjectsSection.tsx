import React, { useEffect, useState } from "react";
import { motion, Variants } from "framer-motion";
import { useTypewriter, Cursor } from "react-simple-typewriter";
import GlassCard from "../../../shared/components/ui/GlassCard";
import { fetchProjects } from "../../api/portfolioApi";
import type { PortfolioProject } from "../../api/contracts";

const leftColumnVariants: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
};

const rightColumnVariants: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
};

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<PortfolioProject[]>(() => {
    const cached = sessionStorage.getItem("projects-cache");
    if (!cached) return [];
    try {
      return JSON.parse(cached) as PortfolioProject[];
    } catch {
      return [];
    }
  });
  const [selectedProject, setSelectedProject] = useState<PortfolioProject | null>(null);

  // Fetch projects from backend
  useEffect(() => {
    const controller = new AbortController();

    const loadProjects = async () => {
      try {
        const response = await fetchProjects(controller.signal);
        setProjects(response);
        sessionStorage.setItem("projects-cache", JSON.stringify(response));
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Error fetching projects:", error);
        }
      }
    };

    const delayId = window.setTimeout(loadProjects, 250);
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
  const openDetails = (project: PortfolioProject) => {
    setSelectedProject(project);
  };
  const closeDetails = () => {
    setSelectedProject(null);
  };

  // "View Site" opens the GitHub link (or site) in a new tab
  const handleViewSite = (url?: string) => {
    if (!url) return;
    window.open(url, "_blank");
  };

  const featuredProjects = projects.slice(0, 6);
  const otherProjects = projects.slice(6);

  const renderDesktopProjectCard = (project: PortfolioProject, index: number) => {
    const variants = index % 2 === 0 ? leftColumnVariants : rightColumnVariants;
    return (
      <motion.div
        key={`${project.title}-${index}`}
        variants={variants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2, margin: "0px 0px -12% 0px" }}
        className="h-full"
      >
        <GlassCard className="group relative flex flex-col items-center text-center w-full max-w-none mx-0 h-full px-6 py-6 overflow-hidden">
          {project.thumbnail && (
            <img
              src={project.thumbnail}
              alt={project.title}
              loading="lazy"
              decoding="async"
              className="w-full h-auto object-cover rounded-xl mb-4"
            />
          )}
          <div className="relative z-20 flex flex-col items-center">
            <h3 className="text-xl font-semibold text-gray-50 break-words opacity-100 transition-opacity duration-150 delay-100 group-hover:opacity-0 group-hover:delay-0">
              {project.title}
            </h3>
            <p className="text-gray-200/90 font-medium opacity-100 transition-opacity duration-150 delay-100 group-hover:opacity-0 group-hover:delay-0">
              {project.summary}
            </p>
          </div>
          <div className="absolute inset-0 z-10 premium-hover-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center opacity-0 transition-opacity duration-150 delay-0 group-hover:opacity-100 group-hover:delay-100 pointer-events-none">
            <div className="pointer-events-auto text-center">
              <h3 className="text-xl font-semibold text-white">{project.title}</h3>
            </div>
            <div className="pointer-events-auto mt-5 flex gap-3">
              <button
                onClick={() => openDetails(project)}
                className="btn-glass-pill"
              >
                Details
              </button>
              {project.githubLink ? (
                <button
                  onClick={() => handleViewSite(project.githubLink)}
                  className="btn-glass-pill"
                >
                  View Github
                </button>
              ) : null}
            </div>
          </div>
        </GlassCard>
      </motion.div>
    );
  };

  const renderMobileProjectCard = (project: PortfolioProject, index: number) => (
    <GlassCard key={`${project.title}-${index}`} className="w-full max-w-none mx-0 text-center p-5">
      {project.thumbnail && (
        <img
          src={project.thumbnail}
          alt={project.title}
          loading="lazy"
          decoding="async"
          className="w-full h-auto object-cover rounded-xl mb-4"
        />
      )}
      <h3 className="text-lg font-semibold text-gray-50">{project.title}</h3>
      <p className="text-gray-200/90 font-medium mt-1">{project.summary}</p>
      <div className="flex justify-center gap-3 mt-4">
        <button
          onClick={() => openDetails(project)}
          className="btn-glass-pill"
        >
          Details
        </button>
        {project.githubLink ? (
          <button
            onClick={() => handleViewSite(project.githubLink)}
            className="btn-glass-pill"
          >
            View Github
          </button>
        ) : null}
      </div>
    </GlassCard>
  );

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
        <div className="hidden md:block">
          <h3 className="text-2xl font-semibold text-gray-50 mb-7">Featured Projects</h3>
          <div className="grid gap-8 md:grid-cols-3 items-stretch">
            {featuredProjects.map(renderDesktopProjectCard)}
          </div>
          {otherProjects.length > 0 && (
            <div className="mt-14">
              <h3 className="text-2xl font-semibold text-gray-50 mb-7">Other Projects</h3>
              <div className="grid gap-8 md:grid-cols-2 items-stretch">
                {otherProjects.map(renderDesktopProjectCard)}
              </div>
            </div>
          )}
        </div>

        {/* --- Mobile Layout (Stacked Cards) --- */}
        <div className="block md:hidden space-y-10">
          <div>
            <h3 className="text-xl font-semibold text-gray-50 mb-5">Featured Projects</h3>
            <div className="space-y-4">{featuredProjects.map(renderMobileProjectCard)}</div>
          </div>
          {otherProjects.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-gray-50 mb-5">Other Projects</h3>
              <div className="space-y-4">{otherProjects.map(renderMobileProjectCard)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Modal for Detailed Project Info */}
      {selectedProject && (
        <div
          className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDetails();
          }}
        >
          <GlassCard className="relative w-full max-w-[1850px] mx-auto p-7 md:p-8 modal-glass-card animate-fadeIn">
            <button
              className="modal-close-btn"
              onClick={closeDetails}
              aria-label="Close project details"
            >
              &times;
            </button>
            <div className="flex flex-col md:flex-row" style={{ maxHeight: "90vh" }}>
              {selectedProject.thumbnail && (
                <div className="md:w-1/2 flex items-center justify-center">
                  <img
                    src={selectedProject.thumbnail}
                    alt={selectedProject.title}
                    className="w-full h-auto object-contain rounded-xl"
                  />
                </div>
              )}
              <div
                className="md:w-1/2 mt-4 md:mt-0 md:pl-8 overflow-y-auto"
                style={{ maxHeight: "80vh" }}
              >
                <h3 className="text-3xl font-bold text-white mb-3 pr-10">
                  {selectedProject.title}
                </h3>
                <p className="text-white/70 mb-5 text-lg leading-relaxed">{selectedProject.summary}</p>
                <ul className="list-disc list-outside pl-5 space-y-2.5 text-white/90 leading-relaxed">
                  {selectedProject.description.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-white/10">
                  {selectedProject.tags.map((tag, idx) => (
                    <span key={idx} className="tag-pill">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-6">
                  <a
                    href={selectedProject.githubLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-glass-pill inline-flex items-center gap-2"
                  >
                    View on GitHub
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
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
