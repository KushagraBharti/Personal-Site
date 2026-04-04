import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchGitHubStatsMock = vi.hoisted(() => vi.fn());
const fetchWeatherMock = vi.hoisted(() => vi.fn());

vi.mock("../services/githubStatsService", () => ({
  fetchGitHubStats: fetchGitHubStatsMock,
}));

vi.mock("../services/weatherService", () => ({
  fetchWeather: fetchWeatherMock,
}));

describe("live widget routes", () => {
  beforeEach(() => {
    fetchGitHubStatsMock.mockReset();
    fetchWeatherMock.mockReset();
    process.env.GITHUB_USERNAME = "kushagrabharti";
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("returns GitHub stats and uses no-store cache headers when force=true", async () => {
    fetchGitHubStatsMock.mockResolvedValue({
      totalRepos: 37,
      totalCommits: 907,
    });

    const { default: app } = await import("../../app");
    const response = await request(app).get("/api/github/stats?force=true");

    expect(response.status).toBe(200);
    expect(response.headers["cache-control"]).toContain("no-store");
    expect(fetchGitHubStatsMock).toHaveBeenCalledWith(true);
  });

  it("passes valid Vercel geo headers to the weather service and falls back to city/country when coordinates are invalid", async () => {
    fetchWeatherMock.mockResolvedValue({ name: "Dallas" });

    const { default: app } = await import("../../app");

    await request(app)
      .get("/api/weather")
      .set("x-vercel-ip-latitude", "32.7767")
      .set("x-vercel-ip-longitude", "-96.7970");

    expect(fetchWeatherMock).toHaveBeenLastCalledWith({
      lat: "32.7767",
      lon: "-96.7970",
    });

    await request(app)
      .get("/api/weather")
      .set("x-vercel-ip-latitude", "not-a-number")
      .set("x-vercel-ip-longitude", "NaN")
      .set("x-vercel-ip-city", "New York")
      .set("x-vercel-ip-country", "US");

    expect(fetchWeatherMock).toHaveBeenLastCalledWith({
      q: "New York, US",
    });
  });

  it("maps upstream weather failures into HTTP error responses and logs the failure", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchWeatherMock.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 400,
        data: {
          message: "city not found",
        },
      },
    });

    const { default: app } = await import("../../app");
    const response = await request(app).get("/api/weather?q=Unknown");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "city not found" });
    expect(errorSpy).toHaveBeenCalled();
  });
});
