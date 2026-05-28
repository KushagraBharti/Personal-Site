import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const rootDirectory = resolve(scriptDirectory, "..", "..");
const backendDirectory = resolve(rootDirectory, "backend");
const backendTsconfigPath = resolve(backendDirectory, "tsconfig.json");
const backendTscPath = resolve(
  backendDirectory,
  "node_modules/typescript/bin/tsc",
);
const publicDirectory = resolve(scriptDirectory, "../public");
const indexHtmlPath = resolve(scriptDirectory, "../index.html");
const outputPath = resolve(publicDirectory, "llms.txt");
const aiHtmlPath = resolve(scriptDirectory, "../ai.html");
const robotsPath = resolve(publicDirectory, "robots.txt");
const sitemapPath = resolve(publicDirectory, "sitemap.xml");
const portfolioJsonPath = resolve(publicDirectory, "portfolio.json");
const versionJsonPath = resolve(publicDirectory, "version.json");
const introBootstrapPath = resolve(
  scriptDirectory,
  "../src/portfolio/generated/introBootstrap.ts",
);
const portfolioSnapshotBootstrapPath = resolve(
  scriptDirectory,
  "../src/portfolio/generated/portfolioSnapshotBootstrap.ts",
);
const homepageBootstrapPath = resolve(
  scriptDirectory,
  "../src/portfolio/generated/homepageBootstrap.ts",
);
const require = createRequire(import.meta.url);

const backendBuild = spawnSync(
  process.execPath,
  [backendTscPath, "-p", backendTsconfigPath],
  {
    cwd: rootDirectory,
    stdio: "pipe",
    encoding: "utf8",
  },
);

if (backendBuild.status !== 0) {
  const errorOutput = [backendBuild.stdout, backendBuild.stderr]
    .filter(Boolean)
    .join("\n")
    .trim();
  throw new Error(errorOutput || "Failed to build backend portfolio exports.");
}

const llmsTextModule = require(
  resolve(backendDirectory, "dist/portfolio/services/llmsTextService.js"),
);
const snapshotModule = require(
  resolve(
    backendDirectory,
    "dist/portfolio/services/portfolioSnapshotService.js",
  ),
);

const siteUrl =
  process.env.VITE_SITE_URL ||
  process.env.PUBLIC_SITE_URL ||
  llmsTextModule.DEFAULT_PUBLIC_SITE_URL;

const resolveGitCommit = () => {
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA;
  }

  const gitCommit = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
    cwd: rootDirectory,
    stdio: "pipe",
    encoding: "utf8",
  });

  return gitCommit.status === 0 ? gitCommit.stdout.trim() : "unknown";
};

const portfolioSnapshot = snapshotModule.getPortfolioSnapshot();
const generatedAt = portfolioSnapshot.generatedAt;
const llmsText = llmsTextModule.buildLlmsText(portfolioSnapshot, siteUrl);
const stablePortfolioSnapshot = {
  ...portfolioSnapshot,
  generatedAt: "generated-at-build-time",
};
const homepageBootstrap = {
  about: {
    introHeading: portfolioSnapshot.about.introHeading,
    introBody: portfolioSnapshot.about.introBody,
  },
  writings: portfolioSnapshot.writings.slice(0, 4).map((writing) => ({
    slug: writing.slug,
    title: writing.title,
    summary: writing.summary,
  })),
  experiences: portfolioSnapshot.experiences.map((experience) => ({
    slug: experience.slug,
    dateRange: experience.dateRange,
    category: experience.category,
    position: experience.position,
    summary: experience.summary,
    timelineTone: experience.timelineTone,
  })),
  projects: portfolioSnapshot.projects.slice(0, 9).map((project) => ({
    slug: project.slug,
    title: project.title,
    summary: project.summary,
    tags: project.tags.slice(0, 2),
    thumbnail: project.thumbnail,
    githubLink: project.githubLink,
  })),
  profile: {
    socialLinks: portfolioSnapshot.profile.socialLinks.map((link) => ({
      label: link.label,
      href: link.href,
    })),
  },
};
const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const escapeScriptJson = (value) =>
  JSON.stringify(value).replace(/</g, "\\u003c");
