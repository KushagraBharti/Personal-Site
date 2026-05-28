import type { PortfolioSnapshot } from "../contracts";

export const DEFAULT_PUBLIC_SITE_URL = "https://www.kushagrabharti.com";

const formatLinkList = (links: { label: string; href: string }[]) =>
  links.map((link) => `- ${link.label}: ${link.href}`).join("\n");

const formatStringList = (items: string[]) =>
  items.map((item) => `- ${item}`).join("\n");

const formatPrimarySources = (siteUrl: string) =>
  [
    `- [Canonical portfolio homepage](${siteUrl}): Public visual portfolio homepage.`,
    `- [AI-readable HTML profile](${siteUrl}/ai): Full semantic profile with experience, projects, education, writings, creative work, and crawler notes.`,
    `- [Plain-text llms.txt](${siteUrl}/llms.txt): This generated Markdown guide for automated readers.`,
  ].join("\n");

const formatOptionalSources = (siteUrl: string) =>
  [
    `- [Structured portfolio JSON](${siteUrl}/portfolio.json): Static structured portfolio snapshot.`,
    `- [Live public portfolio API](${siteUrl}/api/portfolio): Backend-owned public portfolio snapshot.`,
    `- [Live public API llms.txt](${siteUrl}/api/portfolio/llms.txt): Runtime-generated plain-text profile.`,
    `- [Robots policy](${siteUrl}/robots.txt): Crawler permissions for the public portfolio surface.`,
    `- [Sitemap](${siteUrl}/sitemap.xml): Indexable public portfolio URLs.`,
    `- [Build metadata](${siteUrl}/version.json): Static export generation metadata and canonical export URLs.`,
  ].join("\n");

const hardcodedKeyFacts = [
  "I am a student and software engineer, but I do not fit cleanly into one lane. I move between machine learning, AI agents, full-stack products, research tooling, data systems, computer vision, optimization, trading experiments, and the occasional hardware or film project.",
  "A lot of my work starts with a question I cannot leave alone. Can LLM agents actually plan over a full game? Can pose tracking be cleaned up enough for real lab workflows? Can a product keep artifacts and context instead of turning everything into another chat thread?",
  "I like building the whole loop: the core engine, the UI, the data model, the tests, the telemetry, the failure cases, and the writeup. I do not enjoy stopping at a demo if the interesting part is still hidden.",
  "MonopolyBench is my main AI research bet right now: a deterministic multi-agent environment for studying long-horizon planning, negotiation, deception, and bias through full Monopoly games.",
  "At UT Southwestern, I have been working on computer vision for behavioral neuroscience: DeepLabCut/SuperAnimal pipelines, pose cleanup, behavior scoring, QC outputs, and CSV/XLSX scorecards researchers can actually inspect.",
  "I have worked in real company environments too. At Abilitie, I contributed to an LLM role-play training product with React, TypeScript, provider plumbing, telemetry, prompt work, open-source model fine-tuning, latency improvements, and cost reduction. At Glydr.gg, I have been leading technical and product direction for a customer-facing configuration hub with React/Vite, Fastify, Postgres, Steam auth, admin tooling, and Railway deployment.",
  "I have also built products and systems outside research: Pact, Beyond Chat, NovelBench, PseudoLawyer, Arachne, a personal portfolio/tracker, quant trading tooling, and smaller ML, hardware, and algorithm projects.",
  "I care about legibility. If a model makes a decision, I want traces. If a benchmark gives a score, I want the run artifacts. If a pipeline produces a number, I want to know where it came from and where it can fail.",
  "I care about taste too. The interface matters. The data model matters. The story matters. A thing can pass tests and still feel wrong.",
  "Film is part of the same instinct for me. Framing, pacing, selection, and restraint show up in software more than people admit.",
  "I am looking for work where I can learn quickly, own hard problems, build real systems, and stay honest about what is broken.",
];

