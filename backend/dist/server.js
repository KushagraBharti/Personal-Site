"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config(); // Load env vars immediately
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
