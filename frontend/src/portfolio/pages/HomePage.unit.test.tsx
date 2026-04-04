import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const prefetchPortfolioSnapshotMock = vi.hoisted(() => vi.fn());

vi.mock("../api/portfolioApi", () => ({
  prefetchPortfolioSnapshot: prefetchPortfolioSnapshotMock,
}));

vi.mock("../sections/intro/IntroSection", () => {
  const IntroSectionMock = ({ onLiveWidgetsSettled }: { onLiveWidgetsSettled?: () => void }) => {
    React.useEffect(() => {
      onLiveWidgetsSettled?.();
    }, [onLiveWidgetsSettled]);

    return <div>Intro ready</div>;
  };

  return {
    default: IntroSectionMock,
  };
});

vi.mock("../sections/about/AboutSection", () => ({
  default: () => <div>About ready</div>,
}));

vi.mock("../sections/education/EducationSection", () => ({
  default: () => <div>Education ready</div>,
}));

vi.mock("../sections/experiences/ExperiencesSection", () => ({
  default: () => <div>Experiences ready</div>,
}));

vi.mock("../sections/projects/ProjectsSection", () => ({
  default: () => <div>Projects ready</div>,
}));

describe("HomePage", () => {
  beforeEach(() => {
    prefetchPortfolioSnapshotMock.mockReset();
  });

  it("renders the intro immediately and warms sections after live widgets settle", async () => {
    const requestAnimationFrameSpy = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      });
    const cancelAnimationFrameSpy = vi
      .spyOn(window, "cancelAnimationFrame")
      .mockImplementation(() => {});

    const { default: HomePage } = await import("./HomePage");

    render(<HomePage />);

    expect(screen.getByText("Intro ready")).toBeInTheDocument();
    await waitFor(() => expect(prefetchPortfolioSnapshotMock).toHaveBeenCalled());
    expect(requestAnimationFrameSpy).toHaveBeenCalled();
    expect(cancelAnimationFrameSpy).not.toHaveBeenCalled();
  });
});
