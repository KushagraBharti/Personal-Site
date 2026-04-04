import { Router } from "express";
import calendarRoutes from "./calendar/routes/calendarRoutes";
import cronRoutes from "./cron/routes/cronRoutes";

const router = Router();

router.use("/calendar", calendarRoutes);
router.use("/cron", cronRoutes);

export default router;
