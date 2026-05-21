import React from "react";
import PortfolioNavbar from "../components/PortfolioNavbar";
import PortfolioImage from "../components/PortfolioImage";
import HeroLandingSection from "../sections/hero/HeroLandingSection";
import { homepageBootstrap } from "../generated/homepageBootstrap";
import type { PortfolioSocialLink } from "../api/contracts";

export type HomePageSectionKey =
  | "about"
  | "featured"
  | "experiences"
  | "projects"
  | "film"
  | "misc";
export type HomePageSectionComponent = React.ComponentType;

const featuredProjects = [
  {
    index: "01",
    title: "MonopolyBench",
    description:
      "Benchmarking long-horizon strategic reasoning in LLM agents through repeatable Monopoly simulations, schema-typed tool calls, and inspectable decision traces. Open to collaborators interested in turning this into a publishable research paper.",
    image: "/portfolio/projects/monopoly-llm-benchmark.svg",
    imageAlt: "Monopoly board visual",
  },
  {
    index: "02",
    title: "IMC Prosperity",
    description:
      "Competing in IMC's global trading challenge, combining manual strategy with Python-based algorithmic trading across simulated markets. Currently top 7% globally by overall score.",
    image: "/portfolio/projects/imc-prosperity.png",
    imageAlt: "IMC Prosperity trading challenge visual",
  },
  {
    index: "03",
    title: "LeetCode Practice",
    description:
      "Solving difficult algorithm problems daily in Python, keeping paper notes alongside code to sharpen pattern recognition, implementation speed, and proof-level reasoning.",
    image: "/portfolio/projects/leetcode-logo.png",
    imageAlt: "LeetCode logo",
    imageFit: "contain",
  },
  {
    index: "04",
    title: "F1 Optimization",
    description:
      "Rebuilding the racing optimization project with a 2D physics simulation, then extending it into a multi-agent PPO reinforcement learning system for strategy and control.",
    image: "/portfolio/projects/f1-optimization.png",
    imageAlt: "Formula 1 optimization visual",
  },
];

const filmShell = [
  {
    index: "01",
    year: "2022",
    genre: "documentary",
    duration: "11 min",
    title: "Dining Hall Documentary",
    description:
      "A documentary following the St. Stephen's dining hall staff from the start of their day to the end.",
    roles: ["Director", "Cinematographer", "Editor"],
  },
  {
    index: "02",
    year: "2023",
    genre: "documentary",
    duration: "13 min",
    title: "The PB&J Documentary",
    description:
      "A comedic documentary about obsession, mentorship, and the perfect PB&J sandwich.",
    roles: ["Director", "Cinematographer", "Editor"],
  },
  {
    index: "03",
    year: "2018",
    genre: "recap",
    duration: "3 min",
    title: "RTMS Semesterly Recap",
    description:
      "A semester photo montage focused on rhythm, pacing, and raw editing craft.",
    roles: ["Editor", "Photographer", "Story Builder"],
  },
];

const getDisplayValue = (link: PortfolioSocialLink) => {
  if (link.label.toLowerCase() === "email") {
    return link.href.replace("mailto:", "");
  }

  try {
    const url = new URL(link.href);
    return url.pathname.replace(/\/+$/, "") || url.hostname;
  } catch {
    return link.href;
  }
};

const contactLabels = ["Email", "LinkedIn", "GitHub", "X"];

