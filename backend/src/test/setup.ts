import { afterEach, beforeEach, vi } from "vitest";

const originalEnv = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  process.env.GITHUB_USERNAME ??= "kushagrabharti";
});

afterEach(() => {
  vi.resetModules();
  process.env = { ...originalEnv };
});
