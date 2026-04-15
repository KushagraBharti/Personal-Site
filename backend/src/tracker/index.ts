import { Router } from "express";
import calendarRoutes from "./calendar/routes/calendarRoutes";
import cronRoutes from "./cron/routes/cronRoutes";
import taskListRoutes from "./tasks-hub/routes/taskListRoutes";

const router = Router();

router.use("/calendar", calendarRoutes);
router.use("/cron", cronRoutes);
router.use("/lists", taskListRoutes);

export default router;
