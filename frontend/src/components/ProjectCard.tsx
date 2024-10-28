import React from "react";

interface ProjectCardProps {
  title: string;
  description: string;
  tags: string[];
  githubLink: string;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ title, description, tags, githubLink }) => {
  return (
    <div className="border p-4 rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-gray-600">{description}</p>
      <div className="flex flex-wrap mt-4 space-x-2">
        {tags.map((tag, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-gray-200 rounded-full text-sm text-gray-700"
          >
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

export default ProjectCard;
