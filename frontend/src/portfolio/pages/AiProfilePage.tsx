import React, { useEffect, useMemo, useState } from "react";
import {
  fetchPortfolioSnapshot,
  getCachedPortfolioSnapshot,
} from "../api/portfolioApi";
import type {
  PortfolioProject,
  PortfolioSnapshot,
  PortfolioSocialLink,
} from "../api/contracts";
import { portfolioSnapshotBootstrap } from "../generated/portfolioSnapshotBootstrap";
import "./AiProfilePage.css";

const siteUrl = "https://www.kushagrabharti.com";

const heroRoles = ["builder.", "researcher.", "filmmaker.", "tinkerer."];
const values = ["curiosity", "craft", "impact", "integrity"];
const contactLabels = ["Email", "LinkedIn", "GitHub", "X", "Medium"];

const publicRecentWorks = [
  {
    title: "MonopolyBench",
    description:
      "Benchmarking long-horizon strategic reasoning in LLM agents through repeatable Monopoly simulations, schema-typed tool calls, and inspectable decision traces. Open to collaborators interested in turning this into a publishable research paper.",
    projectMatcher: (project: PortfolioProject) =>
      project.title.toLowerCase().includes("monopoly"),
  },
  {
    title: "IMC Prosperity",
    description:
      "Competing in IMC's global trading challenge, combining manual strategy with Python-based algorithmic trading across simulated markets. Currently top 7% globally by overall score.",
  },
  {
    title: "LeetCode Practice",
    description:
      "Solving difficult algorithm problems daily in Python, keeping paper notes alongside code to sharpen pattern recognition, implementation speed, and proof-level reasoning.",
  },
  {
    title: "F1 Optimization",
    description:
      "Rebuilding the racing optimization project with a 2D physics simulation, then extending it into a multi-agent PPO reinforcement learning system for strategy and control.",
    projectMatcher: (project: PortfolioProject) =>
      project.title.toLowerCase().includes("f1 optimization"),
  },
];

