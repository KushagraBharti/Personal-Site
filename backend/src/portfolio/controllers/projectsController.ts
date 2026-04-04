import type { RequestHandler } from "express";
import { getPortfolioSnapshot } from "../services/portfolioSnapshotService";

export const getAllProjects: RequestHandler = (_req, res) => {
  res.json(getPortfolioSnapshot().projects);
};

export const getProjectBySlug: RequestHandler = (req, res) => {
  const slug = typeof req.params.slug === "string" ? req.params.slug : "";
  const project = getPortfolioSnapshot().projects.find((entry) => entry.slug === slug);

  if (!project) {
    res.status(404).json({ message: "Project not found" });
    return;
  }

  res.json(project);
};
