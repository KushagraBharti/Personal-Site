import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import AiProfilePage from "./AiProfilePage";

describe("AiProfilePage", () => {
  it("renders the machine-readable snapshot sections", async () => {
    render(<AiProfilePage />);

    await waitFor(() => {
      expect(screen.getByText("Canonical AI-readable portfolio page.")).toBeInTheDocument();
      expect(screen.getByText("Intro")).toBeInTheDocument();
      expect(screen.getByText("Socials and Links")).toBeInTheDocument();
      expect(screen.getByText("About Me")).toBeInTheDocument();
      expect(screen.getByText("Recent Works")).toBeInTheDocument();
      expect(screen.getByText("Experiences")).toBeInTheDocument();
      expect(screen.getByText("Projects")).toBeInTheDocument();
      expect(screen.getByText("Education")).toBeInTheDocument();
      expect(screen.getByText("Film and Creative Work")).toBeInTheDocument();
      expect(screen.getByText("Crawler Notes")).toBeInTheDocument();
    });
  });
});
