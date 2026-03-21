import { educationData, type EducationData } from "../../data/education";
import { experiencesData, type ExperienceData } from "../../data/experiences";
import { introStaticData, type IntroData } from "../../data/intro";
import { profileData, type ProfileData } from "../../data/profile";
import { projectsData, type ProjectData } from "../../data/projects";

export interface PortfolioSnapshot {
  generatedAt: string;
  profile: ProfileData;
  intro: IntroData;
  education: EducationData[];
  experiences: ExperienceData[];
  projects: ProjectData[];
}

export const DEFAULT_PUBLIC_SITE_URL = "https://www.kushagrabharti.com";

export const sanitizeLatestUpdate = (latestUpdate: string) =>
  latestUpdate
    .replace(/\band leetcoding\b!?/gi, "")
    .replace(/\bleetcoding\b!?/gi, "")
    .replace(/\s+/g, " ")
    .trim();

export const getPortfolioSnapshot = (): PortfolioSnapshot => ({
  generatedAt: new Date().toISOString(),
  profile: profileData,
  intro: {
    ...introStaticData,
    latestUpdate: sanitizeLatestUpdate(introStaticData.latestUpdate),
  },
  education: educationData,
  experiences: experiencesData,
  projects: projectsData,
});

const formatLinkList = (links: { label: string; href: string }[]) =>
  links.map((link) => `- ${link.label}: ${link.href}`).join("\n");

const formatStringList = (items: string[]) => items.map((item) => `- ${item}`).join("\n");

const formatEducation = (education: EducationData[]) =>
  education
    .map((entry) =>
      [
        `### ${entry.position}`,
        `Date Range: ${entry.dateRange}`,
        `Focus: ${entry.focus}`,
        `Description: ${entry.description}`,
        `Link: ${entry.schoolLink}`,
      ].join("\n")
    )
    .join("\n\n");

const formatExperiences = (experiences: ExperienceData[]) =>
  experiences
    .map((entry) =>
      [
        `### ${entry.position}`,
        `Summary: ${entry.summary}`,
        "Highlights:",
        ...entry.description.map((detail) => `- ${detail}`),
        `Tags: ${entry.tags.join(", ")}`,
        `Link: ${entry.companyLink}`,
      ].join("\n")
    )
    .join("\n\n");

const formatProjects = (projects: ProjectData[]) =>
  projects
    .map((project) =>
      [
        `### ${project.title}`,
        `Summary: ${project.summary}`,
        "Highlights:",
        ...project.description.map((detail) => `- ${detail}`),
        `Tags: ${project.tags.join(", ")}`,
        `GitHub: ${project.githubLink || "N/A"}`,
      ].join("\n")
    )
    .join("\n\n");

export const buildLlmsText = (
  snapshot: PortfolioSnapshot,
  siteUrl = DEFAULT_PUBLIC_SITE_URL
) => `# ${snapshot.profile.name}

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
Featured Read: ${snapshot.intro.featuredBlog.title} (${snapshot.intro.featuredBlog.link})
Travel Plans: ${snapshot.intro.travelPlans}

### Socials
${formatLinkList(snapshot.profile.socialLinks)}

### Other Links
${formatLinkList(snapshot.profile.externalLinks)}

## About Me

Heading: ${snapshot.profile.about.introHeading}
Intro: ${snapshot.profile.about.introBody}

### Current Projects
${formatStringList(snapshot.profile.about.currentProjects)}

### Current Learning
${formatStringList(snapshot.profile.about.currentLearning)}

### Interests Outside Technology
${formatStringList(snapshot.profile.about.interestsOutsideTechnology)}

## Education

${formatEducation(snapshot.education)}

## Experiences

${formatExperiences(snapshot.experiences)}

## Projects

${formatProjects(snapshot.projects)}
`;
