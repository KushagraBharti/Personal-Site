import { Router } from "express";
import financeRoutes from "./financeRoutes";
import cronRoutes from "./cronRoutes";

const router = Router();

router.use("/finance", financeRoutes);
router.use("/cron", cronRoutes);

export default router;
