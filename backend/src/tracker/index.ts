import { Router } from "express";
import calendarRoutes from "./calendar/routes/calendarRoutes";
import cronRoutes from "./cron/routes/cronRoutes";
import taskListRoutes from "./tasks-hub/routes/taskListRoutes";
import taskRoutes from "./tasks-hub/routes/taskRoutes";

const router = Router();

router.use("/calendar", calendarRoutes);
router.use("/cron", cronRoutes);
router.use("/lists", taskListRoutes);
router.use("/tasks", taskRoutes);

export default router;
