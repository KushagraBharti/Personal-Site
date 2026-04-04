"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLlmsText = exports.getPortfolioContent = void 0;
const portfolioExportService_1 = require("../services/portfolioExportService");
const llmsTextService_1 = require("../services/llmsTextService");
const portfolioSnapshotService_1 = require("../services/portfolioSnapshotService");
const resolveSiteUrl = (request) => {
    const forwardedProtoHeader = request.headers["x-forwarded-proto"];
    const forwardedProto = Array.isArray(forwardedProtoHeader)
        ? forwardedProtoHeader[0]
        : forwardedProtoHeader;
    const protocol = forwardedProto || request.protocol || "https";
    const host = request.get("host");
    return host ? `${protocol}://${host}` : llmsTextService_1.DEFAULT_PUBLIC_SITE_URL;
};
const getPortfolioContent = (_req, res) => {
    res.json((0, portfolioSnapshotService_1.getPortfolioSnapshot)());
};
exports.getPortfolioContent = getPortfolioContent;
const getLlmsText = (req, res) => {
    res.type("text/plain; charset=utf-8").send((0, portfolioExportService_1.getLlmsTextExport)(resolveSiteUrl(req)));
};
exports.getLlmsText = getLlmsText;
