import { Request, Response } from 'express';
import { experiencesData } from '../data/experiences';

export const getAllExperiences = (req: Request, res: Response) => {
    res.json(experiencesData);
  };  

export const getExperienceById = (req: Request, res: Response) => {
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const experienceId = parseInt(idParam ?? '', 10);
    if (!isNaN(experienceId) && experienceId >= 0 && experienceId < experiencesData.length) {
      res.json(experiencesData[experienceId]);
    } else {
      res.status(404).json({ message: "Experience not found" });
    }
  };