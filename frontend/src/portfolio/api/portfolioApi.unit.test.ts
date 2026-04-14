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
  const snapshotFixture = {
    generatedAt: "2026-04-04T12:00:00.000Z",
    profile: { name: "Kushagra", headline: "Builder", personalSummary: "", primaryEmail: "", socialLinks: [], externalLinks: [] },
    about: { introHeading: "Hey", introBody: "Body", currentProjects: [], currentLearning: [], interestsOutsideTechnology: [] },
    intro: { personalPhoto: "", latestUpdate: "Update", funFact: "Fun", featuredRead: { title: "Read", link: "https://example.com" }, aiProjects: [], travelPlans: "Austin" },
    education: [],
    experiences: [],
    projects: [],
    media: [],
    ai: { providers: [] },
  };

  beforeEach(() => {
    mockedAxios.get.mockReset();
    sessionStorage.clear();
    vi.resetModules();
  });

  it("dedupes concurrent snapshot requests and refreshes on later calls", async () => {
    mockedAxios.get.mockResolvedValue({
      data: snapshotFixture,
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
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });

  it("falls back to the cached snapshot when revalidation fails", async () => {
    sessionStorage.setItem("portfolio-snapshot-cache-v2", JSON.stringify(snapshotFixture));
    mockedAxios.get.mockRejectedValueOnce(new Error("network down"));

    const portfolioApi = await import("./portfolioApi");

    await expect(portfolioApi.fetchPortfolioSnapshot()).resolves.toEqual(snapshotFixture);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it("hydrates intro from sessionStorage before making a request", async () => {
    sessionStorage.setItem(
      "portfolio-intro-cache-v2",
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
