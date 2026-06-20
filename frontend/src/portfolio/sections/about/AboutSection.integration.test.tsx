import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import AboutSection from "./AboutSection";

describe("AboutSection", () => {
  it("renders backend-authored about copy and featured writing previews", async () => {
    render(<AboutSection />);

    await waitFor(() => {
      expect(screen.getByText("Hey there! I'm Kushagra Bharti")).toBeInTheDocument();
      expect(screen.getByText(/software builder who enjoys learning/i)).toBeInTheDocument();
      expect(screen.getByText("perpetual learning")).toBeInTheDocument();
    });

    expect(screen.queryByText(/refusal to fossilize/i)).not.toBeInTheDocument();

    fireEvent.mouseEnter(screen.getByText("perpetual learning").closest("li") as HTMLElement);
    expect(screen.getByText(/refusal to fossilize/i)).toBeInTheDocument();

    fireEvent.mouseLeave(screen.getByText("perpetual learning").closest("li") as HTMLElement);
    expect(screen.queryByText(/refusal to fossilize/i)).not.toBeInTheDocument();
  });
});
