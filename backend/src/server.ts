// backend/src/server.ts
import type {} from "./types/express";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) {
    return;
  }

  const contents = readFileSync(filePath, "utf8");
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const equalsIndex = line.indexOf("=");
    if (equalsIndex <= 0) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    if (!key || process.env[key] !== undefined) {
      continue;
    }

    let value = line.slice(equalsIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

loadEnvFile(resolve(process.cwd(), ".env"));

import app from "./app";

// Vercel runs Node code as Serverless Functions (no long-running servers).
// Locally (and on other platforms), we still start an HTTP server.
if (!process.env.VERCEL) {
  const PORT = Number(process.env.PORT || 5000);
  app.listen(PORT, () => {
    console.log(`Personal Site Backend is running on http://localhost:${PORT}`);
  });
}

// Export the Express app for Vercel (@vercel/node) to invoke per-request.
export = app;
