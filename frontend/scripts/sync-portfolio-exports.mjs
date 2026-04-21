import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const rootDirectory = resolve(scriptDirectory, "..", "..");
const backendDirectory = resolve(rootDirectory, "backend");
const backendTsconfigPath = resolve(backendDirectory, "tsconfig.json");
const backendTscPath = resolve(backendDirectory, "node_modules/typescript/bin/tsc");
const publicDirectory = resolve(scriptDirectory, "../public");
const outputPath = resolve(publicDirectory, "llms.txt");
const introBootstrapPath = resolve(scriptDirectory, "../src/portfolio/generated/introBootstrap.ts");
const require = createRequire(import.meta.url);

const backendBuild = spawnSync(process.execPath, [backendTscPath, "-p", backendTsconfigPath], {
  cwd: rootDirectory,
  stdio: "pipe",
  encoding: "utf8",
});

if (backendBuild.status !== 0) {
  const errorOutput = [backendBuild.stdout, backendBuild.stderr].filter(Boolean).join("\n").trim();
  throw new Error(errorOutput || "Failed to build backend portfolio exports.");
}

const llmsTextModule = require(resolve(backendDirectory, "dist/portfolio/services/llmsTextService.js"));
const exportModule = require(
  resolve(backendDirectory, "dist/portfolio/services/portfolioExportService.js")
);
const snapshotModule = require(
  resolve(backendDirectory, "dist/portfolio/services/portfolioSnapshotService.js")
);

const siteUrl =
  process.env.VITE_SITE_URL ||
  process.env.PUBLIC_SITE_URL ||
  llmsTextModule.DEFAULT_PUBLIC_SITE_URL;

const llmsText = exportModule.getLlmsTextExport(siteUrl);
const introBootstrapModule = `import type { PortfolioIntroResponse } from "../api/contracts";

export const introBootstrap: PortfolioIntroResponse = ${JSON.stringify(snapshotModule.getIntroResponse(), null, 2)};
`;

for (const directory of [dirname(outputPath), dirname(introBootstrapPath)]) {
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }
}

writeFileSync(outputPath, llmsText, "utf8");
writeFileSync(introBootstrapPath, introBootstrapModule, "utf8");

console.log(`Synced portfolio exports to ${outputPath}`);
