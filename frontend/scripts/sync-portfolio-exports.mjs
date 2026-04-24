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
const aiHtmlPath = resolve(scriptDirectory, "../ai.html");
const robotsPath = resolve(publicDirectory, "robots.txt");
const sitemapPath = resolve(publicDirectory, "sitemap.xml");
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
const escapedLlmsText = llmsText
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");
const aiHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/brain.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="canonical" href="${siteUrl}/ai" />
    <link rel="alternate" type="text/plain" href="${siteUrl}/llms.txt" title="Kushagra Bharti AI-readable portfolio" />
    <meta name="description" content="AI-readable portfolio profile for Kushagra Bharti, including experience, projects, education, links, and creative work." />
    <title>Kushagra Bharti - AI Portfolio</title>
  </head>
  <body class="bg-sky-400 text-gray-800 font-inter">
    <div id="root">
      <main>
        <h1>Kushagra Bharti AI Portfolio</h1>
        <p>This page has crawlable fallback content for AI/search clients. The interactive portfolio app loads on top for browsers.</p>
        <pre>${escapedLlmsText}</pre>
      </main>
    </div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
const robotsText = `User-agent: *
Allow: /
Allow: /ai
Allow: /llms.txt

Sitemap: ${siteUrl}/sitemap.xml
`;
const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
  </url>
  <url>
    <loc>${siteUrl}/ai</loc>
  </url>
  <url>
    <loc>${siteUrl}/llms.txt</loc>
  </url>
</urlset>
`;
const introBootstrapModule = `import type { PortfolioIntroResponse } from "../api/contracts";

export const introBootstrap: PortfolioIntroResponse = ${JSON.stringify(snapshotModule.getIntroResponse(), null, 2)};
`;

for (const directory of [
  dirname(outputPath),
  dirname(aiHtmlPath),
  dirname(robotsPath),
  dirname(sitemapPath),
  dirname(introBootstrapPath),
]) {
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }
}

writeFileSync(outputPath, llmsText, "utf8");
writeFileSync(aiHtmlPath, aiHtml, "utf8");
writeFileSync(robotsPath, robotsText, "utf8");
writeFileSync(sitemapPath, sitemapXml, "utf8");
writeFileSync(introBootstrapPath, introBootstrapModule, "utf8");

console.log(`Synced portfolio exports to ${outputPath}`);
