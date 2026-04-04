import { describe, expect, it } from "vitest";
import { buildLlmsText } from "./llmsTextService";

const snapshot = {
  generatedAt: "2026-04-04T12:00:00.000Z",
  profile: {
    name: "Kushagra Bharti",
    headline: "Student | Software Engineer | ML Enthusiast",
    personalSummary: "Focused on building and learning.",
    primaryEmail: "kushagra@example.com",
    socialLinks: [{ label: "GitHub", href: "https://github.com/kushagrabharti" }],
    externalLinks: [{ label: "Film Portfolio", href: "https://example.com/film" }],
  },
  about: {
    introHeading: "Hey there!",
    introBody: "This is the about section.",
    currentProjects: ["Project A"],
    currentLearning: ["Go"],
    interestsOutsideTechnology: ["Cooking"],
  },
  intro: {
    personalPhoto: "/portfolio/profile/test.jpg",
    latestUpdate: "Currently shipping tests",
    funFact: "I like filmmaking.",
    featuredRead: { title: "A Good Article", link: "https://example.com/article" },
    aiProjects: ["Project A"],
    travelPlans: "Going home",
  },
  education: [
    {
      slug: "school",
      order: 1,
      dateRange: "2023 - Present",
      position: "Student at UTD",
      focus: "Computer Science",
      description: "Studying CS.",
      schoolLink: "https://utdallas.edu",
    },
  ],
  experiences: [
    {
      slug: "experience",
      order: 1,
      position: "Undergraduate Researcher",
      summary: "Researching optimization.",
      description: ["Built solvers."],
      tags: ["Python", "Optimization"],
      companyLink: "https://example.com/lab",
    },
  ],
  projects: [
    {
      slug: "project",
      order: 1,
      title: "Monopoly Bench",
      summary: "Benchmarking LLMs.",
      description: ["Runs LLM competitions."],
      tags: ["LLMs", "Benchmarking"],
      githubLink: "https://github.com/kushagrabharti/monopoly-bench",
    },
  ],
  media: [],
  ai: {
    providers: [],
  },
};

describe("llmsTextService", () => {
  it("renders a machine-readable summary that reflects the provided site URL", () => {
    const result = buildLlmsText(snapshot as never, "https://custom.example");

    expect(result).toContain("# Kushagra Bharti");
    expect(result).toContain("Canonical site: https://custom.example");
    expect(result).toContain("Primary AI page: https://custom.example/ai");
    expect(result).toContain("### Undergraduate Researcher");
    expect(result).toContain("### Monopoly Bench");
    expect(result).toContain("### Socials");
  });
});
