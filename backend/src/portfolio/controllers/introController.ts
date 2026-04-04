import type { RequestHandler } from "express";
import { getIntroResponse } from "../services/portfolioSnapshotService";

export const getIntroData: RequestHandler = (_req, res) => {
  res.json(getIntroResponse());
};
