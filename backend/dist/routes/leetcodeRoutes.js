"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/leetcodeRoutes.ts
const express_1 = __importDefault(require("express"));
const leetcodeController_1 = require("../controllers/leetcodeController");
const router = express_1.default.Router();
// GET /api/leetcode/stats
router.get("/stats", leetcodeController_1.getLeetCodeStats);
exports.default = router;
