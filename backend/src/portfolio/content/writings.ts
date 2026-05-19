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
    slug: "lifelong-learning",
    order: 1,
    category: "value",
    title: "lifelong learning",
    summary: "Permanent epistemic hunger as armor against entropy, complacency, and slow competitive death.",
    markdownFile: "lifelong-learning.md",
  },
  {
    slug: "kinetic-agency",
    order: 2,
    category: "belief",
    title: "kinetic agency",
    summary: "Flexibility, tempo, and first-principles violence against brittle plans in a moving world.",
    markdownFile: "kinetic-agency.md",
  },
  {
    slug: "common-intelligence",
    order: 3,
    category: "prediction",
    title: "common intelligence",
    summary: "When cognition commoditizes, access becomes infrastructure, morality, and liberation technology.",
    markdownFile: "common-intelligence.md",
  },
  {
    slug: "taste",
    order: 4,
    category: "thought",
    title: "taste",
    summary: "The filmmaker's curse: noticing rhythm, absence, light, and the moral residue of every cut.",
    markdownFile: "taste.md",
  },
];

export const portfolioWritings: PortfolioWriting[] = portfolioWritingConfigs.map(
  ({ markdownFile, ...writing }) => ({
    ...writing,
    markdown: readWritingMarkdown(markdownFile),
  }),
);
