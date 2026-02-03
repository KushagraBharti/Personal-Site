// backend/src/routes/public/weatherRoutes.ts
import express from "express";
import { getWeather } from "../../controllers/public/weatherController";

const router = express.Router();

// GET /api/weather
router.get("/", getWeather);

export default router;
