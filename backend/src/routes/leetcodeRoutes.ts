// backend/src/routes/leetcodeRoutes.ts
import express from "express";
import { getLeetCodeStats } from "../controllers/leetcodeController";

const router = express.Router();

// GET /api/leetcode/stats returns the LeetCode statistics
router.get("/stats", getLeetCodeStats);

export default router;
