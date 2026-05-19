import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import AboutSection from "./AboutSection";

describe("AboutSection", () => {
  it("renders backend-authored about copy and featured writing previews", async () => {
    render(<AboutSection />);

    await waitFor(() => {
      expect(screen.getByText("Hey there! I'm Kushagra Bharti")).toBeInTheDocument();
      expect(screen.getByText(/focused on building my skills and learning/i)).toBeInTheDocument();
      expect(screen.getByText("curiosity")).toBeInTheDocument();
    });

    expect(screen.queryByText(/Curiosity is how I keep a project honest/i)).not.toBeInTheDocument();

    fireEvent.mouseEnter(screen.getByText("curiosity").closest("li") as HTMLElement);
    expect(screen.getByText(/Curiosity is how I keep a project honest/i)).toBeInTheDocument();

    fireEvent.mouseLeave(screen.getByText("curiosity").closest("li") as HTMLElement);
    expect(screen.queryByText(/Curiosity is how I keep a project honest/i)).not.toBeInTheDocument();
  });
});
