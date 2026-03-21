import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  buildLlmsText,
  DEFAULT_PUBLIC_SITE_URL,
  getPortfolioSnapshot,
} from "../../backend/src/services/public/portfolioContentService";

const siteUrl =
  process.env.VITE_SITE_URL || process.env.PUBLIC_SITE_URL || DEFAULT_PUBLIC_SITE_URL;

const outputPath = resolve(import.meta.dir, "../public/llms.txt");
const llmsText = buildLlmsText(getPortfolioSnapshot(), siteUrl);

const outputDirectory = dirname(outputPath);
if (!existsSync(outputDirectory)) {
  mkdirSync(outputDirectory, { recursive: true });
}
writeFileSync(outputPath, llmsText, "utf8");

console.log(`Generated llms.txt at ${outputPath}`);
