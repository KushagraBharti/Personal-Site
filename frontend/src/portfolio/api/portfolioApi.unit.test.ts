import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();

describe("portfolioApi", () => {
  const snapshotFixture = {
    generatedAt: "2026-04-04T12:00:00.000Z",
    profile: {
      name: "Kushagra",
      headline: "Builder",
      personalSummary: "",
      primaryEmail: "",
      socialLinks: [],
      externalLinks: [],
    },
    about: {
      introHeading: "Hey",
      introBody: "Body",
      currentProjects: [],
      currentLearning: [],
      interestsOutsideTechnology: [],
    },
    intro: {
      personalPhoto: "",
      latestUpdate: "Update",
      funFact: "Fun",
      featuredRead: { title: "Read", link: "https://example.com" },
      aiProjects: [],
      travelPlans: "Austin",
    },
    education: [],
    experiences: [],
    projects: [],
    media: [],
    ai: { providers: [] },
  };

  const mockJsonResponse = (data: unknown) => ({
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue(data),
  });

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    sessionStorage.clear();
    vi.resetModules();
  });

  it("dedupes concurrent snapshot requests and refreshes on later calls", async () => {
    fetchMock.mockResolvedValue(mockJsonResponse(snapshotFixture));

    const portfolioApi = await import("./portfolioApi");

    const [first, second] = await Promise.all([
      portfolioApi.fetchPortfolioSnapshot(),
      portfolioApi.fetchPortfolioSnapshot(),
    ]);

    expect(first).toEqual(second);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(portfolioApi.getCachedPortfolioSnapshot()).toEqual(first);

    const third = await portfolioApi.fetchPortfolioSnapshot();
    expect(third).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("falls back to the cached snapshot when revalidation fails", async () => {
    sessionStorage.setItem(
      "portfolio-snapshot-cache-v5",
      JSON.stringify(snapshotFixture),
    );
    fetchMock.mockRejectedValueOnce(new Error("network down"));

    const portfolioApi = await import("./portfolioApi");

    await expect(portfolioApi.fetchPortfolioSnapshot()).resolves.toEqual(
      snapshotFixture,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("hydrates intro from sessionStorage before making a request", async () => {
    sessionStorage.setItem(
      "portfolio-intro-cache-v5",
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
      }),
    );

    const portfolioApi = await import("./portfolioApi");

    expect(portfolioApi.getCachedIntroSection()).toMatchObject({
      intro: {
        latestUpdate: "Cached update",
      },
    });
  });
});
