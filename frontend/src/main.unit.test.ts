import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMounts = vi.hoisted(() => ({
  ai: vi.fn(),
  home: vi.fn(),
  tracker: vi.fn(),
}));

vi.mock("./portfolio/pages/mountAiProfile", () => ({
  mountAiProfile: routeMounts.ai,
}));

vi.mock("./portfolio/pages/mountHomePage", () => ({
  mountHomePage: routeMounts.home,
}));

vi.mock("./tracker/mountTracker", () => ({
  mountTracker: routeMounts.tracker,
}));

describe("main route loader", () => {
  beforeEach(() => {
    vi.resetModules();
    routeMounts.ai.mockReset();
    routeMounts.home.mockReset();
    routeMounts.tracker.mockReset();
  });

  it("mounts the public homepage for root routes", async () => {
    window.history.pushState({}, "", "/");

    await import("./main");

    await vi.waitFor(() => expect(routeMounts.home).toHaveBeenCalledTimes(1));
    expect(routeMounts.ai).not.toHaveBeenCalled();
    expect(routeMounts.tracker).not.toHaveBeenCalled();
  }, 15_000);

  it("mounts the AI profile route without loading the homepage", async () => {
    window.history.pushState({}, "", "/ai");

    await import("./main");

    await vi.waitFor(() => expect(routeMounts.ai).toHaveBeenCalledTimes(1));
    expect(routeMounts.home).not.toHaveBeenCalled();
    expect(routeMounts.tracker).not.toHaveBeenCalled();
  });

  it("mounts tracker routes without loading public portfolio routes", async () => {
    window.history.pushState({}, "", "/tracker");

    await import("./main");

    await vi.waitFor(() => expect(routeMounts.tracker).toHaveBeenCalledTimes(1));
    expect(routeMounts.ai).not.toHaveBeenCalled();
    expect(routeMounts.home).not.toHaveBeenCalled();
  });
});
