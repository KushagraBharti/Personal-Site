import { timingSafeEqual } from "crypto";
import { NextFunction, Request, Response } from "express";

export const cronAuth = (req: Request, res: Response, next: NextFunction) => {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return res.status(500).json({ error: "CRON_SECRET is not configured" });
  }

  const authHeader = req.header("authorization");
  const bearerToken = authHeader?.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : null;

  const provided =
    bearerToken ||
    req.header("x-cron-secret") ||
    req.header("cron-secret") ||
    req.header("CRON_SECRET");

  if (!provided) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  if (providedBuffer.length !== expectedBuffer.length) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!timingSafeEqual(providedBuffer, expectedBuffer)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  return next();
};
