import { expect, test } from "@playwright/test";
import { createConsoleTracker, mockPortfolioApis } from "../helpers/apiMocks";

test("AI profile renders the canonical snapshot content", async ({ page }) => {
  const consoleErrors = createConsoleTracker(page);
  await mockPortfolioApis(page);

  await page.goto("/ai");

  await expect(page.getByText("Canonical AI Summary Source")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Kushagra Bharti" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "About Me" })).toBeVisible();
  await expect(page.getByText("Monopoly Bench").first()).toBeVisible();
  await expect(page.getByText("Short Film").first()).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test("tracker route preserves a clean setup or login state in the browser flow", async ({ page }) => {
  const consoleErrors = createConsoleTracker(page);

  await page.goto("/tracker");

  await expect(
    page.getByText(/SETUP REQUIRED|AUTHORIZED PERSONNEL ONLY/i).first()
  ).toBeVisible();
  expect(consoleErrors).toEqual([]);
});
