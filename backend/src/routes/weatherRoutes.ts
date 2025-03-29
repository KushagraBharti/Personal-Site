// backend/src/routes/weatherRoutes.ts
import express from "express";
import { getWeather } from "../controllers/weatherController";

const router = express.Router();

// GET /api/weather
router.get("/", getWeather);

export default router;
