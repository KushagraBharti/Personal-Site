import clsx from "clsx";
import React, { useEffect, useMemo, useState } from "react";
import { useWindowActions } from "../../../app/wm/hooks";
import type { WindowState } from "../../../app/wm/types";
import { useProjectsQuery } from "../../../hooks/usePortfolioQueries";
import type { Project } from "../../../lib/types";
import { toSlug } from "../../../lib/utils";
import ProjectCard from "./ProjectCard";

interface ProjectsAppProps {
  windowState: WindowState;
  payload?: unknown;
}

type ViewMode = "grid" | "list";

type ProjectWithMeta = Project & { slug: string };

const ProjectsApp: React.FC<ProjectsAppProps> = () => {
  const { data, isLoading, isError } = useProjectsQuery();
  const { createWindow } = useWindowActions();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTag, setActiveTag] = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const projects: ProjectWithMeta[] = useMemo(
    () => (data ?? []).map((project) => ({ ...project, slug: toSlug(project.title) })),
    [data],
  );

  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    projects.forEach((project) => {
      project.tags.forEach((tag) => {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag)
      .slice(0, 10);
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return projects.filter((project) => {
      const matchesTag = activeTag === "all" || project.tags.includes(activeTag);
      const matchesSearch =
        !searchTerm ||
        project.title.toLowerCase().includes(search) ||
        project.summary.toLowerCase().includes(search) ||
        project.tags.some((tag) => tag.toLowerCase().includes(search));
      return matchesTag && matchesSearch;
    });
  }, [projects, activeTag, searchTerm]);

  useEffect(() => {
    if (filteredProjects.length === 0) {
      setSelectedProject(null);
      return;
    }
    if (!filteredProjects.some((project) => project.slug === selectedProject)) {
      setSelectedProject(filteredProjects[0].slug);
    }
  }, [filteredProjects, selectedProject]);

  const openProjectDetails = (project: ProjectWithMeta) => {
    createWindow({
      appId: "projectDetails",
      title: project.title,
      icon: "[DOC]",
      size: { width: 760, height: 560 },
      payload: { projectId: project.slug },
      windowId: `projectDetails:${project.slug}`,
      reuseExisting: true,
    });
    setSelectedProject(project.slug);
  };

  return (
    <div className="flex h-full flex-col bg-slate-950/40">
      <header className="border-b border-slate-700/40 bg-slate-900/60 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search projects"
            className="w-64 rounded-md border border-slate-700/60 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-accent"
          />
          <div className="flex items-center gap-1 rounded-md border border-slate-700/60 bg-slate-900/50 p-1">
            {(["grid", "list"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={clsx(
                  "rounded px-2 py-1 text-xs font-medium",
                  viewMode === mode
                    ? "bg-accent/80 text-slate-900"
                    : "text-slate-300 hover:bg-slate-800/80",
                )}
              >
                {mode === "grid" ? "Grid" : "List"}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs text-slate-400">
            {filteredProjects.length} of {projects.length} projects
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTag("all")}
            className={clsx(
              "rounded-full border px-3 py-1 transition",
              activeTag === "all"
                ? "border-accent/60 bg-accent/20 text-accent-foreground"
                : "border-slate-700/60 text-slate-300 hover:border-accent/40",
            )}
          >
            All Tags
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setActiveTag((prev) => (prev === tag ? "all" : tag))}
              className={clsx(
                "rounded-full border px-3 py-1 transition",
                activeTag === tag
                  ? "border-accent/60 bg-accent/20 text-accent-foreground"
                  : "border-slate-700/60 text-slate-300 hover:border-accent/40",
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      </header>
      <div className="flex-1 overflow-auto px-4 py-4">
        {isLoading && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-36 animate-pulse rounded-xl border border-slate-800/60 bg-slate-900/40"
              />
            ))}
          </div>
        )}

        {isError && (
          <div className="rounded-md border border-rose-500/60 bg-rose-500/10 p-4 text-sm text-rose-200">
            Failed to load projects. Please try again later.
          </div>
        )}

        {!isLoading && !isError && filteredProjects.length === 0 && (
          <div className="mt-12 text-center text-sm text-slate-400">
            No projects match your filters yet.
          </div>
        )}

        {!isLoading && !isError && filteredProjects.length > 0 && (
          <div
            className={clsx(
              "gap-3",
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
                : "flex flex-col",
            )}
          >
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.slug}
                project={project}
                viewMode={viewMode}
                isSelected={selectedProject === project.slug}
                onSelect={() => setSelectedProject(project.slug)}
                onOpen={() => openProjectDetails(project)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsApp;