const FeaturedWritingShell: React.FC<{
  writings: typeof homepageBootstrap.writings;
}> = ({ writings }) => {
  if (!writings.length) return null;

  return (
    <div className="about-editorial__values">
      <p className="about-editorial__values-heading">
        {`{ values / beliefs / writings / thoughts }`}
      </p>
      <div className="about-editorial__writing-grid">
        <ul
          className="about-editorial__writing-list"
          aria-label="Featured writings"
        >
          {writings.map((writing, index) => (
            <li key={writing.slug}>
              <span className="about-editorial__writing-index">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="about-editorial__writing-copy">
                <p className="about-editorial__writing-title">
                  {writing.title}
                </p>
                <p className="about-editorial__writing-summary">
                  {writing.summary}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const HomePageShell: React.FC<{
  enhancedSections?: Partial<
    Record<HomePageSectionKey, HomePageSectionComponent>
  >;
}> = ({ enhancedSections = {} }) => {
  const snapshot = homepageBootstrap;
  const AboutEnhanced = enhancedSections.about;
  const FeaturedEnhanced = enhancedSections.featured;
  const ExperiencesEnhanced = enhancedSections.experiences;
  const ProjectsEnhanced = enhancedSections.projects;
  const FilmEnhanced = enhancedSections.film;
  const MiscEnhanced = enhancedSections.misc;
  const projects = snapshot.projects.slice(0, 6);
  const contactLinks = contactLabels
    .map((label) =>
      snapshot.profile.socialLinks.find((link) => link.label === label),
    )
    .filter((link): link is PortfolioSocialLink => Boolean(link));

  return (
    <div className="portfolio-overhaul-page">
      <PortfolioNavbar />
      <section id="intro">
        <HeroLandingSection />
      </section>

      <section
        id="about"
        className="homepage-shell-section"
        data-shell-section="about"
      >
        {AboutEnhanced ? (
          <AboutEnhanced />
        ) : (
          <section className="about-editorial">
            <div className="about-editorial__inner">
              <div className="about-editorial__copy">
                <h2 className="about-editorial__title">
                  About <span>me</span>
                </h2>
                <div className="about-editorial__body">
                  <p>{snapshot.about.introHeading}</p>
                  <p>{snapshot.about.introBody}</p>
                </div>
                <FeaturedWritingShell writings={snapshot.writings} />
              </div>
              <div className="about-editorial__visual">
                <div className="about-editorial__frame about-editorial__frame--back" />
                <div className="about-editorial__frame about-editorial__frame--front">
                  <div className="about-editorial__tape" />
                  <PortfolioImage
                    src="/portfolio/profile/headshot.png"
                    alt="Kushagra Bharti portrait"
                    className="about-editorial__image"
                    loading="lazy"
                    decoding="async"
                    sizes="(max-width: 700px) 82vw, 430px"
                  />
                </div>
                <p className="about-editorial__coordinates">
                  <span>25.2048° N, 55.2708° E</span>
                  <span>+</span>
                </p>
              </div>
            </div>
          </section>
        )}
      </section>

      <section
        id="featured"
        className="homepage-shell-section"
        data-shell-section="featured"
      >
        {FeaturedEnhanced ? (
          <FeaturedEnhanced />
        ) : (
          <section className="featured-editorial">
            <div className="featured-editorial__inner">
              <div className="featured-editorial__intro">
                <h2 className="featured-editorial__title">
                  <span>Recent</span>
                  <span>Works</span>
                </h2>
                <p className="featured-editorial__summary">
                  Exploring the frontier of tech: agents, algorithms, and machine learning.
                </p>
              </div>
              <div
                className="featured-editorial__list"
                aria-label="Selected work"
              >
                {featuredProjects.map((project) => (
                  <article
                    key={project.index}
                    className="featured-editorial__item"
                  >
                    <div className="featured-editorial__image-wrap">
                      <PortfolioImage
                        src={project.image}
                        alt={project.imageAlt}
                        className={`featured-editorial__image${
                          project.imageFit === "contain"
                            ? " featured-editorial__image--contain"
                            : ""
                        }`}
                        loading="lazy"
                        decoding="async"
                        sizes="(max-width: 900px) 92vw, 384px"
                      />
                    </div>
                    <div className="featured-editorial__meta">
                      <p className="featured-editorial__index">
                        {project.index}
                      </p>
                      <h3 className="featured-editorial__item-title">
                        {project.title}
                      </h3>
                      <p className="featured-editorial__description">
                        {project.description}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}
      </section>

      <section
        id="experiences"
        className="homepage-shell-section"
        data-shell-section="experiences"
      >
        {ExperiencesEnhanced ? (
          <ExperiencesEnhanced />
        ) : (
          <section className="experiences-editorial">
            <div className="experiences-editorial__inner">
              <div className="experiences-editorial__intro">
                <h2 className="experiences-editorial__title">Experiences</h2>
                <p className="experiences-editorial__summary">
                  Places, teams, and problems that shaped how I build.
                </p>
              </div>
              <div
                className="experiences-editorial__timeline"
                aria-label="Experience timeline"
              >
                {snapshot.experiences.map((experience) => (
                  <article
                    key={experience.slug}
                    className={`experiences-editorial__item is-${experience.timelineTone}`}
                  >
                    <div
                      className="experiences-editorial__track"
                      aria-hidden="true"
                    >
                      <span className="experiences-editorial__marker" />
                    </div>
                    <p className="experiences-editorial__date">
                      {experience.dateRange}
                    </p>
                    <div className="experiences-editorial__content">
                      <p className="experiences-editorial__category">
                        {experience.category}
                      </p>
                      <h3 className="experiences-editorial__role">
                        {experience.position}
                      </h3>
                      <p className="experiences-editorial__description">
                        {experience.summary}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}
      </section>

      <section
        id="projects"
        className="homepage-shell-section"
        data-shell-section="projects"
      >
        {ProjectsEnhanced ? (
          <ProjectsEnhanced />
        ) : (
          <section
            className="projects-editorial"
            aria-labelledby="projects-title"
          >
            <div className="projects-editorial__inner">
              <aside className="projects-editorial__intro">
                <div className="projects-editorial__intro-copy">
                  <h2 id="projects-title" className="projects-editorial__title">
                    Projects
                  </h2>
                  <p className="projects-editorial__summary">
                    Software (and some hardware) I have designed, built, and shipped.
                  </p>
                </div>
              </aside>
              <div
                className="projects-editorial__grid"
                role="list"
                aria-label="Projects"
              >
                {projects.map((project) => (
                  <article
                    key={project.slug}
                    className="projects-editorial__card"
                    role="listitem"
                  >
                    {project.githubLink ? (
                      <a
                        className="projects-editorial__image-link"
                        href={project.githubLink}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open ${project.title}`}
                      >
                        {project.thumbnail ? (
                          <PortfolioImage
                            src={project.thumbnail}
                            alt={project.title}
                            className="projects-editorial__image"
                            loading="lazy"
                            decoding="async"
                            sizes="(max-width: 640px) 92vw, (max-width: 980px) 44vw, 300px"
                          />
                        ) : (
                          <div className="projects-editorial__image projects-editorial__image--empty" />
                        )}
                      </a>
                    ) : (
                      <div className="projects-editorial__image-link">
                        {project.thumbnail ? (
                          <PortfolioImage
                            src={project.thumbnail}
                            alt={project.title}
                            className="projects-editorial__image"
                            loading="lazy"
                            decoding="async"
                            sizes="(max-width: 640px) 92vw, (max-width: 980px) 44vw, 300px"
                          />
                        ) : (
                          <div className="projects-editorial__image projects-editorial__image--empty" />
                        )}
                      </div>
                    )}
                    <div className="projects-editorial__body">
                      <h3 className="projects-editorial__card-title">
                        {project.title}
                      </h3>
                      <p className="projects-editorial__card-summary">
                        {project.summary}
                      </p>
                      <p className="projects-editorial__tags">
                        {project.tags.slice(0, 2).join("  •  ")}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}
      </section>

      <section
        id="film"
        className="homepage-shell-section"
        data-shell-section="film"
      >
        {FilmEnhanced ? (
          <FilmEnhanced />
        ) : (
          <section className="film-editorial" aria-labelledby="film-title">
            <div className="film-editorial__inner">
              <aside className="film-editorial__intro">
                <div className="film-editorial__intro-copy">
                  <h2 id="film-title" className="film-editorial__title">
                    Film
                  </h2>
                  <p className="film-editorial__summary">
                    Stories and taste make us human, and I enjoy telling them through the lens.
                  </p>
                </div>
              </aside>
              <div className="film-editorial__main">
                <div
                  className="film-editorial__player-shell"
                  aria-hidden="true"
                />
                <div className="film-editorial__details">
                  <p className="film-editorial__active-kicker">
                    {filmShell[0].year} / {filmShell[0].genre} /{" "}
                    {filmShell[0].duration}
                  </p>
                  <h3 className="film-editorial__active-title">
                    {filmShell[0].title}
                  </h3>
                  <p className="film-editorial__active-description">
                    {filmShell[0].description}
                  </p>
                </div>
              </div>
              <div className="film-editorial__sidebar">
                <div
                  className="film-editorial__list"
                  role="list"
                  aria-label="Film portfolio list"
                >
                  {filmShell.map((film, index) => (
                    <div
                      key={film.title}
                      className={`film-editorial__list-item${index === 0 ? " is-active" : ""}`}
                      role="listitem"
                    >
                      <span className="film-editorial__list-index">
                        {film.index}
                      </span>
                      <span className="film-editorial__list-title">
                        {film.title}
                      </span>
                    </div>
                  ))}
                </div>
                <ul className="film-editorial__roles" aria-label="Film roles">
                  {filmShell[0].roles.map((role) => (
                    <li key={role}>{role}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}
      </section>

      <section
        id="misc"
        className="homepage-shell-section"
        data-shell-section="misc"
      >
        {MiscEnhanced ? (
          <MiscEnhanced />
        ) : (
          <section className="misc-editorial" aria-labelledby="misc-title">
            <div className="misc-editorial__inner">
              <div className="misc-editorial__copy">
                <h2 id="misc-title" className="misc-editorial__title">
                  <span>Let&apos;s build</span>
                  <span>something</span>
                  <span className="is-accent">meaningful.</span>
                </h2>
                <p className="misc-editorial__summary">
                  Open to internships, research collaborations, and ambitious
                  builds.
                </p>
                <div className="misc-editorial__dash" aria-hidden="true" />
                <div className="misc-editorial__contacts">
                  {contactLinks.map((link) => (
                    <div
                      key={link.label}
                      className="misc-editorial__contact-item"
                    >
                      <p className="misc-editorial__contact-label">
                        {link.label}
                      </p>
                      <a
                        href={link.href}
                        className="misc-editorial__contact-value"
                        target={link.label === "Email" ? undefined : "_blank"}
                        rel={link.label === "Email" ? undefined : "noreferrer"}
                      >
                        {getDisplayValue(link)}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
              <div className="misc-editorial__visual" aria-hidden="true">
                <div className="misc-editorial__orbit misc-editorial__orbit--far" />
                <div className="misc-editorial__orbit misc-editorial__orbit--outer" />
                <div className="misc-editorial__orbit misc-editorial__orbit--middle" />
                <div className="misc-editorial__orbit misc-editorial__orbit--inner" />
                <div className="misc-editorial__cosmos" />
              </div>
            </div>
          </section>
        )}
      </section>
    </div>
  );
};

export default HomePageShell;
