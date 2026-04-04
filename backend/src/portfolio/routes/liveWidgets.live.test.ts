import request from "supertest";
import { describe, expect, it } from "vitest";

const requiredLiveEnvKeys = ["GITHUB_USERNAME", "OPENWEATHER_API_KEY"];

describe("live widget routes (live)", () => {
  it(
    "serves live GitHub and weather payloads when env is present",
    async () => {
      const missingKeys = requiredLiveEnvKeys.filter((key) => !process.env[key]);
      expect(
        missingKeys,
        `Missing required live env values: ${missingKeys.join(", ")}`
      ).toEqual([]);

      const { default: app } = await import("../../app");

    const [github, weather] = await Promise.all([
        request(app).get("/api/github/stats?force=true"),
        request(app).get("/api/weather?q=Austin"),
      ]);

      expect(github.status).toBe(200);
      expect(github.body.totalRepos).toBeTypeOf("number");

      expect(weather.status).toBe(200);
      expect(weather.body.name).toBeTruthy();
    },
    30000,
  );
});
