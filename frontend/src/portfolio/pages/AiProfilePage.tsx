import React, { useEffect, useState } from "react";
import GlassCard from "../../shared/components/ui/GlassCard";
import { fetchPortfolioSnapshot } from "../api/portfolioApi";
import type { PortfolioSnapshot } from "../api/contracts";

const sectionClasses =
  "w-full max-w-none mx-0 p-6 md:p-8 text-slate-100 space-y-5 ai-profile-card";

const AiProfile: React.FC = () => {
  const [snapshot, setSnapshot] = useState<PortfolioSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadSnapshot = async () => {
      try {
        setSnapshot(await fetchPortfolioSnapshot(controller.signal));
      } catch (loadError) {
        if (!controller.signal.aborted) {
          console.error("Failed to load portfolio snapshot:", loadError);
          setError("Unable to load the AI profile right now.");
        }
      }
    };

    loadSnapshot();

    return () => controller.abort();
  }, []);

  if (error) {
    return (
      <main className="ai-profile-shell">
        <div className="ai-profile-frame">
          <GlassCard className={`${sectionClasses} text-center`}>
            <h1 className="ai-profile-title">AI Profile</h1>
            <p className="text-base text-slate-200">{error}</p>
          </GlassCard>
        </div>
      </main>
    );
  }

  if (!snapshot) {
    return (
      <main className="ai-profile-shell">
        <div className="ai-profile-frame">
          <GlassCard className={`${sectionClasses} animate-pulse`}>
            <div className="h-5 w-48 rounded-full bg-white/20" />
            <div className="h-16 w-full rounded-2xl bg-white/10" />
            <div className="h-5 w-40 rounded-full bg-white/20" />
            <div className="space-y-3">
              <div className="h-4 w-full rounded-full bg-white/10" />
              <div className="h-4 w-11/12 rounded-full bg-white/10" />
              <div className="h-4 w-10/12 rounded-full bg-white/10" />
            </div>
          </GlassCard>
        </div>
      </main>
    );
  }

  const { profile, about, intro, education, experiences, projects, media, generatedAt } = snapshot;

  return (
    <main className="ai-profile-shell">
      <div className="ai-profile-frame">
        <section className="ai-profile-hero">
          <p className="ai-profile-kicker">Canonical AI Summary Source</p>
          <h1 className="ai-profile-title">{profile.name}</h1>
          <p className="ai-profile-subtitle">{profile.headline}</p>
          <p className="ai-profile-summary">{profile.personalSummary}</p>
          <div className="ai-profile-meta-grid">
            <div className="ai-profile-meta-pill">
              <span className="ai-profile-meta-label">Latest update</span>
              <span>{intro.latestUpdate}</span>
            </div>
            <div className="ai-profile-meta-pill">
              <span className="ai-profile-meta-label">Fun fact</span>
              <span>{intro.funFact}</span>
            </div>
            <div className="ai-profile-meta-pill">
              <span className="ai-profile-meta-label">Featured read</span>
              <a href={intro.featuredRead.link} target="_blank" rel="noopener noreferrer">
                {intro.featuredRead.title}
              </a>
            </div>
            <div className="ai-profile-meta-pill">
              <span className="ai-profile-meta-label">Generated</span>
              <time dateTime={generatedAt}>{new Date(generatedAt).toLocaleString()}</time>
            </div>
          </div>
        </section>

        <GlassCard className={sectionClasses}>
          <div className="ai-profile-section-heading">
            <h2>High Level Info</h2>
            <p>Primary links, contact points, and site-level references.</p>
          </div>
          <div className="ai-profile-link-groups">
            <div>
              <h3>Socials</h3>
              <ul className="ai-profile-link-list">
                {profile.socialLinks.map((link) => (
                  <li key={link.label}>
                    <span>{link.label}</span>
                    <a href={link.href} target="_blank" rel="noopener noreferrer">
                      {link.href}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Other Links</h3>
              <ul className="ai-profile-link-list">
                {profile.externalLinks.map((link) => (
                  <li key={link.label}>
                    <span>{link.label}</span>
                    <a href={link.href} target="_blank" rel="noopener noreferrer">
                      {link.href}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </GlassCard>

        <GlassCard className={sectionClasses}>
          <div className="ai-profile-section-heading">
            <h2>About Me</h2>
            <p>{about.introHeading}</p>
          </div>
          <p className="text-lg leading-8 text-slate-100">{about.introBody}</p>
          <div className="ai-profile-about-grid">
            <div>
              <h3>Current Projects</h3>
              <ul className="ai-profile-bullet-list">
                {about.currentProjects.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Current Learning</h3>
              <ul className="ai-profile-bullet-list">
                {about.currentLearning.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="ai-profile-about-span">
              <h3>Interests Outside Technology</h3>
              <ul className="ai-profile-bullet-list">
                {about.interestsOutsideTechnology.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </GlassCard>

        <GlassCard className={sectionClasses}>
          <div className="ai-profile-section-heading">
            <h2>Creative Work</h2>
            <p>Backend-owned media metadata mirrored into the AI profile surface.</p>
          </div>
          <div className="ai-profile-stack">
            {media.map((item) => (
              <article key={item.slug} className="ai-profile-entry">
                <div className="ai-profile-entry-header">
                  <h3>{item.title}</h3>
                  <span>{item.subtitle}</span>
                </div>
                <a href={item.embedUrl} target="_blank" rel="noopener noreferrer">
                  {item.embedUrl}
                </a>
              </article>
            ))}
          </div>
        </GlassCard>

        <GlassCard className={sectionClasses}>
          <div className="ai-profile-section-heading">
            <h2>Education</h2>
            <p>All education entries currently published on the site.</p>
          </div>
          <div className="ai-profile-stack">
            {education.map((entry) => (
              <article key={`${entry.position}-${entry.dateRange}`} className="ai-profile-entry">
                <div className="ai-profile-entry-header">
                  <h3>{entry.position}</h3>
                  <span>{entry.dateRange}</span>
                </div>
                <p className="ai-profile-entry-focus">{entry.focus}</p>
                <p>{entry.description}</p>
                <a href={entry.schoolLink} target="_blank" rel="noopener noreferrer">
                  {entry.schoolLink}
                </a>
              </article>
            ))}
          </div>
        </GlassCard>

        <GlassCard className={sectionClasses}>
          <div className="ai-profile-section-heading">
            <h2>Experiences</h2>
            <p>Every experience entry, kept in sync with the main portfolio data.</p>
          </div>
          <div className="ai-profile-stack">
            {experiences.map((entry) => (
              <article key={entry.position} className="ai-profile-entry">
                <div className="ai-profile-entry-header">
                  <h3>{entry.position}</h3>
                </div>
                <p className="ai-profile-entry-focus">{entry.summary}</p>
                <ul className="ai-profile-bullet-list">
                  {entry.description.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
                <p className="ai-profile-tags">{entry.tags.join(" • ")}</p>
                <a href={entry.companyLink} target="_blank" rel="noopener noreferrer">
                  {entry.companyLink}
                </a>
              </article>
            ))}
          </div>
        </GlassCard>

        <GlassCard className={sectionClasses}>
          <div className="ai-profile-section-heading">
            <h2>Projects</h2>
            <p>All projects currently represented in the portfolio data source.</p>
          </div>
          <div className="ai-profile-stack">
            {projects.map((project) => (
              <article key={project.title} className="ai-profile-entry">
                <div className="ai-profile-entry-header">
                  <h3>{project.title}</h3>
                </div>
                <p className="ai-profile-entry-focus">{project.summary}</p>
                <ul className="ai-profile-bullet-list">
                  {project.description.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
                <p className="ai-profile-tags">{project.tags.join(" • ")}</p>
                {project.githubLink ? (
                  <a href={project.githubLink} target="_blank" rel="noopener noreferrer">
                    {project.githubLink}
                  </a>
                ) : (
                  <span className="text-slate-300">No public link listed.</span>
                )}
              </article>
            ))}
          </div>
        </GlassCard>
      </div>
    </main>
  );
};

export default AiProfile;
