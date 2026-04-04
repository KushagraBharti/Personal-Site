import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DEFAULT_PUBLIC_SITE_URL } from "../../backend/src/portfolio/services/llmsTextService";
import { getLlmsTextExport } from "../../backend/src/portfolio/services/portfolioExportService";

const siteUrl =
  process.env.VITE_SITE_URL || process.env.PUBLIC_SITE_URL || DEFAULT_PUBLIC_SITE_URL;

const outputPath = resolve(import.meta.dir, "../public/llms.txt");
const llmsText = getLlmsTextExport(siteUrl);
const outputDirectory = dirname(outputPath);

if (!existsSync(outputDirectory)) {
  mkdirSync(outputDirectory, { recursive: true });
}

writeFileSync(outputPath, llmsText, "utf8");

console.log(`Synced portfolio exports to ${outputPath}`);
