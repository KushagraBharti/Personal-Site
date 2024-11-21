import React, { useEffect, useState } from "react";
import axios from "axios";
import { ProjectData } from "../../../backend/src/data/projects";

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);

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

  const handleCardClick = (project: ProjectData) => {
    setSelectedProject(project);
  };

  const closePopup = () => setSelectedProject(null);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) closePopup();
  };

  return (
    <section className="py-16">
      <div className="container mx-auto">
        <h2 className="section-heading">Projects</h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => (
            <div
              key={index}
              className="card cursor-pointer"
              onClick={() => handleCardClick(project)}
            >
              <div className="flex items-center justify-center space-x-2">
                <h3 className="text-xl text-primary font-sans">{project.title}</h3>
                {project.githubLink && (
                  <a
                    href={project.githubLink}
                    className="text-gray-600 hover:text-primary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg
                      xmlns="././public/github-mark.svg"
                      className="w-5 h-5"
                      viewBox="0 1 25 24"
                      fill="currentColor"
                    >
                      <path d="M12 .5C5.35.5 0 5.85 0 12.48c0 5.29 3.44 9.79 8.21 11.38.6.11.82-.26.82-.58v-2.07c-3.34.73-4.04-1.61-4.04-1.61-.55-1.4-1.34-1.77-1.34-1.77-1.09-.75.08-.74.08-.74 1.2.09 1.83 1.23 1.83 1.23 1.07 1.83 2.81 1.3 3.5 1 .1-.77.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.98 0-1.32.46-2.4 1.21-3.25-.12-.31-.53-1.57.12-3.28 0 0 1.01-.32 3.31 1.23.96-.27 1.98-.4 3-.41 1.02.01 2.04.14 3 .41 2.3-1.55 3.31-1.23 3.31-1.23.65 1.71.24 2.97.12 3.28.76.85 1.21 1.94 1.21 3.25 0 4.65-2.81 5.68-5.49 5.98.43.38.81 1.11.81 2.23v3.29c0 .32.22.69.83.57 4.77-1.59 8.21-6.08 8.21-11.38C24 5.85 18.65.5 12 .5z" />
                    </svg>
                  </a>
                )}
              </div>
              <p className="text-gray-600 mt-2">{project.summary}</p>
            </div>
          ))}
        </div>
      </div>

      {selectedProject && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
          onClick={handleOverlayClick}
        >
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={closePopup}
            >
              ✖
            </button>
            <h3 className="text-xl font-bold text-primary mb-4">{selectedProject.title}</h3>
            <p className="text-gray-600 mb-4">{selectedProject.summary}</p>
              <ul className="mb-4 space-y-2 text-left list-disc pl-5">
                {selectedProject.description.map((item, index) => (
                  <li key={index} className="text-gray-700">
                    {item}
                  </li>
                ))}
              </ul>
            <div className="flex flex-wrap gap-2">
              {selectedProject.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-200 text-sm text-gray-700 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
            <a
              href={selectedProject.githubLink}
              className="inline-block text-blue-500 hover:underline mt-4"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub
            </a>
          </div>
        </div>
      )}
    </section>
  );
};

export default Projects;
