import { Request, Response } from 'express';
import { educationData } from '../../data/education';

export const getAllEducation = (req: Request, res: Response) => {
    res.json(educationData);
  };  

export const getEducationById = (req: Request, res: Response) => {
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const experienceId = parseInt(idParam ?? '', 10);
    if (!isNaN(experienceId) && experienceId >= 0 && experienceId < educationData.length) {
      res.json(educationData[experienceId]);
    } else {
      res.status(404).json({ message: "Education not found" });
    }
  };
