import { Router } from "express";
import calendarRoutes from "./calendar/routes/calendarRoutes";
import cronRoutes from "./cron/routes/cronRoutes";
import financeRoutes from "./finance/routes/financeRoutes";

const router = Router();

router.use("/finance", financeRoutes);
router.use("/calendar", calendarRoutes);
router.use("/cron", cronRoutes);

export default router;
