import type { NextFunction, Request, RequestHandler, Response } from "express";
import { createClient } from "@supabase/supabase-js";

type AuthedUser = { id: string; email?: string };

const getSupabaseAdmin = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("SUPABASE_URL and (SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY) must be set");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
};

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
