import { Router } from "express";
import projectRoutes from "./projectRoutes";
import experienceRoutes from "./experienceRoutes";
import educationRoutes from "./educationRoutes";
import introRoutes from "./introRoutes";
import githubRoutes from "./githubRoutes";
import weatherRoutes from "./weatherRoutes";
import leetcodeRoutes from "./leetcodeRoutes";

const router = Router();

router.use(projectRoutes);
router.use(experienceRoutes);
router.use(educationRoutes);
router.use(introRoutes);
router.use("/github", githubRoutes);
router.use("/weather", weatherRoutes);
router.use("/leetcode", leetcodeRoutes);

export default router;
