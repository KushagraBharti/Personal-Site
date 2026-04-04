import { Router } from "express";
import portfolioRoutes from "../portfolio/routes";
import trackerRoutes from "../tracker";

const router = Router();

router.use("/api", portfolioRoutes);
router.use("/api/private", trackerRoutes);

export default router;