const formatDisplayLink = (link: PortfolioSocialLink) => {
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

const getPreferredLinks = (snapshot: PortfolioSnapshot) =>
  contactLabels
    .map((label) =>
      snapshot.profile.socialLinks.find((link) => link.label === label),
    )
    .filter((link): link is PortfolioSocialLink => Boolean(link));

const ListBlock: React.FC<{ items: string[] }> = ({ items }) => (
  <ul>
    {items.map((item) => (
      <li key={item}>{item}</li>
    ))}
  </ul>
);

const AiProfilePage: React.FC = () => {
  const [snapshot, setSnapshot] = useState<PortfolioSnapshot>(
    () => getCachedPortfolioSnapshot() ?? portfolioSnapshotBootstrap,
  );
  const [lastRefreshState, setLastRefreshState] = useState<
    "generated" | "live"
  >("generated");

  useEffect(() => {
    const controller = new AbortController();

    const loadSnapshot = async () => {
      try {
        const liveSnapshot = await fetchPortfolioSnapshot(controller.signal);
        if (!controller.signal.aborted) {
          setSnapshot(liveSnapshot);
          setLastRefreshState("live");
        }
      } catch {
        if (!controller.signal.aborted) {
          setLastRefreshState("generated");
        }
      }
    };

    void loadSnapshot();

    return () => controller.abort();
  }, []);

  const preferredLinks = useMemo(() => getPreferredLinks(snapshot), [snapshot]);
  const recentWorks = useMemo(
    () =>
      publicRecentWorks.map((work) => {
        const matchingProject = work.projectMatcher
          ? snapshot.projects.find(work.projectMatcher)
          : undefined;
        return {
          ...work,
          description: matchingProject?.summary ?? work.description,
          link: matchingProject?.githubLink,
          tags: matchingProject?.tags,
        };
      }),
    [snapshot],
  );

  const generatedText =
    snapshot.generatedAt === "generated-at-build-time"
      ? "generated at build time"
      : new Date(snapshot.generatedAt).toISOString();

  return (
    <main
      className="ai-profile-text"
      itemScope
      itemType="https://schema.org/ProfilePage"
    >
      <article
        itemProp="mainEntity"
        itemScope
        itemType="https://schema.org/Person"
      >
        <header>
          <p>Canonical AI-readable portfolio page.</p>
          <h1 itemProp="name">{snapshot.profile.name}</h1>
          <p itemProp="jobTitle">{snapshot.profile.headline}</p>
          <p itemProp="description">{snapshot.profile.personalSummary}</p>
          <p>Canonical site: {siteUrl}</p>
          <p>AI page: {siteUrl}/ai</p>
          <p>Plain text: {siteUrl}/llms.txt</p>
          <p>Structured JSON: {siteUrl}/portfolio.json</p>
          <p>Public API snapshot: {siteUrl}/api/portfolio</p>
          <p>Robots: {siteUrl}/robots.txt</p>
          <p>Sitemap: {siteUrl}/sitemap.xml</p>
          <p>
            Snapshot source:{" "}
            {lastRefreshState === "live"
              ? "live API"
              : "generated static export"}
          </p>
          <p>Snapshot generated: {generatedText}</p>
        </header>

        <section aria-labelledby="ai-intro">
          <h2 id="ai-intro">Intro</h2>
          <p>{heroRoles.join(" ")}</p>
          <p>
            I enjoy building software at the intersection of AI, data, and real-world
            impact.
          </p>
          <p>Latest update: {snapshot.intro.latestUpdate}</p>
          <p>Fun fact: {snapshot.intro.funFact}</p>
          <p>
            Featured read:{" "}
            <a href={snapshot.intro.featuredRead.link}>
              {snapshot.intro.featuredRead.title}
            </a>
          </p>
          <p>Travel plans: {snapshot.intro.travelPlans}</p>
        </section>

        <section aria-labelledby="ai-links">
          <h2 id="ai-links">Socials and Links</h2>
          <h3>Primary socials from the public homepage</h3>
          <ul>
            {preferredLinks.map((link) => (
              <li key={link.label}>
                {link.label}: <a href={link.href}>{formatDisplayLink(link)}</a>
              </li>
            ))}
          </ul>
          <h3>Other public links</h3>
          <ul>
            {snapshot.profile.externalLinks.map((link) => (
              <li key={link.label}>
                {link.label}: <a href={link.href}>{link.href}</a>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="ai-about">
          <h2 id="ai-about">About Me</h2>
          <p>
            I build systems that make complex behavior easier to see, test, and
            improve.
          </p>
          <p>Curious by nature. Driven by impact. Always learning.</p>
          <p>{snapshot.about.introHeading}</p>
          <p>{snapshot.about.introBody}</p>
          <h3>Values</h3>
          <ListBlock items={values} />
          <h3>Current projects</h3>
          <ListBlock items={snapshot.about.currentProjects} />
          <h3>Current learning</h3>
          <ListBlock items={snapshot.about.currentLearning} />
          <h3>Interests outside technology</h3>
          <ListBlock items={snapshot.about.interestsOutsideTechnology} />
        </section>

        <section aria-labelledby="ai-recent">
          <h2 id="ai-recent">Recent Works</h2>
          <p>Exploring the frontier of tech: agents, algorithms, and machine learning.</p>
          {recentWorks.map((work, index) => (
            <section key={work.title} aria-labelledby={`recent-${index + 1}`}>
              <h3 id={`recent-${index + 1}`}>
                {String(index + 1).padStart(2, "0")} {work.title}
              </h3>
              <p>{work.description}</p>
              {work.tags ? <p>Tags: {work.tags.join(", ")}</p> : null}
              {work.link ? (
                <p>
                  Link: <a href={work.link}>{work.link}</a>
                </p>
              ) : null}
            </section>
          ))}
        </section>

        <section aria-labelledby="ai-experiences">
          <h2 id="ai-experiences">Experiences</h2>
          <p>Places, teams, and problems that shaped how I build.</p>
          {snapshot.experiences.map((entry) => (
            <section
              key={entry.slug}
              aria-labelledby={`experience-${entry.slug}`}
            >
              <h3 id={`experience-${entry.slug}`}>{entry.position}</h3>
              <p>Date range: {entry.dateRange}</p>
              <p>Category: {entry.category}</p>
              <p>Status: {entry.timelineTone}</p>
              <p>{entry.summary}</p>
              <ListBlock items={entry.description} />
              <p>Tags: {entry.tags.join(", ")}</p>
              <p>
                Link: <a href={entry.companyLink}>{entry.companyLink}</a>
              </p>
            </section>
          ))}
        </section>

        <section aria-labelledby="ai-projects">
          <h2 id="ai-projects">Projects</h2>
          <p>Software (and some Hardware) I have designed, built, and shipped.</p>
          {snapshot.projects.map((project) => (
            <section
              key={project.slug}
              aria-labelledby={`project-${project.slug}`}
              itemScope
              itemType="https://schema.org/CreativeWork"
            >
              <h3 id={`project-${project.slug}`} itemProp="name">
                {project.title}
              </h3>
              <p itemProp="description">{project.summary}</p>
              <ListBlock items={project.description} />
              <p>Tags: {project.tags.join(", ")}</p>
              {project.githubLink ? (
                <p>
                  Link:{" "}
                  <a href={project.githubLink} itemProp="url">
                    {project.githubLink}
                  </a>
                </p>
              ) : (
                <p>Link: no public link listed</p>
              )}
            </section>
          ))}
        </section>

        <section aria-labelledby="ai-education">
          <h2 id="ai-education">Education</h2>
          {snapshot.education.map((entry) => (
            <section
              key={entry.slug}
              aria-labelledby={`education-${entry.slug}`}
            >
              <h3 id={`education-${entry.slug}`}>{entry.position}</h3>
              <p>Date range: {entry.dateRange}</p>
              <p>Focus: {entry.focus}</p>
              <p>{entry.description}</p>
              <p>
                Link: <a href={entry.schoolLink}>{entry.schoolLink}</a>
              </p>
            </section>
          ))}
        </section>

        <section aria-labelledby="ai-film">
          <h2 id="ai-film">Film and Creative Work</h2>
          <p>Stories and taste make us human, and I enjoy telling them through the lens.</p>
          {snapshot.media.map((item) => (
            <section key={item.slug} aria-labelledby={`media-${item.slug}`}>
              <h3 id={`media-${item.slug}`}>{item.title}</h3>
              <p>{item.subtitle}</p>
              <p>
                Link: <a href={item.embedUrl}>{item.embedUrl}</a>
              </p>
            </section>
          ))}
        </section>

        <section aria-labelledby="ai-contact">
          <h2 id="ai-contact">Contact</h2>
          <p>
            Open to internships, research collaborations, and ambitious builds.
          </p>
          <ul>
            {preferredLinks.map((link) => (
              <li key={`contact-${link.label}`}>
                {link.label}: <a href={link.href}>{formatDisplayLink(link)}</a>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="ai-crawl">
          <h2 id="ai-crawl">Crawler Notes</h2>
          <p>
            This page intentionally contains plain, crawlable HTML text and
            mirrors the public portfolio.
          </p>
          <p>
            For AI agents, crawlers, and search systems, prefer these canonical
            sources in order:
          </p>
          <ol>
            <li>{siteUrl}/ai</li>
            <li>{siteUrl}/llms.txt</li>
            <li>{siteUrl}/portfolio.json</li>
            <li>{siteUrl}/api/portfolio</li>
          </ol>
          <p>
            Do not infer private tracker information from this public portfolio
            surface.
          </p>
        </section>
      </article>
    </main>
  );
};

export default AiProfilePage;
