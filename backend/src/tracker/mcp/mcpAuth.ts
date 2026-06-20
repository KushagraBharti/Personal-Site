import { timingSafeEqual } from "node:crypto";
import { Request, Response } from "express";

const DEFAULT_ALLOWED_ORIGINS = [
  "https://poke.com",
  "https://www.poke.com",
];

const localOriginRegex = /^http:\/\/(?:localhost|127\.0\.0\.1):\d+$/i;

const splitCsv = (value: string | undefined) =>
  (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const getConfiguredApiKey = () =>
  process.env.TRACKER_MCP_API_KEY || process.env.POKE_TRACKER_MCP_API_KEY || "";

export const getTrackerMcpOwnerUserId = () =>
  process.env.TRACKER_MCP_OWNER_USER_ID ||
  process.env.POKE_TRACKER_OWNER_USER_ID ||
  "";

export const isTrackerMcpConfigured = () =>
  process.env.TRACKER_MCP_ENABLED !== "0" &&
  !!getConfiguredApiKey() &&
  !!getTrackerMcpOwnerUserId();

const getBearerToken = (req: Request) => {
  const header = req.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match?.[1]?.trim() ?? "";
};

const safeStringEquals = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
};

const isAllowedOrigin = (origin: string) => {
  const configured = splitCsv(process.env.TRACKER_MCP_ALLOWED_ORIGINS);
  const allowed = new Set([...DEFAULT_ALLOWED_ORIGINS, ...configured]);
  if (allowed.has(origin)) return true;
  return process.env.NODE_ENV !== "production" && localOriginRegex.test(origin);
};

export type TrackerMcpAuthResult =
  | {
      ok: true;
      ownerUserId: string;
      pokeUserId: string | null;
    }
  | {
      ok: false;
      status: number;
      error: string;
    };

export const authenticateTrackerMcpRequest = (
  req: Request,
): TrackerMcpAuthResult => {
  if (process.env.TRACKER_MCP_ENABLED === "0") {
    return { ok: false, status: 503, error: "Tracker MCP is disabled" };
  }

  const origin = req.get("origin");
  if (origin && !isAllowedOrigin(origin)) {
    return { ok: false, status: 403, error: "Origin not allowed" };
  }

  const configuredApiKey = getConfiguredApiKey();
  const ownerUserId = getTrackerMcpOwnerUserId();
  if (!configuredApiKey || !ownerUserId) {
    return { ok: false, status: 503, error: "Tracker MCP is not configured" };
  }

  const bearerToken = getBearerToken(req);
  if (!bearerToken || !safeStringEquals(bearerToken, configuredApiKey)) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const pokeUserId = req.get("x-poke-user-id")?.trim() || null;
  const allowedPokeUserIds = splitCsv(
    process.env.TRACKER_MCP_ALLOWED_POKE_USER_IDS,
  );
  if (
    allowedPokeUserIds.length > 0 &&
    (!pokeUserId || !allowedPokeUserIds.includes(pokeUserId))
  ) {
    return { ok: false, status: 403, error: "Poke user not allowed" };
  }

  return {
    ok: true,
    ownerUserId,
    pokeUserId,
  };
};

export const sendTrackerMcpAuthFailure = (
  res: Response,
  authResult: Extract<TrackerMcpAuthResult, { ok: false }>,
) =>
  res.status(authResult.status).json({
    error: authResult.error,
  });
