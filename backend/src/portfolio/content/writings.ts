import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { PortfolioWriting } from "../contracts";

type PortfolioWritingConfig = Omit<PortfolioWriting, "markdown"> & {
  markdownFile: string;
};

const writingMarkdownDirectories = [
  resolve(process.cwd(), "src/portfolio/content/writings"),
  resolve(process.cwd(), "backend/src/portfolio/content/writings"),
  resolve(__dirname, "writings"),
  resolve(__dirname, "../../../src/portfolio/content/writings"),
];

const readWritingMarkdown = (fileName: string) => {
  const directory = writingMarkdownDirectories.find((candidate) =>
    existsSync(resolve(candidate, fileName)),
  );

  if (!directory) {
    throw new Error(`Missing portfolio writing markdown file: ${fileName}`);
  }

  return readFileSync(resolve(directory, fileName), "utf8").trim();
};

const portfolioWritingConfigs: PortfolioWritingConfig[] = [
  {
    slug: "perpetual-learning",
    order: 1,
    category: "value",
    title: "perpetual learning",
    summary: "Learning as the discipline of staying corrigible before comfort, fluency, and success become inertia.",
    markdownFile: "perpetual-learning.md",
  },
  {
    slug: "kinetic-agency",
    order: 2,
    category: "belief",
    title: "kinetic agency",
    summary: "Turning abundant intelligence into motion through fast feedback, real shipping, and active adaptation.",
    markdownFile: "kinetic-agency.md",
  },
  {
    slug: "discernment",
    order: 3,
    category: "thought",
    title: "discernment",
    summary: "Taste as selection: the software and cinematic grammar of what to remove, automate, and make invisible.",
    markdownFile: "discernment.md",
  },
  {
    slug: "predictions",
    order: 4,
    category: "prediction",
    title: "predictions",
    summary: "Notes on agents as cognitive infrastructure, democratized capability, and freedom as the next luxury.",
    markdownFile: "predictions.md",
  },
];

export const portfolioWritings: PortfolioWriting[] = portfolioWritingConfigs.map(
  ({ markdownFile, ...writing }) => ({
    ...writing,
    markdown: readWritingMarkdown(markdownFile),
  }),
);
