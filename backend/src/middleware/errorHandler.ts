import { NextFunction, Request, Response } from "express";

export const errorHandler = (err: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(err);
  }

  const status = (err as any)?.status ?? (err as any)?.statusCode ?? 500;
  const message = "Internal server error";

  // Always log server errors; the client response stays generic.
  console.error(err);

  res.status(status).json({ error: message });
};
