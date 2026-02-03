import { Request, Response } from 'express';
import { projectsData } from '../../data/projects';

// Fetch all projects
export const getAllProjects = (req: Request, res: Response) => {
  res.json(projectsData);
};

// Fetch a single project by ID
export const getProjectById = (req: Request, res: Response) => {
  const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const projectId = parseInt(idParam ?? '', 10);
  if (!isNaN(projectId) && projectId >= 0 && projectId < projectsData.length) {
    res.json(projectsData[projectId]);
  } else {
    res.status(404).json({ message: "Project not found" });
  }
};
