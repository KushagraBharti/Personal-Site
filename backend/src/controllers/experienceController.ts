import { Request, Response } from 'express';
import { experiencesData } from '../data/experiences';

export const getAllExperiences = (req: Request, res: Response) => {
    res.json(experiencesData);
  };  

export const getExperienceById = (req: Request, res: Response) => {
    const experienceId = parseInt(req.params.id, 10);
    if (!isNaN(experienceId) && experienceId >= 0 && experienceId < experiencesData.length) {
      res.json(experiencesData[experienceId]);
    } else {
      res.status(404).json({ message: "Experience not found" });
    }
  };