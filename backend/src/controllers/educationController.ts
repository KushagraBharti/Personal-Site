import { Request, Response } from 'express';
import { educationData } from '../data/education';

export const getAllEducation = (req: Request, res: Response) => {
    res.json(educationData);
  };  

export const getEducationById = (req: Request, res: Response) => {
    const experienceId = parseInt(req.params.id, 10);
    if (!isNaN(experienceId) && experienceId >= 0 && experienceId < educationData.length) {
      res.json(educationData[experienceId]);
    } else {
      res.status(404).json({ message: "Education not found" });
    }
  };