import type { RequestHandler } from "express";
import { getPortfolioSnapshot } from "../services/portfolioSnapshotService";

export const getAllExperiences: RequestHandler = (_req, res) => {
  res.json(getPortfolioSnapshot().experiences);
};

export const getExperienceBySlug: RequestHandler = (req, res) => {
  const slug = typeof req.params.slug === "string" ? req.params.slug : "";
  const experience = getPortfolioSnapshot().experiences.find((entry) => entry.slug === slug);

  if (!experience) {
    res.status(404).json({ message: "Experience not found" });
    return;
  }

  res.json(experience);
};
