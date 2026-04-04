import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DEFAULT_PUBLIC_SITE_URL } from "../../backend/src/portfolio/services/llmsTextService";
import { getLlmsTextExport } from "../../backend/src/portfolio/services/portfolioExportService";
import { getIntroResponse } from "../../backend/src/portfolio/services/portfolioSnapshotService";

const siteUrl =
  process.env.VITE_SITE_URL || process.env.PUBLIC_SITE_URL || DEFAULT_PUBLIC_SITE_URL;

const outputPath = resolve(import.meta.dir, "../public/llms.txt");
const introBootstrapPath = resolve(import.meta.dir, "../src/portfolio/generated/introBootstrap.ts");
const llmsText = getLlmsTextExport(siteUrl);
const introBootstrapModule = `import type { PortfolioIntroResponse } from "../api/contracts";

export const introBootstrap: PortfolioIntroResponse = ${JSON.stringify(getIntroResponse(), null, 2)};
`;
const outputDirectory = dirname(outputPath);
const introBootstrapDirectory = dirname(introBootstrapPath);

if (!existsSync(outputDirectory)) {
  mkdirSync(outputDirectory, { recursive: true });
}

if (!existsSync(introBootstrapDirectory)) {
  mkdirSync(introBootstrapDirectory, { recursive: true });
}

writeFileSync(outputPath, llmsText, "utf8");
writeFileSync(introBootstrapPath, introBootstrapModule, "utf8");

console.log(`Synced portfolio exports to ${outputPath}`);
