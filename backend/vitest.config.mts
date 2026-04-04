import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "src/**/*.spec.ts",
        "src/**/*.unit.test.ts",
        "src/**/*.integration.test.ts",
        "src/**/*.live.test.ts",
        "src/test/**",
        "src/server.ts",
        "src/types/**",
      ],
    },
  },
});
