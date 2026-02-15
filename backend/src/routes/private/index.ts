import { Router } from "express";
import financeRoutes from "./financeRoutes";
import cronRoutes from "./cronRoutes";
import calendarRoutes from "./calendarRoutes";

const router = Router();

router.use("/finance", financeRoutes);
router.use("/calendar", calendarRoutes);
router.use("/cron", cronRoutes);

export default router;
