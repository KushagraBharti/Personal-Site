import { Router } from "express";
import { getAllEducation, getEducationBySlug } from "../controllers/educationController";

const router = Router();

router.get("/education", getAllEducation);
router.get("/education/:slug", getEducationBySlug);

export default router;
