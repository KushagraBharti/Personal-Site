import { Router } from "express";
import calendarRoutes from "./calendar/routes/calendarRoutes";
import cronRoutes from "./cron/routes/cronRoutes";
import sortPreferenceRoutes from "./tasks-hub/routes/sortPreferenceRoutes";
import trackerBootstrapRoutes from "./tasks-hub/routes/trackerBootstrapRoutes";
import taskListRoutes from "./tasks-hub/routes/taskListRoutes";
import taskRoutes from "./tasks-hub/routes/taskRoutes";

const router = Router();

router.use("/calendar", calendarRoutes);
router.use("/cron", cronRoutes);
router.use("/tracker", trackerBootstrapRoutes);
router.use("/lists", taskListRoutes);
router.use("/tasks", taskRoutes);
router.use("/task-sort-preferences", sortPreferenceRoutes);

export default router;
