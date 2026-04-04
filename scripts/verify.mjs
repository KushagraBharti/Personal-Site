import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { basename, join } from "node:path";

const root = process.cwd();
const mode = process.argv[2] ?? "verify";
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

const excludedEntries = new Set([
  ".agents",
  ".claude",
  ".codex",
  ".gemini",
  ".git",
  ".github",
  ".opencode",
  "node_modules",
  "dist",
  "coverage",
  "playwright-report",
  "test-results",
  "package-lock.json",
  "prototypes",
]);

function loadDotenvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  const parsed = {};
  const content = readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in parsed)) {
      parsed[key] = value;
    }
  }

  return parsed;
}

function shouldMirrorWorkspace() {
  return process.platform === "win32" && root.toLowerCase().includes("\\onedrive\\");
}

function prepareMirror() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const mirrorRoot = join(homedir(), "Downloads", `${basename(root)}-verify-${timestamp}`);
  mkdirSync(mirrorRoot, { recursive: true });

  for (const entry of readdirSync(root)) {
    if (excludedEntries.has(entry)) {
      continue;
    }

    cpSync(join(root, entry), join(mirrorRoot, entry), {
      recursive: true,
      filter(source) {
        const name = source.split(/[\\/]/).pop() ?? "";
        return !excludedEntries.has(name);
      },
    });
  }

  return mirrorRoot;
}

function run(command, args, cwd = root, extraEnv = {}) {
  const pretty = `${command} ${args.join(" ")}`;
  console.log(`\n> ${pretty}`);
  const env = { ...process.env, ...extraEnv };
  env.npm_config_audit = "false";
  env.npm_config_fund = "false";
  env.npm_config_progress = "false";
  env.npm_config_package_lock = "false";
  delete env.NO_COLOR;
  delete env.FORCE_COLOR;

  if (env.NODE_OPTIONS) {
    const sanitizedNodeOptions = env.NODE_OPTIONS
      .split(/\s+/)
      .filter((token) => token && !token.startsWith("--localstorage-file"))
      .join(" ")
      .trim();

    if (sanitizedNodeOptions) {
      env.NODE_OPTIONS = sanitizedNodeOptions;
    } else {
      delete env.NODE_OPTIONS;
    }
  }

  const isWindowsNpm = process.platform === "win32" && command === npmCmd;
  const result = spawnSync(
    isWindowsNpm ? "cmd.exe" : command,
    isWindowsNpm
      ? ["/d", "/s", "/c", `npm ${args.map((arg) => (/\s/.test(arg) ? `"${arg}"` : arg)).join(" ")}`]
      : args,
    {
      cwd,
      stdio: "inherit",
      env,
    },
  );

  if (result.error) {
    console.error(result.error);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function npmInstall(cwd) {
  run(npmCmd, ["install", "--no-package-lock"], cwd);
}

function npmRun(cwd, script) {
  run(npmCmd, ["run", script], cwd);
}

const workspaceRoot = shouldMirrorWorkspace() ? prepareMirror() : root;
const backendDir = join(workspaceRoot, "backend");
const frontendDir = join(workspaceRoot, "frontend");
const backendEnv = loadDotenvFile(join(backendDir, ".env"));
const requiredLiveEnvKeys = ["GITHUB_USERNAME", "OPENWEATHER_API_KEY"];

const shouldRunLive = mode.includes("live");
const shouldRunFull = mode.includes("full");

npmInstall(backendDir);
npmInstall(frontendDir);

for (const script of ["build", "lint"]) {
  npmRun(backendDir, script);
  npmRun(frontendDir, script);
}

npmRun(backendDir, "test:unit");
npmRun(frontendDir, "test:unit");
npmRun(backendDir, "test:integration");
npmRun(frontendDir, "test:integration");

if (shouldRunFull) {
  npmRun(frontendDir, "test:smoke");
  npmRun(frontendDir, "test:e2e");
}

if (shouldRunLive) {
  const missingKeys = requiredLiveEnvKeys.filter(
    (key) => !(backendEnv[key] || process.env[key])
  );

  if (missingKeys.length > 0) {
    console.error(
      `verify:live requires live env values for: ${missingKeys.join(", ")}. ` +
        `Add them to backend/.env or your shell environment.`
    );
    process.exit(1);
  }

  run(npmCmd, ["run", "test:live"], backendDir, backendEnv);
}
