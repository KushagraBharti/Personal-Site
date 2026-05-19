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
    slug: "curiosity",
    order: 1,
    category: "value",
    title: "curiosity",
    summary: "Questions are the cheapest way to find hidden leverage.",
    markdownFile: "curiosity.md",
  },
  {
    slug: "taste",
    order: 2,
    category: "belief",
    title: "taste",
    summary: "Craft matters because people can feel when a system was cared for.",
    markdownFile: "taste.md",
  },
  {
    slug: "agency",
    order: 3,
    category: "thought",
    title: "agency",
    summary: "The best tools make people more capable without making them dependent.",
    markdownFile: "agency.md",
  },
  {
    slug: "interfaces",
    order: 4,
    category: "prediction",
    title: "interfaces",
    summary: "Software will move from static screens toward adaptive work surfaces.",
    markdownFile: "interfaces.md",
  },
];

export const portfolioWritings: PortfolioWriting[] = portfolioWritingConfigs.map(
  ({ markdownFile, ...writing }) => ({
    ...writing,
    markdown: readWritingMarkdown(markdownFile),
  }),
);
