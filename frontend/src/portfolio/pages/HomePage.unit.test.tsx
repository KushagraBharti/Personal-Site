import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../sections/hero/HeroLandingSection", () => ({
  default: () => <div>Hero ready</div>,
}));

vi.mock("../sections/about/AboutSection", () => ({
  default: () => <div>About ready</div>,
}));

vi.mock("../sections/featured/FeaturedSection", () => ({
  default: () => <div>Featured ready</div>,
}));

vi.mock("../sections/experiences/ExperiencesSection", () => ({
  default: () => <div>Experiences ready</div>,
}));

vi.mock("../sections/projects/ProjectsSection", () => ({
  default: () => <div>Projects ready</div>,
}));

vi.mock("../sections/film/FilmSection", () => ({
  default: () => <div>Film ready</div>,
}));

vi.mock("../sections/misc/MiscSection", () => ({
  default: () => <div>Misc ready</div>,
}));

describe("HomePage", () => {
  it("renders the hero and portfolio sections", async () => {
    const { default: HomePage } = await import("./HomePage");

    render(<HomePage />);

    expect(screen.getByText("Hero ready")).toBeInTheDocument();
    expect(await screen.findByText("About ready")).toBeInTheDocument();
    expect(await screen.findByText("Featured ready")).toBeInTheDocument();
    expect(await screen.findByText("Experiences ready")).toBeInTheDocument();
    expect(await screen.findByText("Projects ready")).toBeInTheDocument();
    expect(await screen.findByText("Film ready")).toBeInTheDocument();
    expect(await screen.findByText("Misc ready")).toBeInTheDocument();
  });
});
