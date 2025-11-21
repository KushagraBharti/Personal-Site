// backend/src/config/github.ts
export const GITHUB_USERNAME = process.env.GITHUB_USERNAME || "";
export const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";

if (!GITHUB_USERNAME) {
  console.warn("Warning: GITHUB_USERNAME is not defined. GitHub stats will be unavailable.");
}
