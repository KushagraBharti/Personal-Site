import { expect, test } from "@playwright/test";
import { createConsoleTracker, mockPortfolioApis } from "../helpers/apiMocks";

test("homepage progressively fills portfolio sections from the API", async ({ page }) => {
  const consoleErrors = createConsoleTracker(page);
  await mockPortfolioApis(page);

  await page.goto("/");

  await expect(page.getByText("Kushagra Bharti").first()).toBeVisible();
  await expect(page.getByText(/Repositories:\s*37/).first()).toBeVisible();
  await expect(page.getByText(/Dallas:\s*72°F/).first()).toBeVisible();

  await page.evaluate(() => {
    document.querySelector("#about")?.scrollIntoView({ behavior: "instant", block: "start" });
  });
  await expect(page.getByRole("heading", { name: "About Me" })).toBeVisible();
  await expect(page.getByText("A builder focused on shipping ambitious software with strong taste.")).toBeVisible();

  await page.evaluate(() => {
    document.querySelector("#education")?.scrollIntoView({ behavior: "instant", block: "start" });
  });
  await expect(page.getByRole("heading", { name: "Education" })).toBeVisible();
  await expect(page.getByText("Student at University of Texas at Dallas").first()).toBeVisible();

  await page.evaluate(() => {
    document.querySelector("#experiences")?.scrollIntoView({ behavior: "instant", block: "start" });
  });
  await expect(page.getByRole("heading", { name: "Experiences" })).toBeVisible();
  await expect(page.getByText("Undergraduate Researcher at UT Dallas").first()).toBeVisible();

  await page.evaluate(() => {
    document.querySelector("#projects")?.scrollIntoView({ behavior: "instant", block: "start" });
  });
  await expect(page.getByRole("heading", { name: "Featured Projects" })).toBeVisible();
  await expect(page.getByText("Monopoly Bench").first()).toBeVisible();

  await page.locator("section#projects").getByRole("button", { name: "Details" }).first().click();
  await expect(page.getByRole("heading", { name: "Monopoly Bench" }).last()).toBeVisible();
  await expect(page.getByText("Runs LLM agents in repeated strategy matches.")).toBeVisible();

  expect(consoleErrors).toEqual([]);
});
