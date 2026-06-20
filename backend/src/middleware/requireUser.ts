import type { NextFunction, Request, RequestHandler, Response } from "express";
import { getSupabaseAdmin } from "../tracker/calendar/services/calendarSyncQueueService";

type AuthedUser = { id: string; email?: string };

export const requireUser: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.header("authorization");
  const token = authHeader?.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : null;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user: AuthedUser = {
      id: data.user.id,
      email: data.user.email ?? undefined,
    };

    req.user = user;
    return next();
  } catch (error) {
    console.error("requireUser failed", error);
    return res.status(500).json({ error: "Server misconfigured" });
  }
};
