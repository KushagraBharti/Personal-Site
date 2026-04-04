import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchGitHubStatsMock = vi.hoisted(() => vi.fn());
const getCachedGitHubStatsMock = vi.hoisted(() => vi.fn());
const fetchIntroSectionMock = vi.hoisted(() => vi.fn());
const getCachedIntroSectionMock = vi.hoisted(() => vi.fn());

vi.mock("../../api/liveWidgetsApi", () => ({
  fetchGitHubStats: fetchGitHubStatsMock,
  getCachedGitHubStats: getCachedGitHubStatsMock,
}));

vi.mock("../../api/portfolioApi", () => ({
  fetchIntroSection: fetchIntroSectionMock,
  getCachedIntroSection: getCachedIntroSectionMock,
}));

describe("useIntroData", () => {
  beforeEach(() => {
    fetchGitHubStatsMock.mockReset();
    getCachedGitHubStatsMock.mockReset();
    fetchIntroSectionMock.mockReset();
    getCachedIntroSectionMock.mockReset();
  });

  it("hydrates intro data independently from GitHub stats and updates stats later", async () => {
    getCachedGitHubStatsMock.mockReturnValue({ totalRepos: 37, totalCommits: 900 });
    getCachedIntroSectionMock.mockReturnValue({
      profile: {
        name: "Kushagra",
        headline: "Builder",
        primaryEmail: "k@example.com",
        socialLinks: [],
      },
      intro: {
        personalPhoto: "",
        latestUpdate: "Cached",
        funFact: "Fact",
        featuredRead: { title: "Read", link: "https://example.com" },
        aiProjects: [],
        travelPlans: "Austin",
      },
      ai: { providers: [] },
    });
    fetchIntroSectionMock.mockResolvedValue({
      profile: {
        name: "Kushagra",
        headline: "Builder",
        primaryEmail: "k@example.com",
        socialLinks: [],
      },
      intro: {
        personalPhoto: "",
        latestUpdate: "Live update",
        funFact: "Fact",
        featuredRead: { title: "Read", link: "https://example.com" },
        aiProjects: [],
        travelPlans: "Austin",
      },
      ai: { providers: [] },
    });
    fetchGitHubStatsMock.mockResolvedValue({ totalRepos: 37, totalCommits: 907 });

    const { useIntroData } = await import("./useIntroData");
    const { result } = renderHook(() => useIntroData());

    expect(result.current).toMatchObject({
      intro: {
        latestUpdate: "Cached",
      },
      githubStats: {
        totalCommits: 900,
      },
    });

    await waitFor(() =>
      expect(result.current).toMatchObject({
        intro: {
          latestUpdate: "Live update",
        },
        githubStats: {
          totalCommits: 907,
        },
      })
    );
  });
});
