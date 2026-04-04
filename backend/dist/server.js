"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
function loadEnvFile(filePath) {
    if (!(0, node_fs_1.existsSync)(filePath)) {
        return;
    }
    const contents = (0, node_fs_1.readFileSync)(filePath, "utf8");
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
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        process.env[key] = value;
    }
}
loadEnvFile((0, node_path_1.resolve)(process.cwd(), ".env"));
const app_1 = __importDefault(require("./app"));
// Vercel runs Node code as Serverless Functions (no long-running servers).
// Locally (and on other platforms), we still start an HTTP server.
if (!process.env.VERCEL) {
    const PORT = Number(process.env.PORT || 5000);
    app_1.default.listen(PORT, () => {
        console.log(`Personal Site Backend is running on http://localhost:${PORT}`);
    });
}
module.exports = app_1.default;
