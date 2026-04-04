import { defineConfig } from "@playwright/test";

const baseURL = "http://127.0.0.1:5173";
const apiBaseUrl = "http://127.0.0.1:5000";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL,
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  webServer: [
    {
      command: "npm run serve:test",
      cwd: "../backend",
      url: apiBaseUrl,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      env: {
        ...process.env,
        PORT: "5000",
        NODE_ENV: "test",
        GITHUB_USERNAME: process.env.GITHUB_USERNAME || "kushagrabharti",
      },
    },
    {
      command: "npm run dev:test",
      cwd: ".",
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      env: {
        ...process.env,
        VITE_API_BASE_URL: apiBaseUrl,
      },
    },
  ],
  projects: [
    {
      name: "smoke",
      testDir: "./tests/smoke",
    },
    {
      name: "e2e",
      testDir: "./tests/e2e",
    },
  ],
});
