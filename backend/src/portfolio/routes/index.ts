import { Router } from "express";
import educationRoutes from "./educationRoutes";
import experienceRoutes from "./experienceRoutes";
import githubRoutes from "./githubRoutes";
import introRoutes from "./introRoutes";
import leetcodeRoutes from "./leetcodeRoutes";
import portfolioRoutes from "./portfolioRoutes";
import projectRoutes from "./projectRoutes";
import weatherRoutes from "./weatherRoutes";

const router = Router();

router.use(projectRoutes);
router.use(experienceRoutes);
router.use(educationRoutes);
router.use(introRoutes);
router.use("/github", githubRoutes);
router.use("/weather", weatherRoutes);
router.use("/leetcode", leetcodeRoutes);
router.use(portfolioRoutes);

export default router;
