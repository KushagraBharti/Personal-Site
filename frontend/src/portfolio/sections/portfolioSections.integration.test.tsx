import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import EducationSection from "./education/EducationSection";
import ExperiencesSection from "./experiences/ExperiencesSection";
import ProjectsSection from "./projects/ProjectsSection";

describe("portfolio sections", () => {
  it("renders education, experiences, and projects from the shared snapshot data", async () => {
    render(
      <>
        <EducationSection />
        <ExperiencesSection />
        <ProjectsSection />
      </>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Student at University of Texas at Dallas/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Undergraduate Researcher at UT Dallas/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Monopoly Bench/i).length).toBeGreaterThan(0);
    });
  });
});
