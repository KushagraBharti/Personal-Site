import type {
  GitHubStats,
  PortfolioIntroResponse,
  PortfolioSnapshot,
  WeatherData,
} from "../../portfolio/api/contracts";

export const portfolioSnapshotFixture: PortfolioSnapshot = {
  generatedAt: "2026-04-04T12:00:00.000Z",
  profile: {
    name: "Kushagra Bharti",
    headline: "Student | Software Engineer | ML Enthusiast",
    personalSummary: "An aspiring founder, but right now I am focused on building my skills and learning.",
    primaryEmail: "kushagrabharti@gmail.com",
    socialLinks: [
      { label: "GitHub", href: "https://github.com/kushagrabharti" },
      { label: "LinkedIn", href: "https://www.linkedin.com/in/kushagra-bharti/" },
    ],
    externalLinks: [{ label: "Film Portfolio", href: "https://example.com/film" }],
  },
  about: {
    introHeading: "Hey there! I'm Kushagra Bharti",
    introBody: "A builder focused on shipping ambitious software with strong taste.",
    currentProjects: ["Monopoly Bench", "Go web crawler"],
    currentLearning: ["Go", "WebSockets"],
    interestsOutsideTechnology: ["Cooking", "Filmmaking"],
  },
  intro: {
    personalPhoto: "/portfolio/profile/kushagra-bharti.jpg",
    latestUpdate: "Currently applying for Summer 2026 internships",
    funFact: "A film I made screened at AMC Theatres in Times Square.",
    featuredRead: {
      title: "The Trillion Dollar AI Software Development Stack",
      link: "https://example.com/read",
    },
    aiProjects: ["Monopoly Bench", "T3 Chat"],
    travelPlans: "Visiting home for summer break!",
  },
  education: [
    {
      slug: "ut-dallas",
      order: 1,
      dateRange: "2023 - Present",
      position: "Student at University of Texas at Dallas",
      focus: "BS in Computer Science",
      description: "Studying CS with a focus on ML and systems.",
      schoolLink: "https://utdallas.edu",
    },
  ],
  experiences: [
    {
      slug: "undergrad-researcher",
      order: 1,
      position: "Undergraduate Researcher at UT Dallas",
      summary: "Building optimization solvers and dataset pipelines.",
      description: ["Implemented multiple exact and heuristic solvers."],
      tags: ["Python", "Optimization"],
      companyLink: "https://example.com/lab",
    },
  ],
  projects: [
    {
      slug: "monopoly-bench",
      order: 1,
      title: "Monopoly Bench",
      summary: "Benchmarking LLMs through Monopoly gameplay.",
      description: ["Runs LLM agents in repeated strategy matches."],
      tags: ["LLMs", "Benchmarking"],
      githubLink: "https://github.com/kushagrabharti/monopoly-bench",
      thumbnail: "/portfolio/projects/monopoly-bench.png",
    },
  ],
  media: [
    {
      slug: "short-film",
      order: 1,
      title: "Short Film",
      subtitle: "Director",
      embedUrl: "https://www.youtube.com/embed/test-video",
      type: "video",
    },
  ],
  ai: {
    providers: [
      {
        slug: "openai",
        order: 1,
        label: "ChatGPT",
        icon: "openai",
        hoverColorClass: "hover:text-[#10a37f]",
        promptTemplate: "Summarize {{siteUrl}}",
        action: {
          type: "link",
          hrefTemplate: "https://chat.openai.com/?q={{query}}",
        },
      },
      {
        slug: "claude",
        order: 2,
        label: "Claude",
        icon: "claude",
        hoverColorClass: "hover:text-[#da7756]",
        promptTemplate: "Summarize {{siteUrl}}",
        action: {
          type: "clipboard",
          targetUrl: "https://claude.ai/new",
        },
      },
      {
        slug: "gemini",
        order: 3,
        label: "Gemini",
        icon: "gemini",
        hoverColorClass: "hover:text-[#4285f4]",
        promptTemplate: "Summarize {{siteUrl}}",
        action: {
          type: "link",
          hrefTemplate: "https://gemini.google.com/app?query={{query}}",
        },
      },
    ],
  },
};

export const introResponseFixture: PortfolioIntroResponse = {
  profile: {
    name: portfolioSnapshotFixture.profile.name,
    headline: portfolioSnapshotFixture.profile.headline,
    primaryEmail: portfolioSnapshotFixture.profile.primaryEmail,
    socialLinks: portfolioSnapshotFixture.profile.socialLinks,
  },
  intro: portfolioSnapshotFixture.intro,
  ai: portfolioSnapshotFixture.ai,
};

export const githubStatsFixture: GitHubStats = {
  totalRepos: 37,
  totalCommits: 907,
};

export const weatherFixture: WeatherData = {
  name: "Dallas",
  main: { temp: 72 },
  weather: [{ description: "clear sky" }],
};
