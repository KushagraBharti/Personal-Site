import React from "react";
import type { Project } from "../../../lib/types";

interface ProjectCardProps {
  project: Project;
  viewMode: "grid" | "list";
  isSelected: boolean;
  onOpen: () => void;
  onSelect: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, viewMode, isSelected, onOpen, onSelect }) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  };

  const cardClasses = `group rounded-xl border ${
    isSelected ? "border-accent/60 bg-slate-900/80" : "border-slate-700/40 bg-slate-900/40"
  } p-4 transition hover:border-accent/50 hover:bg-slate-900/70`;

  const body = (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">{project.title}</h3>
          <p className="mt-1 text-xs text-slate-300">{project.summary}</p>
        </div>
        {project.thumbnail && viewMode === "grid" && (
          <img
            src={project.thumbnail}
            alt=""
            className="h-16 w-24 rounded-md object-cover"
            loading="lazy"
          />
        )}
      </div>
      <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-slate-400">
        {project.tags.slice(0, 6).map((tag) => (
          <span key={tag} className="rounded-md bg-slate-800/60 px-2 py-0.5">
            {tag}
          </span>
        ))}
        {project.tags.length > 6 && <span className="text-slate-500">+{project.tags.length - 6}</span>}
      </div>
      <div className="mt-2 flex items-center justify-end">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpen();
          }}
          className="rounded-md border border-accent/60 px-3 py-1 text-xs font-medium text-accent-foreground transition hover:bg-accent/20"
        >
          Open Details
        </button>
      </div>
    </div>
  );

  if (viewMode === "list") {
    return (
      <div
        role="button"
        tabIndex={0}
        className={`${cardClasses} border-l-4 ${isSelected ? "border-l-accent" : "border-l-transparent"}`}
        onClick={onSelect}
        onDoubleClick={onOpen}
        onKeyDown={handleKeyDown}
      >
        {body}
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={`${cardClasses} h-full`}
      onClick={onSelect}
      onDoubleClick={onOpen}
      onKeyDown={handleKeyDown}
    >
      {body}
    </div>
  );
};

export default ProjectCard;
