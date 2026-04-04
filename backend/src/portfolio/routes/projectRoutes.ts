import { Router } from "express";
import { getAllProjects, getProjectBySlug } from "../controllers/projectsController";

const router = Router();

router.get("/projects", getAllProjects);
router.get("/projects/:slug", getProjectBySlug);

export default router;
