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

describe("liveWidgetsApi", () => {
  beforeEach(() => {
    mockedAxios.get.mockReset();
    sessionStorage.clear();
    vi.resetModules();
  });

  it("dedupes GitHub stats requests and clears cache on force refresh", async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: { totalRepos: 37, totalCommits: 907 } })
      .mockResolvedValueOnce({ data: { totalRepos: 37, totalCommits: 920 } });

    const api = await import("./liveWidgetsApi");

    const [first, second] = await Promise.all([api.fetchGitHubStats(), api.fetchGitHubStats()]);
    expect(first).toEqual(second);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(api.getCachedGitHubStats()).toEqual(first);

    const refreshed = await api.fetchGitHubStats({ forceRefresh: true });
    expect(refreshed.totalCommits).toBe(920);
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });

  it("uses stable weather cache keys and dedupes in-flight weather requests", async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        name: "Dallas",
        main: { temp: 72 },
        weather: [{ description: "clear sky" }],
      },
    });

    const api = await import("./liveWidgetsApi");

    const [first, second] = await Promise.all([
      api.fetchWeather({ city: "Dallas" }),
      api.fetchWeather({ city: "Dallas" }),
    ]);

    expect(first).toEqual(second);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(api.getCachedWeather({ city: "Dallas" })).toEqual(first);
  });
});
