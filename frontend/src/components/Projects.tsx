import React, { useEffect, useState } from "react";
import axios from "axios";
import { ProjectData } from "../../../backend/src/data/projects";

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<ProjectData[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/projects");
        setProjects(response.data);
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };

    fetchProjects();
  }, []);

  const ProjectCard: React.FC<ProjectData> = ({ title, summary, description, tags, githubLink }) => {
    return (
      <div className="border p-4 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold">
          <a 
            href={githubLink}
            className="text-blue-500 hover:underline"
            target="_blank"
            rel="noopener noreferrer"

            >{title}
          </a>
        </h3>
        <p className="text-gray-600 mt-2">{summary}</p>
        <ul className="mt-2 list-disc list-inside">
          {description.map((item, index) => (
            <li key={index} className="text-gray-600 mt-1">
              {item}
            </li>
          ))}</ul>
        <div className="flex flex-wrap mt-4 space-x-2">
          {tags.map((tag, index) => (
            <span key={index} className="px-2 py-1 bg-gray-200 rounded-full text-sm text-gray-700">
              {tag}
            </span>
          ))}
        </div>
        <a
          href={githubLink}
          className="inline-block mt-4 text-blue-500 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          View on GitHub
        </a>
      </div>
    );
  };

  return (
    <section className="mt-10">
      <h2 className="text-2xl font-semibold mb-4">Projects</h2>
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project, index) => (
          <ProjectCard key={index} {...project} />
        ))}
      </div>
    </section>
  );
};

export default Projects;
