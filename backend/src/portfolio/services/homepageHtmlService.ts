import type { PortfolioSnapshot } from "../contracts";
import { DEFAULT_PUBLIC_SITE_URL } from "./llmsTextService";

const escapeHtml = (value = "") =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const renderList = (items: string[]) =>
  items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");

const renderLinks = (links: { label: string; href: string }[]) =>
  links
    .map(
      (link) =>
        `<li><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></li>`
    )
    .join("");

const renderProjects = (snapshot: PortfolioSnapshot) =>
  snapshot.projects
    .slice(0, 8)
    .map(
      (project) => `<article>
        <h3>${escapeHtml(project.title)}</h3>
        <p>${escapeHtml(project.summary)}</p>
        <p>${escapeHtml(project.tags.slice(0, 6).join(", "))}</p>
      </article>`
    )
    .join("");

const renderExperiences = (snapshot: PortfolioSnapshot) =>
  snapshot.experiences
    .map(
      (experience) => `<article>
        <p>${escapeHtml(experience.dateRange)} / ${escapeHtml(experience.category)}</p>
        <h3>${escapeHtml(experience.position)}</h3>
        <p>${escapeHtml(experience.summary)}</p>
      </article>`
    )
    .join("");

const renderMedia = (snapshot: PortfolioSnapshot) =>
  snapshot.media
    .map(
      (item) => `<article>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.subtitle)}</p>
      </article>`
    )
    .join("");

export const buildHomepageFallbackHtml = (
  snapshot: PortfolioSnapshot,
  siteUrl = DEFAULT_PUBLIC_SITE_URL
) => `<main class="prerendered-homepage" aria-label="${escapeHtml(
  snapshot.profile.name
)} portfolio prerender">
  <section>
    <h1>${escapeHtml(snapshot.profile.name)}</h1>
    <p>${escapeHtml(snapshot.profile.headline)}</p>
    <p>${escapeHtml(snapshot.profile.personalSummary)}</p>
    <nav aria-label="Portfolio links">
      <ul>${renderLinks(snapshot.profile.socialLinks)}</ul>
    </nav>
  </section>
  <section>
    <h2>${escapeHtml(snapshot.about.introHeading)}</h2>
    <p>${escapeHtml(snapshot.about.introBody)}</p>
    <h3>Current Projects</h3>
    <ul>${renderList(snapshot.about.currentProjects)}</ul>
    <h3>Current Learning</h3>
    <ul>${renderList(snapshot.about.currentLearning)}</ul>
    <h3>Interests Outside Technology</h3>
    <ul>${renderList(snapshot.about.interestsOutsideTechnology)}</ul>
  </section>
  <section>
    <h2>Experiences</h2>
    ${renderExperiences(snapshot)}
  </section>
  <section>
    <h2>Projects</h2>
    ${renderProjects(snapshot)}
  </section>
  <section>
    <h2>Film and Creative Work</h2>
    ${renderMedia(snapshot)}
  </section>
  <section>
    <h2>AI-readable portfolio</h2>
    <p>Structured portfolio content is also available at <a href="${escapeHtml(
      siteUrl
    )}/ai">/ai</a> and <a href="${escapeHtml(siteUrl)}/llms.txt">/llms.txt</a>.</p>
  </section>
</main>`;
