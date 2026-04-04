import { Router } from "express";
import { getWeather } from "../controllers/liveWidgetsController";

const router = Router();

router.get("/", getWeather);

export default router;