const absoluteUrl = (pathOrUrl) => {
  if (!pathOrUrl) return undefined;
  try {
    return new URL(pathOrUrl).href;
  } catch {
    return `${siteUrl}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
  }
};
const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: portfolioSnapshot.profile.name,
  url: siteUrl,
  image: absoluteUrl(portfolioSnapshot.intro.personalPhoto),
  email: `mailto:${portfolioSnapshot.profile.primaryEmail}`,
  description: portfolioSnapshot.profile.personalSummary,
  jobTitle: portfolioSnapshot.profile.headline,
  knowsAbout: Array.from(
    new Set(
      portfolioSnapshot.projects
        .slice(0, 9)
        .flatMap((project) => project.tags.slice(0, 5)),
    ),
  ),
  alumniOf: portfolioSnapshot.education.map((entry) => ({
    "@type": "EducationalOrganization",
    name: entry.position,
    url: entry.schoolLink,
  })),
  sameAs: [
    ...portfolioSnapshot.profile.socialLinks,
    ...portfolioSnapshot.profile.externalLinks,
  ].map((link) => link.href),
};
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: `${portfolioSnapshot.profile.name} Portfolio`,
  url: siteUrl,
  author: {
    "@type": "Person",
    name: portfolioSnapshot.profile.name,
  },
  description: portfolioSnapshot.profile.headline,
};
const projectItemListSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: `${portfolioSnapshot.profile.name} featured projects`,
  itemListElement: portfolioSnapshot.projects
    .slice(0, 9)
    .map((project, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "CreativeWork",
        name: project.title,
        description: project.summary,
        image: absoluteUrl(project.thumbnail),
        url: project.githubLink || `${siteUrl}/#projects`,
        keywords: project.tags.slice(0, 8).join(", "),
      },
    })),
};
const profilePageSchema = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  name: `${portfolioSnapshot.profile.name} AI-readable portfolio`,
  url: `${siteUrl}/ai`,
  dateModified: generatedAt,
  isPartOf: websiteSchema,
  mainEntity: personSchema,
  hasPart: [
    {
      "@type": "WebPageElement",
      name: "Plain text portfolio",
      url: `${siteUrl}/llms.txt`,
    },
    {
      "@type": "Dataset",
      name: `${portfolioSnapshot.profile.name} structured portfolio JSON`,
      url: `${siteUrl}/portfolio.json`,
    },
  ],
};
const renderPlainTextHtml = (text) => {
  const lines = text.split("\n");
  let html = "";
  let isListOpen = false;

  const closeList = () => {
    if (isListOpen) {
      html += "</ul>\n";
      isListOpen = false;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      closeList();
      continue;
    }

    if (trimmed.startsWith("- ")) {
      if (!isListOpen) {
        html += "<ul>\n";
        isListOpen = true;
      }
      html += `<li>${escapeHtml(trimmed.slice(2))}</li>\n`;
      continue;
    }

    closeList();

    if (trimmed.startsWith("### ")) {
      html += `<h3>${escapeHtml(trimmed.slice(4))}</h3>\n`;
    } else if (trimmed.startsWith("## ")) {
      html += `<h2>${escapeHtml(trimmed.slice(3))}</h2>\n`;
    } else if (trimmed.startsWith("# ")) {
      html += `<h1>${escapeHtml(trimmed.slice(2))}</h1>\n`;
    } else if (trimmed.startsWith("> ")) {
      html += `<p>${escapeHtml(trimmed.slice(2))}</p>\n`;
    } else {
      html += `<p>${escapeHtml(trimmed)}</p>\n`;
    }
  }

  closeList();
  return html;
};
const criticalCss = `@font-face{font-family:"Cormorant Garamond";font-style:normal;font-weight:400 700;font-display:optional;src:url("/portfolio/fonts/cormorant-garamond-latin.woff2") format("woff2")}@font-face{font-family:"IBM Plex Mono";font-style:normal;font-weight:400;font-display:optional;src:url("/portfolio/fonts/ibm-plex-mono-400-latin.woff2") format("woff2")}@font-face{font-family:"IBM Plex Mono";font-style:normal;font-weight:500;font-display:optional;src:url("/portfolio/fonts/ibm-plex-mono-500-latin.woff2") format("woff2")}@font-face{font-family:"Inter";font-style:normal;font-weight:400 700;font-display:optional;src:url("/portfolio/fonts/inter-latin.woff2") format("woff2")}:root{--portfolio-paper:#f4efe7;--portfolio-paper-deep:#ece5da;--portfolio-ink:#171512;--portfolio-muted:rgba(23,21,18,.78);--portfolio-accent:#cf6a40;--portfolio-border:rgba(23,21,18,.18);--portfolio-font-serif:"Cormorant Garamond",Georgia,serif;--portfolio-font-mono:"IBM Plex Mono","Courier New",monospace;--portfolio-font-sans:"Inter",system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}html,body,#root{min-height:100%;background:#f4efe7}html{scroll-behavior:smooth}body{margin:0;color:#171512;font-family:var(--portfolio-font-sans)}#root{background:#f4efe7}.fixed{position:fixed}.top-0{top:0}.left-0{left:0}.w-full{width:100%}[class~="h-1.5"]{height:.375rem}.h-full{height:100%}.z-50{z-index:50}.origin-left{transform-origin:left}.portfolio-overhaul-page{min-height:100vh;background:radial-gradient(circle at 20% 18%,rgba(255,255,255,.92),transparent 32%),radial-gradient(circle at 78% 12%,rgba(255,255,255,.7),transparent 28%),radial-gradient(circle at 62% 62%,rgba(231,220,205,.36),transparent 26%),linear-gradient(180deg,var(--portfolio-paper) 0%,#f1ebe2 100%);color:var(--portfolio-ink)}.portfolio-topbar{display:grid;grid-template-columns:minmax(10rem,11rem) 1fr auto;align-items:start;gap:2.25rem;padding:1.02rem 3.15rem .18rem;position:sticky;top:0;z-index:90;background:linear-gradient(180deg,rgba(244,239,231,.96) 0%,rgba(244,239,231,.84) 72%,rgba(244,239,231,0) 100%);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}.portfolio-topbar__brand{display:grid;gap:.08rem;justify-self:start;font-family:var(--portfolio-font-sans);font-size:.92rem;font-weight:700;line-height:.95;letter-spacing:.08em;color:var(--portfolio-ink);text-decoration:none}.portfolio-nav{display:inline-flex;align-items:center;justify-self:end;gap:.95rem;min-height:auto;padding:0;border-radius:0;border:0;background:transparent;box-shadow:none}.portfolio-nav-links{display:inline-flex;align-items:center;gap:1.95rem}.portfolio-nav-link{position:relative;font-family:var(--portfolio-font-sans);font-size:.92rem;font-weight:500;color:var(--portfolio-ink);text-decoration:none;line-height:1}.portfolio-nav-dot{width:.84rem;height:.84rem;border-radius:999px;background:#0f0d0b;flex-shrink:0}.hero-landing{position:relative;min-height:calc(100vh - 3.9rem);padding:.85rem 3.9rem 1.25rem 4.8rem}.hero-landing__grid{width:min(100%,102rem);margin:0 auto;display:grid;grid-template-columns:minmax(340px,.95fr) minmax(440px,1.02fr);align-items:center;gap:2.25rem;min-height:calc(100vh - 5.4rem)}.hero-landing__copy{padding-left:0;max-width:36rem;margin-top:2.25rem}.hero-landing__headline{display:grid;gap:.42rem}.hero-landing__headline-line{margin:0;font-family:var(--portfolio-font-serif);font-size:clamp(4rem,8vw,5.65rem);line-height:.95;font-weight:500;letter-spacing:-.04em;color:#11100d}.hero-landing__headline-line.is-accent{color:var(--portfolio-accent)}.hero-landing__summary{margin:4.15rem 0 0;font-family:var(--portfolio-font-mono);font-size:clamp(1rem,1.7vw,1.3rem);line-height:1.82;font-weight:500;color:var(--portfolio-muted)}.hero-landing__links{display:grid;gap:.9rem;margin-top:4.4rem;font-family:var(--portfolio-font-mono);font-size:.92rem;letter-spacing:.06em;color:var(--portfolio-muted)}.hero-landing__link-row{display:flex;align-items:center;flex-wrap:wrap;gap:.65rem 1.1rem}.hero-landing__link-row span{color:rgba(23,21,18,.56)}.hero-landing__link-row a,.hero-landing__link-row button{padding:0;border:0;background:transparent;font:inherit;letter-spacing:inherit;color:var(--portfolio-ink);text-decoration:none;cursor:pointer}.hero-landing__visual{position:relative;min-height:clamp(38rem,49vw,44rem);margin-left:clamp(-9.5rem,-10vw,-6.5rem);margin-top:.2rem}.hero-landing__scene{position:absolute;inset:0;z-index:10;display:grid;place-items:center;pointer-events:none}.hero-landing__ring{position:absolute;border-radius:999px;pointer-events:none}.hero-landing__ring--outer{top:.35rem;right:50%;transform:translateX(50%);width:clamp(35.5rem,44vw,42rem);height:clamp(35.5rem,44vw,42rem);border:4px solid rgba(19,17,14,.68);opacity:.95;box-shadow:0 0 0 12px rgba(0,0,0,.018),inset 0 0 0 2px rgba(255,255,255,.08)}.hero-landing__ring--inner{top:2.1rem;right:50%;transform:translateX(50%);width:clamp(31rem,39vw,37.2rem);height:clamp(31rem,39vw,37.2rem);border:2px dashed rgba(30,26,23,.24)}.hero-landing__dust{position:absolute;inset:0;pointer-events:none;background-repeat:no-repeat}.hero-landing__model-note{position:absolute;left:50%;bottom:clamp(-2.1rem,-2.15vw,-1.55rem);z-index:22;width:fit-content;max-width:min(31rem,86%);margin:0;padding:.38rem .62rem;transform:translateX(-50%);border:1px solid rgba(23,21,18,.12);border-radius:999px;background:rgba(244,239,231,.68);font-family:var(--portfolio-font-mono);font-size:.74rem;line-height:1.35;letter-spacing:.05em;text-align:center;color:rgba(23,21,18,.62);pointer-events:none}.ai-profile-text{min-height:100vh;max-width:78ch;margin:0;padding:1rem;background:#fff;color:#111;font-family:ui-monospace,SFMono-Regular,Consolas,Liberation Mono,monospace;font-size:16px;line-height:1.55}.ai-profile-text h1,.ai-profile-text h2,.ai-profile-text h3,.ai-profile-text p{margin:0 0 .75rem;font:inherit}.ai-profile-text h2{margin-top:1.5rem}.ai-profile-text h3{margin-top:1rem}.ai-profile-text ul,.ai-profile-text ol{margin:0 0 1rem;padding-left:1.5rem}.ai-profile-text li{margin:0 0 .35rem}.ai-profile-text a{color:#111;text-decoration:underline}@media (max-width:1100px){.portfolio-topbar{grid-template-columns:1fr;justify-items:start;gap:1rem;padding-inline:1.5rem}.portfolio-topbar__brand,.portfolio-nav{justify-self:start}.hero-landing__grid{grid-template-columns:1fr;gap:2.5rem;padding-top:.5rem}.hero-landing__copy{max-width:none;padding-left:0;margin-top:.5rem}.hero-landing__summary{margin-top:3rem}.hero-landing__links{margin-top:3.4rem}.hero-landing__visual{min-height:39rem;margin-left:0}}@media (max-width:760px){.portfolio-nav{width:min(100%,34rem);justify-content:space-between;min-height:auto;padding:0;border-radius:0}.portfolio-nav-links{display:flex;flex-wrap:wrap;gap:.7rem 1rem}.portfolio-nav-link{font-size:.94rem}.hero-landing{min-height:auto;padding:.85rem 1rem 1.35rem}.hero-landing__headline{gap:.42rem}.hero-landing__headline-line{font-size:clamp(3.2rem,17vw,4.4rem)}.hero-landing__summary{font-size:.96rem;line-height:1.8;margin-top:2.8rem}.hero-landing__links{gap:1rem;margin-top:2.5rem;font-size:.88rem}.hero-landing__visual{min-height:27rem;margin-left:0}.hero-landing__ring--outer{top:.6rem;width:min(92vw,26rem);height:min(92vw,26rem)}.hero-landing__ring--inner{top:1.8rem;width:min(79vw,22.6rem);height:min(79vw,22.6rem)}.hero-landing__model-note{bottom:-1.38rem;max-width:min(19rem,82vw);padding:.34rem .52rem;font-size:.62rem}}`;
const sharedHead = ({
  canonicalPath,
  description,
  jsonLd = [],
  title,
}) => `    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/portfolio/icons/brain.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preload" href="/portfolio/fonts/cormorant-garamond-latin.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="preload" href="/portfolio/fonts/ibm-plex-mono-400-latin.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="preload" href="/portfolio/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="canonical" href="${siteUrl}${canonicalPath}" />
    <link rel="alternate" type="text/plain" href="${siteUrl}/llms.txt" title="Kushagra Bharti AI-readable portfolio" />
    <link rel="alternate" type="text/plain" href="${siteUrl}/api/portfolio/llms.txt" title="Kushagra Bharti live AI-readable portfolio API" />
    <link rel="alternate" type="text/html" href="${siteUrl}/ai" title="Kushagra Bharti structured AI portfolio" />
    <link rel="alternate" type="application/json" href="${siteUrl}/portfolio.json" title="Kushagra Bharti structured portfolio JSON" />
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
    <meta name="description" content="${description}" />
    <meta property="og:type" content="profile" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${siteUrl}${canonicalPath}" />
    <meta property="og:image" content="${absoluteUrl(portfolioSnapshot.intro.personalPhoto)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${absoluteUrl(portfolioSnapshot.intro.personalPhoto)}" />
    <style>${criticalCss}</style>
    ${jsonLd
      .map(
        (schema) =>
          `<script type="application/ld+json">${escapeScriptJson(schema)}</script>`,
      )
      .join("\n    ")}
    <title>${title}</title>`;

