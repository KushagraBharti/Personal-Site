import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

const axiosMock = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock("axios", () => ({
  default: axiosMock,
  ...axiosMock,
}));

const mockedAxios = axios as unknown as typeof axiosMock;

describe("portfolioApi", () => {
  beforeEach(() => {
    mockedAxios.get.mockReset();
    sessionStorage.clear();
    vi.resetModules();
  });

  it("dedupes snapshot requests and reuses the cached snapshot", async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        generatedAt: "2026-04-04T12:00:00.000Z",
        profile: { name: "Kushagra", headline: "Builder", personalSummary: "", primaryEmail: "", socialLinks: [], externalLinks: [] },
        about: { introHeading: "Hey", introBody: "Body", currentProjects: [], currentLearning: [], interestsOutsideTechnology: [] },
        intro: { personalPhoto: "", latestUpdate: "Update", funFact: "Fun", featuredRead: { title: "Read", link: "https://example.com" }, aiProjects: [], travelPlans: "Austin" },
        education: [],
        experiences: [],
        projects: [],
        media: [],
        ai: { providers: [] },
      },
    });

    const portfolioApi = await import("./portfolioApi");

    const [first, second] = await Promise.all([
      portfolioApi.fetchPortfolioSnapshot(),
      portfolioApi.fetchPortfolioSnapshot(),
    ]);

    expect(first).toEqual(second);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(portfolioApi.getCachedPortfolioSnapshot()).toEqual(first);

    const third = await portfolioApi.fetchPortfolioSnapshot();
    expect(third).toEqual(first);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it("hydrates intro from sessionStorage before making a request", async () => {
    sessionStorage.setItem(
      "portfolio-intro-cache-v1",
      JSON.stringify({
        profile: {
          name: "Kushagra",
          headline: "Builder",
          primaryEmail: "k@example.com",
          socialLinks: [],
        },
        intro: {
          personalPhoto: "",
          latestUpdate: "Cached update",
          funFact: "Cached fact",
          featuredRead: { title: "Cached read", link: "https://example.com" },
          aiProjects: [],
          travelPlans: "Austin",
        },
        ai: { providers: [] },
      })
    );

    const portfolioApi = await import("./portfolioApi");

    expect(portfolioApi.getCachedIntroSection()).toMatchObject({
      intro: {
        latestUpdate: "Cached update",
      },
    });
  });
});
