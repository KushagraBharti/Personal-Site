import express from 'express';
import { getAllEducation, getEducationById } from '../../controllers/public/educationController';

const router = express.Router();

router.get('/education', getAllEducation);
router.get('/education/:id', getEducationById);

export default router;
