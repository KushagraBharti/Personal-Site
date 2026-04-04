import { describe, expect, it, vi } from "vitest";

vi.mock("../content", () => ({
  portfolioProfile: {
    name: "Test User",
    headline: "Builder",
    personalSummary: "Summary",
    primaryEmail: "test@example.com",
    socialLinks: [{ label: "GitHub", href: "https://github.com/test" }],
    externalLinks: [{ label: "Film", href: "https://example.com/film" }],
  },
  portfolioAbout: {
    introHeading: "Hello",
    introBody: "Intro",
    currentProjects: ["Project A"],
    currentLearning: ["Learning A"],
    interestsOutsideTechnology: ["Cooking"],
  },
  portfolioIntro: {
    personalPhoto: "/portfolio/profile/test.jpg",
    latestUpdate: "  Latest update  ",
    funFact: "Fun fact",
    featuredRead: {
      title: "Read",
      link: "https://example.com/read",
    },
    aiProjects: ["AI Project"],
    travelPlans: "Austin",
  },
  portfolioEducation: [
    {
      slug: "second",
      order: 2,
      dateRange: "2020 - 2021",
      position: "Second",
      focus: "Focus",
      description: "Description",
      schoolLink: "https://example.com/second",
    },
    {
      slug: "first",
      order: 1,
      dateRange: "2018 - 2019",
      position: "First",
      focus: "Focus",
      description: "Description",
      schoolLink: "https://example.com/first",
    },
  ],
  portfolioExperiences: [
    {
      slug: "exp-second",
      order: 2,
      position: "Second Experience",
      summary: "Summary",
      description: ["Detail"],
      tags: ["Tag"],
      companyLink: "https://example.com/exp-second",
    },
    {
      slug: "exp-first",
      order: 1,
      position: "First Experience",
      summary: "Summary",
      description: ["Detail"],
      tags: ["Tag"],
      companyLink: "https://example.com/exp-first",
    },
  ],
  portfolioProjects: [
    {
      slug: "project-second",
      order: 2,
      title: "Second Project",
      summary: "Summary",
      description: ["Detail"],
      tags: ["Tag"],
      githubLink: "https://github.com/test/second",
      thumbnail: "/portfolio/projects/second.png",
    },
    {
      slug: "project-first",
      order: 1,
      title: "First Project",
      summary: "Summary",
      description: ["Detail"],
      tags: ["Tag"],
      githubLink: "https://github.com/test/first",
      thumbnail: "/portfolio/projects/first.png",
    },
  ],
  portfolioMedia: [
    {
      slug: "media-second",
      order: 2,
      title: "Second Media",
      subtitle: "Subtitle",
      embedUrl: "https://example.com/second-media",
      type: "video",
    },
    {
      slug: "media-first",
      order: 1,
      title: "First Media",
      subtitle: "Subtitle",
      embedUrl: "https://example.com/first-media",
      type: "video",
    },
  ],
  portfolioAiProviders: [
    {
      slug: "claude",
      order: 2,
      label: "Claude",
      icon: "claude",
      hoverColorClass: "hover:text-orange-500",
      promptTemplate: "Prompt",
      action: {
        type: "clipboard",
        targetUrl: "https://claude.ai",
      },
    },
    {
      slug: "openai",
      order: 1,
      label: "ChatGPT",
      icon: "openai",
      hoverColorClass: "hover:text-green-500",
      promptTemplate: "Prompt",
      action: {
        type: "link",
        hrefTemplate: "https://chat.openai.com/?q={{query}}",
      },
    },
  ],
}));

describe("portfolioSnapshotService", () => {
  it("sorts ordered collections and sanitizes the intro response", async () => {
    const { getPortfolioSnapshot, getIntroResponse } = await import("./portfolioSnapshotService");

    const snapshot = getPortfolioSnapshot();

    expect(snapshot.education.map((item) => item.slug)).toEqual(["first", "second"]);
    expect(snapshot.experiences.map((item) => item.slug)).toEqual(["exp-first", "exp-second"]);
    expect(snapshot.projects.map((item) => item.slug)).toEqual(["project-first", "project-second"]);
    expect(snapshot.media.map((item) => item.slug)).toEqual(["media-first", "media-second"]);
    expect(snapshot.ai.providers.map((item) => item.slug)).toEqual(["openai", "claude"]);
    expect(snapshot.intro.latestUpdate).toBe("Latest update");

    const intro = getIntroResponse();
    expect(intro.profile.name).toBe("Test User");
    expect(intro.ai.providers.map((item) => item.slug)).toEqual(["openai", "claude"]);
  });
});
