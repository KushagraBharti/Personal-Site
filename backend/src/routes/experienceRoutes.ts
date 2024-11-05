import express from 'express';
import { getAllExperiences, getExperienceById } from '../controllers/experienceController';

const router = express.Router();

router.get('/experiences', getAllExperiences);
router.get('/experiences/:id', getExperienceById);

export default router;