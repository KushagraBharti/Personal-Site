import { expect, test } from "@playwright/test";
import { createConsoleTracker, mockLiveWidgets } from "../helpers/apiMocks";

test("homepage and AI route load without runtime errors", async ({ page }) => {
  const consoleErrors = createConsoleTracker(page);
  await mockLiveWidgets(page);

  await page.goto("/");
  await expect(page.getByText("Kushagra Bharti").first()).toBeVisible();
  await expect(page.getByText(/Repositories:\s*37/).first()).toBeVisible();
  await expect(page.getByText(/Total Commits:\s*\d+/).first()).toBeVisible();

  await page.goto("/ai");
  await expect(page.getByText("Canonical AI Summary Source")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Kushagra Bharti" })).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test("tracker route reaches a clean setup or login state", async ({ page }) => {
  const consoleErrors = createConsoleTracker(page);

  await page.goto("/tracker");

  await expect(
    page.getByText(/SETUP REQUIRED|AUTHORIZED PERSONNEL ONLY/i).first()
  ).toBeVisible();
  expect(consoleErrors).toEqual([]);
});
