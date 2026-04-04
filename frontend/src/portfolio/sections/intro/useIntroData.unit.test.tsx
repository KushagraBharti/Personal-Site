import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchGitHubStatsMock = vi.hoisted(() => vi.fn());
const fetchWeatherMock = vi.hoisted(() => vi.fn());
const getCachedGitHubStatsMock = vi.hoisted(() => vi.fn());
const getCachedWeatherMock = vi.hoisted(() => vi.fn());
const fetchIntroSectionMock = vi.hoisted(() => vi.fn());
const getCachedIntroSectionMock = vi.hoisted(() => vi.fn());

vi.mock("../../api/liveWidgetsApi", () => ({
  fetchGitHubStats: fetchGitHubStatsMock,
  fetchWeather: fetchWeatherMock,
  getCachedGitHubStats: getCachedGitHubStatsMock,
  getCachedWeather: getCachedWeatherMock,
}));

vi.mock("../../api/portfolioApi", () => ({
  fetchIntroSection: fetchIntroSectionMock,
  getCachedIntroSection: getCachedIntroSectionMock,
}));

describe("useIntroData", () => {
  beforeEach(() => {
    fetchGitHubStatsMock.mockReset();
    fetchWeatherMock.mockReset();
    getCachedGitHubStatsMock.mockReset();
    getCachedWeatherMock.mockReset();
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
    fetchWeatherMock.mockResolvedValue({
      name: "Dallas",
      main: { temp: 72 },
      weather: [{ description: "clear sky" }],
    });
    getCachedWeatherMock.mockReturnValue(null);

    const { useIntroData } = await import("./useIntroData");
    const { result } = renderHook(() => useIntroData());

    expect(result.current.data).toMatchObject({
      intro: {
        latestUpdate: "Cached",
      },
      githubStats: {
        totalCommits: 900,
      },
    });

    await waitFor(() =>
      expect(result.current.data).toMatchObject({
        intro: {
          latestUpdate: "Live update",
        },
      })
    );

    await waitFor(() =>
      expect(result.current.data).toMatchObject({
        githubStats: {
          totalCommits: 907,
        },
      })
    );

    await waitFor(() =>
      expect(result.current.weather).toMatchObject({
        name: "Dallas",
      })
    );
    expect(result.current.liveWidgetsSettled).toBe(true);
  });
});