const aiHtml = `<!doctype html>
<html lang="en">
  <head>
${sharedHead({
  canonicalPath: "/ai",
  description:
    "AI-readable portfolio profile for Kushagra Bharti, including experience, projects, education, links, and creative work.",
  jsonLd: [profilePageSchema, projectItemListSchema],
  title: "Kushagra Bharti - AI Portfolio",
})}
  </head>
  <body class="text-gray-800 font-inter">
    <div id="root">
      <main class="ai-profile-text">
        <article>
${renderPlainTextHtml(llmsText)}
        </article>
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
Allow: /portfolio.json
Allow: /version.json
Allow: /api/portfolio
Allow: /api/portfolio/llms.txt

# AI-readable portfolio: ${siteUrl}/llms.txt
# AI-readable semantic HTML: ${siteUrl}/ai
# Structured portfolio JSON: ${siteUrl}/portfolio.json
# Live public portfolio API: ${siteUrl}/api/portfolio
# Build/version metadata: ${siteUrl}/version.json
Sitemap: ${siteUrl}/sitemap.xml
`;
const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>${generatedAt}</lastmod>
  </url>
  <url>
    <loc>${siteUrl}/ai</loc>
    <lastmod>${generatedAt}</lastmod>
  </url>
  <url>
    <loc>${siteUrl}/llms.txt</loc>
    <lastmod>${generatedAt}</lastmod>
  </url>
  <url>
    <loc>${siteUrl}/portfolio.json</loc>
    <lastmod>${generatedAt}</lastmod>
  </url>
  <url>
    <loc>${siteUrl}/api/portfolio</loc>
    <lastmod>${generatedAt}</lastmod>
  </url>
