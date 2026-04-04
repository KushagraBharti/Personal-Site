import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import AiProfilePage from "./AiProfilePage";

describe("AiProfilePage", () => {
  it("renders the machine-readable snapshot sections", async () => {
    render(<AiProfilePage />);

    await waitFor(() => {
      expect(screen.getByText("Canonical AI Summary Source")).toBeInTheDocument();
      expect(screen.getByText("High Level Info")).toBeInTheDocument();
      expect(screen.getByText("About Me")).toBeInTheDocument();
      expect(screen.getByText("Creative Work")).toBeInTheDocument();
      expect(screen.getByText("Education")).toBeInTheDocument();
      expect(screen.getByText("Experiences")).toBeInTheDocument();
      expect(screen.getByText("Projects")).toBeInTheDocument();
    });
  });
});
