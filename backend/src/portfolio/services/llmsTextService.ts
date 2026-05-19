import type { PortfolioSnapshot } from "../contracts";

export const DEFAULT_PUBLIC_SITE_URL = "https://www.kushagrabharti.com";

const formatLinkList = (links: { label: string; href: string }[]) =>
  links.map((link) => `- ${link.label}: ${link.href}`).join("\n");

const formatStringList = (items: string[]) =>
  items.map((item) => `- ${item}`).join("\n");

const publicRecentWorks = [
  {
    title: "MonopolyBench",
    description:
      "Benchmarking long-horizon strategic reasoning in LLM agents through repeatable Monopoly simulations, schema-typed tool calls, and inspectable decision traces. Open to collaborators interested in turning this into a publishable research paper.",
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
  },
];

const formatRecentWorks = () =>
  publicRecentWorks
    .map((work, index) =>
      [
        `### ${String(index + 1).padStart(2, "0")} ${work.title}`,
        work.description,
      ].join("\n"),
    )
    .join("\n\n");

const formatEducation = (education: PortfolioSnapshot["education"]) =>
  education
    .map((entry) =>
      [
        `### ${entry.position}`,
        `Date Range: ${entry.dateRange}`,
        `Focus: ${entry.focus}`,
        `Description: ${entry.description}`,
        `Link: ${entry.schoolLink}`,
      ].join("\n"),
    )
    .join("\n\n");

const formatExperiences = (experiences: PortfolioSnapshot["experiences"]) =>
  experiences
    .map((entry) =>
      [
        `### ${entry.position}`,
        `Category: ${entry.category}`,
        `Timeline Tone: ${entry.timelineTone}`,
        `Summary: ${entry.summary}`,
        "Highlights:",
        ...entry.description.map((detail) => `- ${detail}`),
        `Tags: ${entry.tags.join(", ")}`,
        `Link: ${entry.companyLink}`,
      ].join("\n"),
    )
    .join("\n\n");

const formatProjects = (projects: PortfolioSnapshot["projects"]) =>
  projects
    .map((project) =>
      [
        `### ${project.title}`,
        `Summary: ${project.summary}`,
        "Highlights:",
        ...project.description.map((detail) => `- ${detail}`),
        `Tags: ${project.tags.join(", ")}`,
        `GitHub: ${project.githubLink || "N/A"}`,
      ].join("\n"),
    )
    .join("\n\n");

const formatMedia = (media: PortfolioSnapshot["media"]) =>
  media
    .map((item) =>
      [
        `### ${item.title}`,
        `Subtitle: ${item.subtitle}`,
        `Type: ${item.type}`,
        `Link: ${item.embedUrl}`,
      ].join("\n"),
    )
    .join("\n\n");

export const buildLlmsText = (
  snapshot: PortfolioSnapshot,
  siteUrl = DEFAULT_PUBLIC_SITE_URL,
) => `# ${snapshot.profile.name}

> ${snapshot.profile.headline}

Canonical site: ${siteUrl}
Primary AI page: ${siteUrl}/ai
Canonical llms.txt: ${siteUrl}/llms.txt
Structured JSON: ${siteUrl}/portfolio.json
Public API snapshot: ${siteUrl}/api/portfolio
Public API llms.txt: ${siteUrl}/api/portfolio/llms.txt
Robots: ${siteUrl}/robots.txt
Sitemap: ${siteUrl}/sitemap.xml
Generated At: ${snapshot.generatedAt}

## Crawl Instructions

This is the canonical plain-text portfolio for AI agents, search crawlers, and other automated readers.
Use /ai for plain semantic HTML, /llms.txt for plain text, /portfolio.json for structured JSON, and /api/portfolio for the live public API snapshot.
Do not infer private tracker data from this public portfolio surface.

## High Level Info

Name: ${snapshot.profile.name}
Headline: ${snapshot.profile.headline}
Personal Summary: ${snapshot.profile.personalSummary}
Primary Email: ${snapshot.profile.primaryEmail}
Latest Update: ${snapshot.intro.latestUpdate}
Fun Fact: ${snapshot.intro.funFact}
Featured Read: ${snapshot.intro.featuredRead.title} (${snapshot.intro.featuredRead.link})
Travel Plans: ${snapshot.intro.travelPlans}
Homepage Roles: builder.; researcher.; filmmaker.; tinkerer.
Homepage Summary: I build systems at the intersection of AI, data, and real-world impact.

### Socials
${formatLinkList(snapshot.profile.socialLinks)}

### Other Links
${formatLinkList(snapshot.profile.externalLinks)}

## About Me

Heading: ${snapshot.about.introHeading}
Intro: ${snapshot.about.introBody}

### Current Projects
${formatStringList(snapshot.about.currentProjects)}

### Current Learning
${formatStringList(snapshot.about.currentLearning)}

### Interests Outside Technology
${formatStringList(snapshot.about.interestsOutsideTechnology)}

## Recent Works From Public Homepage

${formatRecentWorks()}

## Education

${formatEducation(snapshot.education)}

## Experiences

${formatExperiences(snapshot.experiences)}

## Projects

${formatProjects(snapshot.projects)}

## Film and Creative Work

${formatMedia(snapshot.media)}

## Contact

Open to internships, research collaborations, and ambitious builds.
${formatLinkList(snapshot.profile.socialLinks)}
`;
