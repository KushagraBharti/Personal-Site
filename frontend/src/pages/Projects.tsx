import React from "react";
import Navbar from "../components/Navbar";
import ProjectCard from "\..\\components\\ProjectCard";

const Projects: React.FC = () => {
  // Hardcoded project data
  const projects = [
    {
      title: "Project 1",
      description: "Description for project 1",
      tags: ["React", "Node.js"],
      githubLink: "#",
    },
    {
      title: "Project 2",
      description: "Description for project 2",
      tags: ["Python", "Machine Learning"],
      githubLink: "#",
    },
  ];

  return (
    <div>
      <Navbar />
      <section className="container mx-auto px-4 mt-10">
        <h2 className="text-2xl font-semibold mb-6">Projects</h2>
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => (
            <ProjectCard key={index} {...project} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Projects;
