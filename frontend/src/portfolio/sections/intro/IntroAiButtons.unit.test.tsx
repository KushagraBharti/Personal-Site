import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import IntroAiButtons from "./IntroAiButtons";
import { portfolioSnapshotFixture } from "../../../test/fixtures/portfolio";

describe("IntroAiButtons", () => {
  it("renders the AI buttons with the expected base and hover color classes", () => {
    const onCopied = vi.fn();

    render(<IntroAiButtons providers={portfolioSnapshotFixture.ai.providers} onCopied={onCopied} />);

    const chatGptButton = screen.getByLabelText("Summarize via ChatGPT");
    const claudeButton = screen.getByLabelText("Summarize via Claude");
    const geminiButton = screen.getByLabelText("Summarize via Gemini");

    expect(chatGptButton.className).toContain("text-[#1f2937]");
    expect(chatGptButton.className).toContain("hover:text-[#10a37f]");
    expect(claudeButton.className).toContain("hover:text-[#da7756]");
    expect(geminiButton.className).toContain("hover:text-[#4285f4]");

    fireEvent.mouseEnter(chatGptButton);
    expect(chatGptButton).toHaveAttribute("title", "Summarize via ChatGPT");
  });
});