</urlset>
`;
const versionJson = {
  siteUrl,
  generatedAt,
  commit: resolveGitCommit(),
  exports: {
    ai: `${siteUrl}/ai`,
    llmsTxt: `${siteUrl}/llms.txt`,
    portfolioJson: `${siteUrl}/portfolio.json`,
    sitemap: `${siteUrl}/sitemap.xml`,
  },
};
const introBootstrapModule = `import type { PortfolioIntroResponse } from "../api/contracts";

export const introBootstrap: PortfolioIntroResponse = ${JSON.stringify(snapshotModule.getIntroResponse(), null, 2)};
`;
const portfolioSnapshotBootstrapModule = `import type { PortfolioSnapshot } from "../api/contracts";

export const portfolioSnapshotBootstrap: PortfolioSnapshot = ${JSON.stringify(stablePortfolioSnapshot, null, 2)};
`;
const homepageBootstrapModule = `export type HomePageBootstrap = {
  about: {
    introHeading: string;
    introBody: string;
  };
  writings: Array<{
    slug: string;
    title: string;
    summary: string;
  }>;
  experiences: Array<{
    slug: string;
    dateRange: string;
    category: string;
    position: string;
    summary: string;
    timelineTone: "active" | "past";
  }>;
  projects: Array<{
    slug: string;
    title: string;
    summary: string;
    tags: string[];
    thumbnail?: string;
    githubLink?: string;
  }>;
  profile: {
    socialLinks: Array<{
      label: string;
      href: string;
    }>;
  };
};

