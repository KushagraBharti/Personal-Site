import type { RequestHandler } from "express";
import { getLlmsTextExport } from "../services/portfolioExportService";
import { DEFAULT_PUBLIC_SITE_URL } from "../services/llmsTextService";
import { getPortfolioSnapshot } from "../services/portfolioSnapshotService";

const resolveSiteUrl = (request: Parameters<RequestHandler>[0]) => {
  const forwardedProtoHeader = request.headers["x-forwarded-proto"];
  const forwardedProto = Array.isArray(forwardedProtoHeader)
    ? forwardedProtoHeader[0]
    : forwardedProtoHeader;
  const protocol = forwardedProto || request.protocol || "https";
  const host = request.get("host");

  return host ? `${protocol}://${host}` : DEFAULT_PUBLIC_SITE_URL;
};

export const getPortfolioContent: RequestHandler = (_req, res) => {
  res.json(getPortfolioSnapshot());
};

export const getLlmsText: RequestHandler = (req, res) => {
  res.type("text/plain; charset=utf-8").send(getLlmsTextExport(resolveSiteUrl(req)));
};
