"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/githubRoutes.ts
const express_1 = __importDefault(require("express"));
const githubController_1 = require("../controllers/githubController");
const router = express_1.default.Router();
// GET /api/github/stats
router.get("/stats", githubController_1.getGitHubStats);
exports.default = router;
