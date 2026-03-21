import { Router } from "express";
import { getLlmsText, getPortfolioContent } from "../../controllers/public/portfolioController";

const router = Router();

router.get("/portfolio", getPortfolioContent);
router.get("/portfolio/llms.txt", getLlmsText);

export default router;
