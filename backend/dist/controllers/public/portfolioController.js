"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLlmsText = exports.getPortfolioContent = void 0;
const portfolioContentService_1 = require("../../services/public/portfolioContentService");
const resolveSiteUrl = (request) => {
    const forwardedProtoHeader = request.headers["x-forwarded-proto"];
    const forwardedProto = Array.isArray(forwardedProtoHeader)
        ? forwardedProtoHeader[0]
        : forwardedProtoHeader;
    const protocol = forwardedProto || request.protocol || "https";
    const host = request.get("host");
    return host ? `${protocol}://${host}` : portfolioContentService_1.DEFAULT_PUBLIC_SITE_URL;
};
const getPortfolioContent = (_req, res) => {
    res.json((0, portfolioContentService_1.getPortfolioSnapshot)());
};
exports.getPortfolioContent = getPortfolioContent;
const getLlmsText = (req, res) => {
    const text = (0, portfolioContentService_1.buildLlmsText)((0, portfolioContentService_1.getPortfolioSnapshot)(), resolveSiteUrl(req));
    res.type("text/plain; charset=utf-8").send(text);
};
exports.getLlmsText = getLlmsText;
