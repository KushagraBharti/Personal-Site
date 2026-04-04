import type { RequestHandler } from "express";
import { getPortfolioSnapshot } from "../services/portfolioSnapshotService";

export const getAllEducation: RequestHandler = (_req, res) => {
  res.json(getPortfolioSnapshot().education);
};

export const getEducationBySlug: RequestHandler = (req, res) => {
  const slug = typeof req.params.slug === "string" ? req.params.slug : "";
  const education = getPortfolioSnapshot().education.find((entry) => entry.slug === slug);

  if (!education) {
    res.status(404).json({ message: "Education not found" });
    return;
  }

  res.json(education);
};
