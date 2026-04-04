import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./portfolio/pages/HomePage", () => ({
  default: () => <div>HOME PAGE</div>,
}));

vi.mock("./portfolio/pages/AiProfilePage", () => ({
  default: () => <div>AI PAGE</div>,
}));

vi.mock("./tracker/pages/TrackerPage", () => ({
  default: () => <div>TRACKER PAGE</div>,
}));

describe("App routes", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("renders the homepage route immediately", async () => {
    window.history.pushState({}, "", "/");
    const { default: App } = await import("./App");

    render(<App />);

    expect(screen.getByText("HOME PAGE")).toBeInTheDocument();
  });

  it("resolves the lazy AI and tracker routes", async () => {
    window.history.pushState({}, "", "/ai");
    let App = (await import("./App")).default;
    const { unmount } = render(<App />);

    await waitFor(() => expect(screen.getByText("AI PAGE")).toBeInTheDocument());
    unmount();

    vi.resetModules();
    window.history.pushState({}, "", "/tracker");
    App = (await import("./App")).default;
    render(<App />);

    await waitFor(() => expect(screen.getByText("TRACKER PAGE")).toBeInTheDocument());
  });
});
