import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const rootDirectory = resolve(scriptDirectory, "..", "..");
const backendDirectory = resolve(rootDirectory, "backend");
const backendTsconfigPath = resolve(backendDirectory, "tsconfig.json");
const backendTscPath = resolve(backendDirectory, "node_modules/typescript/bin/tsc");
const publicDirectory = resolve(scriptDirectory, "../public");
const indexHtmlPath = resolve(scriptDirectory, "../index.html");
const outputPath = resolve(publicDirectory, "llms.txt");
const aiHtmlPath = resolve(scriptDirectory, "../ai.html");
const robotsPath = resolve(publicDirectory, "robots.txt");
const sitemapPath = resolve(publicDirectory, "sitemap.xml");
const introBootstrapPath = resolve(scriptDirectory, "../src/portfolio/generated/introBootstrap.ts");
const portfolioSnapshotBootstrapPath = resolve(scriptDirectory, "../src/portfolio/generated/portfolioSnapshotBootstrap.ts");
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
const portfolioSnapshot = snapshotModule.getPortfolioSnapshot();
const stablePortfolioSnapshot = {
  ...portfolioSnapshot,
  generatedAt: "generated-at-build-time",
};
const escapedLlmsText = llmsText
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");
const sharedHead = ({
  canonicalPath,
  description,
  title,
}) => `    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/portfolio/icons/brain.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preload" href="/portfolio/fonts/cormorant-garamond-latin.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="preload" href="/portfolio/fonts/cormorant-garamond-latin-ext.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="preload" href="/portfolio/fonts/ibm-plex-mono-400-latin.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="preload" href="/portfolio/fonts/ibm-plex-mono-500-latin.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="preload" href="/portfolio/fonts/ibm-plex-mono-600-latin.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="preload" href="/portfolio/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="canonical" href="${siteUrl}${canonicalPath}" />
    <link rel="alternate" type="text/plain" href="${siteUrl}/llms.txt" title="Kushagra Bharti AI-readable portfolio" />
    <link rel="alternate" type="text/html" href="${siteUrl}/ai" title="Kushagra Bharti structured AI portfolio" />
    <meta name="description" content="${description}" />
    <title>${title}</title>`;

const aiHtml = `<!doctype html>
<html lang="en">
  <head>
${sharedHead({
  canonicalPath: "/ai",
  description: "AI-readable portfolio profile for Kushagra Bharti, including experience, projects, education, links, and creative work.",
  title: "Kushagra Bharti - AI Portfolio",
})}
  </head>
  <body class="text-gray-800 font-inter">
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
const portfolioSnapshotBootstrapModule = `import type { PortfolioSnapshot } from "../api/contracts";

export const portfolioSnapshotBootstrap: PortfolioSnapshot = ${JSON.stringify(stablePortfolioSnapshot, null, 2)};
`;

for (const directory of [
  dirname(indexHtmlPath),
  dirname(outputPath),
  dirname(aiHtmlPath),
  dirname(robotsPath),
  dirname(sitemapPath),
  dirname(introBootstrapPath),
  dirname(portfolioSnapshotBootstrapPath),
]) {
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }
}

writeFileSync(introBootstrapPath, introBootstrapModule, "utf8");
writeFileSync(portfolioSnapshotBootstrapPath, portfolioSnapshotBootstrapModule, "utf8");

const { renderHomepage } = await import(
  pathToFileURL(resolve(scriptDirectory, "../src/entry-homepage-ssr.tsx")).href
);
const homepageHtml = renderHomepage();

const indexHtml = `<!doctype html>
<html lang="en">
  <head>
${sharedHead({
  canonicalPath: "/",
  description: "Portfolio for Kushagra Bharti, including engineering projects, research, creative work, and AI-readable profile content.",
  title: "Kushagra Bharti - Portfolio",
})}
  </head>
  <body class="text-gray-800 font-inter">
    <div id="root" data-prerendered="homepage">${homepageHtml}</div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

writeFileSync(indexHtmlPath, indexHtml, "utf8");
writeFileSync(outputPath, llmsText, "utf8");
writeFileSync(aiHtmlPath, aiHtml, "utf8");
writeFileSync(robotsPath, robotsText, "utf8");
writeFileSync(sitemapPath, sitemapXml, "utf8");

console.log(`Synced portfolio exports to ${outputPath}`);
