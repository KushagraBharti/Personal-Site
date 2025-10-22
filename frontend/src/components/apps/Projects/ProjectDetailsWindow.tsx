import React, { useMemo } from "react";
import type { WindowState } from "../../../app/wm/types";
import { useProjectsQuery } from "../../../hooks/usePortfolioQueries";
import type { Project } from "../../../lib/types";
import { toSlug } from "../../../lib/utils";

interface ProjectDetailsWindowProps {
  windowState: WindowState;
  payload?: { projectId?: string };
}

const ProjectDetailsWindow: React.FC<ProjectDetailsWindowProps> = ({ payload }) => {
  const { data, isLoading } = useProjectsQuery();
  const project = useMemo<Project | undefined>(() => {
    if (!data || data.length === 0) return undefined;
    if (payload?.projectId) {
      return data.find((item) => toSlug(item.title) === payload.projectId) ?? data[0];
    }
    return data[0];
  }, [data, payload?.projectId]);

  if (isLoading) {
    return <div className="h-full w-full animate-pulse bg-slate-900/40" />;
  }

  if (!project) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-slate-900/40 text-sm text-slate-400">
        Project not found. Try opening from the Projects app.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-auto bg-slate-950/30 p-4 text-sm text-slate-200">
      <div className="flex flex-col gap-4 rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide text-slate-400">Project</span>
          <h2 className="text-2xl font-semibold text-slate-100">{project.title}</h2>
          <p className="text-sm text-slate-300">{project.summary}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-slate-400">
          {project.tags.map((tag) => (
            <span key={tag} className="rounded-md bg-slate-800/60 px-2 py-0.5">
              {tag}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          {project.githubLink && (
            <a
              href={project.githubLink}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-accent/60 px-3 py-1 font-medium text-accent-foreground transition hover:bg-accent/20"
            >
              View Repository
            </a>
          )}
        </div>
      </div>

      {project.thumbnail && (
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
          <img
            src={project.thumbnail}
            alt=""
            className="w-full rounded-lg object-cover"
            loading="lazy"
          />
        </div>
      )}

      <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4">
        <h3 className="text-sm font-semibold text-slate-100">Highlights</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          {project.description.map((item, index) => (
            <li key={index} className="leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ProjectDetailsWindow;
