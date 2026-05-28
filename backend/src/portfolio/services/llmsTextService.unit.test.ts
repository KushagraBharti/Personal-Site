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
    interestsOutsideTechnology: ["I direct films."],
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
      dateRange: "2025 - Present",
      category: "Research",
      timelineTone: "active",
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
  writings: [
    {
      slug: "taste",
      order: 1,
      category: "thought",
      title: "Taste matters",
      summary: "A short note about building with taste.",
      markdown: "Taste is a practical engineering constraint.",
    },
  ],
  media: [
    {
      slug: "film",
      order: 1,
      title: "Test Film",
      shortTitle: "Film",
      subtitle: "2026",
      year: "2026",
      genre: "Documentary",
      duration: "5 min",
      summary: "A test film summary.",
      description: "A full test film description.",
      watchUrl: "https://example.com/watch",
      embedUrl: "https://example.com/embed",
      platform: "youtube",
      type: "video",
      roles: ["Director", "Editor"],
      notes: ["Screened somewhere."],
      actions: [
        {
          label: "Watch",
          url: "https://example.com/watch",
          variant: "primary",
        },
      ],
    },
  ],
  ai: {
    providers: [],
  },
};

describe("llmsTextService", () => {
  it("renders the hardcoded header, source links, and full snapshot sections", () => {
    const result = buildLlmsText(snapshot as never, "https://custom.example");

    expect(result).toContain(
      [
        "# Kushagra Bharti",
        "",
        "> Student | Software Engineer | ML Enthusiast.",
        "",
        "I am a student and software builder who enjoys learning and expanding my skillset.",
      ].join("\n"),
    );
    expect(result).toContain("- [Canonical portfolio homepage](https://custom.example)");
    expect(result).toContain("- [AI-readable HTML profile](https://custom.example/ai)");
    expect(result).not.toContain("This is the generated, public-only AI guide");
    expect(result).not.toContain("Do not infer private tracker data from this public portfolio surface.");
    expect(result).not.toContain("Generated at:");
    expect(result).not.toContain("Current focus:");
    expect(result).not.toContain("Currently learning:");
    expect(result).not.toContain("Interests outside technology:");
    expect(result).toContain("## Primary Sources");
    expect(result).not.toContain("## Public Portfolio Sections");
    expect(result).toContain("Key facts:");
    expect(result).toContain("## Contact and External Profiles");
    expect(result).toContain("## Values and Writings and Predictions");
    expect(result).toContain(
      "I am a student and software engineer, but I do not fit cleanly into one lane.",
    );
    expect(result).toContain("At Abilitie, I contributed to an LLM role-play training product");
    expect(result).toContain("open-source model fine-tuning");
    expect(result).toContain("At Glydr.gg, I have been leading technical and product direction");
    expect(result).toContain("Taste is a practical engineering constraint.");
    expect(result).toContain("## Experience Links");
    expect(result).toContain("### Undergraduate Researcher");
    expect(result).toContain("Date Range: 2025 - Present");
    expect(result).toContain("- Built solvers.");
    expect(result).toContain("## Project Source Links");
    expect(result).toContain("### Monopoly Bench");
    expect(result).toContain("- Runs LLM competitions.");
    expect(result).toContain("Link: https://github.com/kushagrabharti/monopoly-bench");
    expect(result).toContain("## Film and Creative Work");
    expect(result).toContain("Section Summary: Stories and taste make us human");
    expect(result).toContain("- I like filmmaking.");
    expect(result).toContain("- I direct films.");
    expect(result).toContain("- Film Portfolio: https://example.com/film");
    expect(result).toContain("### 01 Test Film");
    expect(result).toContain("Short Title: Film");
    expect(result).toContain("Description: A full test film description.");
    expect(result).toContain("Roles: Director, Editor");
    expect(result).toContain("- Screened somewhere.");
    expect(result).toContain("Actions:\n- Watch: https://example.com/watch");
    expect(result).toContain("## Optional");
    expect(result).toContain("- [Structured portfolio JSON](https://custom.example/portfolio.json)");
    expect(result).toContain("- [Live public portfolio API](https://custom.example/api/portfolio)");
  });
});