const formatExperiences = (experiences: PortfolioSnapshot["experiences"]) =>
  experiences
    .map((entry) =>
      [
        `### ${entry.position}`,
        `Date Range: ${entry.dateRange}`,
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
        `Thumbnail: ${project.thumbnail || "N/A"}`,
      ].join("\n"),
    )
    .join("\n\n");

const formatWritings = (writings: PortfolioSnapshot["writings"]) =>
  writings
    .map((writing) =>
      [
        `### ${String(writing.order).padStart(2, "0")} ${writing.title}`,
        `Category: ${writing.category}`,
        `Summary: ${writing.summary}`,
        writing.markdown,
      ].join("\n"),
    )
    .join("\n\n");

const formatMediaActions = (
  actions: NonNullable<PortfolioSnapshot["media"][number]["actions"]>,
) => actions.map((action) => `- ${action.label}: ${action.url}`).join("\n");

const formatMediaItem = (item: PortfolioSnapshot["media"][number]) =>
  [
    `### ${String(item.order).padStart(2, "0")} ${item.title}`,
    `Slug: ${item.slug}`,
    `Title: ${item.title}`,
    `Short Title: ${item.shortTitle || "N/A"}`,
    `Subtitle: ${item.subtitle}`,
    `Year: ${item.year || "N/A"}`,
    `Genre: ${item.genre || "N/A"}`,
    `Duration: ${item.duration || "N/A"}`,
    `Summary: ${item.summary || "N/A"}`,
    `Description: ${item.description || "N/A"}`,
    `Roles: ${item.roles?.join(", ") || "N/A"}`,
    item.notes?.length ? ["Recognition / Notes:", ...formatStringList(item.notes).split("\n")].join("\n") : "Recognition / Notes: N/A",
    `Type: ${item.type}`,
    `Platform: ${item.platform || "N/A"}`,
    `Watch URL: ${item.watchUrl || "N/A"}`,
    `Embed URL: ${item.embedUrl}`,
    item.actions?.length
      ? ["Actions:", formatMediaActions(item.actions)].join("\n")
      : "Actions: N/A",
  ].join("\n");

const formatFilmAndCreativeWork = (snapshot: PortfolioSnapshot) => {
  const filmPortfolioLink = snapshot.profile.externalLinks.find((link) =>
    link.label.toLowerCase().includes("film"),
  );
  const filmmakingInterests = snapshot.about.interestsOutsideTechnology.filter(
    (item) => /film|video|direct|cinema|editor|videographer/i.test(item),
  );

  return [
    "Section Summary: Stories and taste make us human, and I enjoy telling them through the lens.",
    "Filmmaking Profile:",
    formatStringList([
      snapshot.intro.funFact,
      ...filmmakingInterests,
      ...(filmPortfolioLink
        ? [`${filmPortfolioLink.label}: ${filmPortfolioLink.href}`]
        : []),
    ]),
    ...snapshot.media.map(formatMediaItem),
  ].join("\n\n");
};

export const buildLlmsText = (
  snapshot: PortfolioSnapshot,
  siteUrl = DEFAULT_PUBLIC_SITE_URL,
) =>
  [
    "# Kushagra Bharti",
    "> Student | Software Engineer | ML Enthusiast.",
    "I am a student and software builder who enjoys learning and expanding my skillset.",
    "## Primary Sources",
    formatPrimarySources(siteUrl),
    "Key facts:\n" + formatStringList(hardcodedKeyFacts),
    "## Contact and External Profiles",
    formatLinkList([
      ...snapshot.profile.socialLinks,
      ...snapshot.profile.externalLinks,
    ]),
    "## Values and Writings and Predictions",
    formatWritings(snapshot.writings),
    "## Experience Links",
    formatExperiences(snapshot.experiences),
    "## Project Source Links",
    formatProjects(snapshot.projects),
    "## Film and Creative Work",
    formatFilmAndCreativeWork(snapshot),
    "## Optional",
    formatOptionalSources(siteUrl),
  ].join("\n\n") + "\n";
