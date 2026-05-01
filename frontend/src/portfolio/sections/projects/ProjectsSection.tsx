import React, { useEffect, useState } from "react";
import { fetchProjects, getCachedPortfolioSnapshot } from "../../api/portfolioApi";
import type { PortfolioProject } from "../../api/contracts";
import { portfolioSnapshotBootstrap } from "../../generated/portfolioSnapshotBootstrap";

const PROJECT_CARD_LIMIT = 6;

const ProjectsSection: React.FC = () => {
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [projects, setProjects] = useState<PortfolioProject[]>(
    () => getCachedPortfolioSnapshot()?.projects ?? portfolioSnapshotBootstrap.projects
  );

  useEffect(() => {
    const controller = new AbortController();

    const loadProjects = async () => {
      try {
        const response = await fetchProjects(controller.signal);
        setProjects(response);
      } catch {
        if (!controller.signal.aborted) {
          // Keep the generated portfolio bootstrap if the live API is unavailable.
        }
      }
    };

    void loadProjects();

    return () => {
      controller.abort();
    };
  }, []);

  const visibleProjects = showAllProjects ? projects : projects.slice(0, PROJECT_CARD_LIMIT);

  return (
    <section className="projects-editorial" aria-labelledby="projects-title">
      <div className="projects-editorial__inner">
        <aside className="projects-editorial__intro">
          <div className="projects-editorial__intro-copy">
            <h2 id="projects-title" className="projects-editorial__title">
              Projects
            </h2>
            <p className="projects-editorial__summary">
              Systems I&apos;ve designed, built, and shipped.
            </p>
          </div>

          <button
            type="button"
            className="projects-editorial__all-button"
            onClick={() => setShowAllProjects(true)}
            disabled={showAllProjects || projects.length <= PROJECT_CARD_LIMIT}
          >
            {showAllProjects ? "All Projects Shown" : "All Projects +"}
          </button>
        </aside>

        <div className="projects-editorial__grid" role="list" aria-label="Projects">
          {visibleProjects.map((project) => {
            const tagLine = project.tags.slice(0, 2).join("  •  ");
            const image = project.thumbnail ? (
              <img
                src={project.thumbnail}
                alt={project.title}
                loading="lazy"
                decoding="async"
                className="projects-editorial__image"
              />
            ) : (
              <div className="projects-editorial__image projects-editorial__image--empty" />
            );

            return (
              <article key={project.slug} className="projects-editorial__card" role="listitem">
                {project.githubLink ? (
                  <a
                    className="projects-editorial__image-link"
                    href={project.githubLink}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open ${project.title}`}
                  >
                    {image}
                  </a>
                ) : (
                  <div className="projects-editorial__image-link">{image}</div>
                )}

                <div className="projects-editorial__body">
                  <h3 className="projects-editorial__card-title">{project.title}</h3>
                  <p className="projects-editorial__card-summary">{project.summary}</p>
                  {tagLine ? <p className="projects-editorial__tags">{tagLine}</p> : null}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProjectsSection;
