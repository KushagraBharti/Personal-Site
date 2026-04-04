"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildLlmsText = exports.DEFAULT_PUBLIC_SITE_URL = void 0;
exports.DEFAULT_PUBLIC_SITE_URL = "https://www.kushagrabharti.com";
const formatLinkList = (links) => links.map((link) => `- ${link.label}: ${link.href}`).join("\n");
const formatStringList = (items) => items.map((item) => `- ${item}`).join("\n");
const formatEducation = (education) => education
    .map((entry) => [
    `### ${entry.position}`,
    `Date Range: ${entry.dateRange}`,
    `Focus: ${entry.focus}`,
    `Description: ${entry.description}`,
    `Link: ${entry.schoolLink}`,
].join("\n"))
    .join("\n\n");
const formatExperiences = (experiences) => experiences
    .map((entry) => [
    `### ${entry.position}`,
    `Summary: ${entry.summary}`,
    "Highlights:",
    ...entry.description.map((detail) => `- ${detail}`),
    `Tags: ${entry.tags.join(", ")}`,
    `Link: ${entry.companyLink}`,
].join("\n"))
    .join("\n\n");
const formatProjects = (projects) => projects
    .map((project) => [
    `### ${project.title}`,
    `Summary: ${project.summary}`,
    "Highlights:",
    ...project.description.map((detail) => `- ${detail}`),
    `Tags: ${project.tags.join(", ")}`,
    `GitHub: ${project.githubLink || "N/A"}`,
].join("\n"))
    .join("\n\n");
const buildLlmsText = (snapshot, siteUrl = exports.DEFAULT_PUBLIC_SITE_URL) => `# ${snapshot.profile.name}

> ${snapshot.profile.headline}

Canonical site: ${siteUrl}
Primary AI page: ${siteUrl}/ai

## High Level Info

Name: ${snapshot.profile.name}
Headline: ${snapshot.profile.headline}
Personal Summary: ${snapshot.profile.personalSummary}
Primary Email: ${snapshot.profile.primaryEmail}
Latest Update: ${snapshot.intro.latestUpdate}
Fun Fact: ${snapshot.intro.funFact}
Featured Read: ${snapshot.intro.featuredRead.title} (${snapshot.intro.featuredRead.link})
Travel Plans: ${snapshot.intro.travelPlans}

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

## Education

${formatEducation(snapshot.education)}

## Experiences

${formatExperiences(snapshot.experiences)}

## Projects

${formatProjects(snapshot.projects)}
`;
exports.buildLlmsText = buildLlmsText;
