import { Router } from "express";
import portfolioRoutes from "../portfolio/routes";
import trackerRoutes from "../tracker";
import trackerMcpRoutes from "../tracker/mcp/mcpRoutes";

const router = Router();

router.use("/api/mcp", trackerMcpRoutes);
router.use("/api", portfolioRoutes);
router.use("/api/private", trackerRoutes);

export default router;
