import React, { useEffect, useState } from "react";
import { fetchExperiences, getCachedPortfolioSnapshot } from "../../api/portfolioApi";
import type { PortfolioExperience } from "../../api/contracts";

const ExperiencesSection: React.FC = () => {
  const [experiences, setExperiences] = useState<PortfolioExperience[]>(
    () => getCachedPortfolioSnapshot()?.experiences ?? []
  );

  useEffect(() => {
    const controller = new AbortController();

    const loadExperiences = async () => {
      try {
        const response = await fetchExperiences(controller.signal);
        setExperiences(response);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Error fetching experiences:", error);
        }
      }
    };

    void loadExperiences();
    return () => controller.abort();
  }, []);

  return (
    <section className="experiences-editorial">
      <div className="experiences-editorial__inner">
        <div className="experiences-editorial__intro">
          <h2 className="experiences-editorial__title">Experiences</h2>
          <p className="experiences-editorial__summary">
            Places, teams, and problems that shaped how I build.
          </p>
        </div>

        <div className="experiences-editorial__timeline" aria-label="Experience timeline">
          {experiences.map((experience) => {
            return (
              <article
                key={experience.slug}
                className={`experiences-editorial__item is-${experience.timelineTone}`}
              >
                <div className="experiences-editorial__track" aria-hidden="true">
                  <span className="experiences-editorial__marker" />
                </div>
                <p className="experiences-editorial__date">{experience.dateRange}</p>
                <div className="experiences-editorial__content">
                  <p className="experiences-editorial__category">
                    {experience.category}
                  </p>
                  <h3 className="experiences-editorial__role">{experience.position}</h3>
                  <p className="experiences-editorial__description">{experience.summary}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ExperiencesSection;