export const homepageBootstrap: HomePageBootstrap = ${JSON.stringify(homepageBootstrap, null, 2)};
`;

for (const directory of [
  dirname(indexHtmlPath),
  dirname(outputPath),
  dirname(aiHtmlPath),
  dirname(robotsPath),
  dirname(sitemapPath),
  dirname(portfolioJsonPath),
  dirname(versionJsonPath),
  dirname(introBootstrapPath),
  dirname(portfolioSnapshotBootstrapPath),
  dirname(homepageBootstrapPath),
]) {
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }
}

writeFileSync(introBootstrapPath, introBootstrapModule, "utf8");
writeFileSync(
  portfolioSnapshotBootstrapPath,
  portfolioSnapshotBootstrapModule,
  "utf8",
);
writeFileSync(homepageBootstrapPath, homepageBootstrapModule, "utf8");

const { renderHomepage } = await import(
  pathToFileURL(resolve(scriptDirectory, "../src/entry-homepage-ssr.tsx")).href
);
const homepageHtml = renderHomepage();

const indexHtml = `<!doctype html>
<html lang="en">
  <head>
${sharedHead({
  canonicalPath: "/",
  description:
    "Portfolio for Kushagra Bharti, including engineering projects, research, creative work, and AI-readable profile content.",
  jsonLd: [personSchema, websiteSchema, projectItemListSchema],
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
writeFileSync(
  portfolioJsonPath,
  `${JSON.stringify(portfolioSnapshot, null, 2)}\n`,
  "utf8",
);
writeFileSync(
  versionJsonPath,
  `${JSON.stringify(versionJson, null, 2)}\n`,
  "utf8",
);
writeFileSync(aiHtmlPath, aiHtml, "utf8");
writeFileSync(robotsPath, robotsText, "utf8");
writeFileSync(sitemapPath, sitemapXml, "utf8");

console.log(`Synced portfolio exports to ${outputPath}`);
