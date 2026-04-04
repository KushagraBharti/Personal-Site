import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const frontendRoot = dirname(scriptDir);
const vitestEntrypoint = join(frontendRoot, "node_modules", "vitest", "vitest.mjs");

const existingNodeOptions = (process.env.NODE_OPTIONS || "")
  .split(/\s+/)
  .filter((token) => token && !token.startsWith("--localstorage-file"))
  .join(" ")
  .trim();

const sanitizedExecArgv = process.execArgv.filter(
  (token) => token && !token.startsWith("--localstorage-file")
);

process.execArgv.splice(0, process.execArgv.length, ...sanitizedExecArgv);

const env = {
  ...process.env,
  NODE_OPTIONS: existingNodeOptions,
};

const result = spawnSync(process.execPath, [...sanitizedExecArgv, vitestEntrypoint, ...process.argv.slice(2)], {
  cwd: frontendRoot,
  stdio: "inherit",
  env,
});

if (result.error) {
  console.error(result.error);
}

process.exit(result.status ?? 1);
