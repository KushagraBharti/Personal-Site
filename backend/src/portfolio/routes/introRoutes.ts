import { Router } from "express";
import { getIntroData } from "../controllers/introController";

const router = Router();

router.get("/intro", getIntroData);

export default router;
