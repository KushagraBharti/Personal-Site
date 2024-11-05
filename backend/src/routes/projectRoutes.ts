import express from 'express';
import { getAllProjects, getProjectById } from '../controllers/projectController';

const router = express.Router();

router.get('/projects', getAllProjects);
router.get('/projects/:id', getProjectById);

export default router;
