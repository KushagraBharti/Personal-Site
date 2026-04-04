import type { Page } from "@playwright/test";
import {
  githubStatsFixture,
  introResponseFixture,
  portfolioSnapshotFixture,
  weatherFixture,
} from "../../src/test/fixtures/portfolio";

const json = (body: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify(body),
});

export const mockLiveWidgets = async (page: Page) => {
  await page.route("**/api/github/stats**", async (route) => {
    await route.fulfill(json(githubStatsFixture));
  });

  await page.route("**/api/weather**", async (route) => {
    await route.fulfill(json(weatherFixture));
  });
};

export const mockPortfolioApis = async (page: Page) => {
  await mockLiveWidgets(page);

  await page.route("**/api/portfolio", async (route) => {
    await route.fulfill(json(portfolioSnapshotFixture));
  });

  await page.route("**/api/intro", async (route) => {
    await route.fulfill(json(introResponseFixture));
  });

  await page.route("**/api/education", async (route) => {
    await route.fulfill(json(portfolioSnapshotFixture.education));
  });

  await page.route("**/api/experiences", async (route) => {
    await route.fulfill(json(portfolioSnapshotFixture.experiences));
  });

  await page.route("**/api/projects", async (route) => {
    await route.fulfill(json(portfolioSnapshotFixture.projects));
  });
};

export const createConsoleTracker = (page: Page) => {
  const errors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });

  page.on("pageerror", (error) => {
    errors.push(error.message);
  });

  return errors;
};
