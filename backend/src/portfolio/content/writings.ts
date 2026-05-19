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
    slug: "epistemic-velocity",
    order: 1,
    category: "value",
    title: "epistemic velocity",
    summary: "Curiosity disciplined into pace; learning as the only durable hedge against decay.",
    markdownFile: "epistemic-velocity.md",
  },
  {
    slug: "adaptive-agency",
    order: 2,
    category: "belief",
    title: "adaptive agency",
    summary: "Fast revision, clear judgment, and the ability to move before consensus hardens.",
    markdownFile: "adaptive-agency.md",
  },
  {
    slug: "aesthetic-judgment",
    order: 3,
    category: "thought",
    title: "aesthetic judgment",
    summary: "Taste as compression: knowing what to remove, what to frame, and when to stop.",
    markdownFile: "aesthetic-judgment.md",
  },
  {
    slug: "ambient-agency",
    order: 4,
    category: "prediction",
    title: "ambient agency",
    summary: "Software will recede from destination into context, memory, and quiet execution.",
    markdownFile: "ambient-agency.md",
  },
];

export const portfolioWritings: PortfolioWriting[] = portfolioWritingConfigs.map(
  ({ markdownFile, ...writing }) => ({
    ...writing,
    markdown: readWritingMarkdown(markdownFile),
  }),
);
