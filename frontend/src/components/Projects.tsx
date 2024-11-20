import React, { useEffect, useState } from "react";
import axios from "axios";
import { ProjectData } from "../../../backend/src/data/projects";

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/projects`);
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
    <section className="py-16 bg-white">
      <div className="container mx-auto">
        <h2 className="section-heading">Projects</h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => (
            <div
              key={index}
              className="card cursor-pointer"
              onClick={() => handleCardClick(project)}
            >
              <h3 className="text-lg font-bold text-primary">{project.title}</h3>
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
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={closePopup}
            >
              ✖
            </button>
            <h3 className="text-xl font-bold text-primary mb-4">{selectedProject.title}</h3>
            <p className="text-gray-600 mb-4">{selectedProject.summary}</p>
            <ul className="mb-4 space-y-2">
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
