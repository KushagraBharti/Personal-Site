import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import AboutSection from "./AboutSection";

describe("AboutSection", () => {
  it("renders backend-authored about and media content", async () => {
    render(<AboutSection />);

    await waitFor(() => {
      expect(screen.getByText("Hey there! I'm Kushagra Bharti")).toBeInTheDocument();
      expect(screen.getByText(/A builder focused on shipping ambitious software/i)).toBeInTheDocument();
      expect(screen.getByText("Monopoly Bench")).toBeInTheDocument();
      expect(screen.getByText(/Director - Short Film/i)).toBeInTheDocument();
    });
  });
});
