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
      expect(screen.getByText("epistemic velocity")).toBeInTheDocument();
    });

    expect(screen.queryByText(/Learning is mostly a tempo problem/i)).not.toBeInTheDocument();

    fireEvent.mouseEnter(screen.getByText("epistemic velocity").closest("li") as HTMLElement);
    expect(screen.getByText(/Learning is mostly a tempo problem/i)).toBeInTheDocument();

    fireEvent.mouseLeave(screen.getByText("epistemic velocity").closest("li") as HTMLElement);
    expect(screen.queryByText(/Learning is mostly a tempo problem/i)).not.toBeInTheDocument();
  });
});
