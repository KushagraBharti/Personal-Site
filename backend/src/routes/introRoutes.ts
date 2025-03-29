// backend/src/routes/introRoutes.ts
import express from "express";
import { getIntroData } from "../controllers/introController";

const router = express.Router();

// GET /api/intro
router.get("/intro", getIntroData);

export default router;
