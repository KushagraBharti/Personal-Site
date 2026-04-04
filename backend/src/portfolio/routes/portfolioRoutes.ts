import { Router } from "express";
import { getLlmsText, getPortfolioContent } from "../controllers/portfolioController";

const router = Router();

router.get("/portfolio", getPortfolioContent);
router.get("/portfolio/llms.txt", getLlmsText);

export default router;
