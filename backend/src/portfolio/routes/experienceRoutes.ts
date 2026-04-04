import { Router } from "express";
import {
  getAllExperiences,
  getExperienceBySlug,
} from "../controllers/experiencesController";

const router = Router();

router.get("/experiences", getAllExperiences);
router.get("/experiences/:slug", getExperienceBySlug);

export default router;
