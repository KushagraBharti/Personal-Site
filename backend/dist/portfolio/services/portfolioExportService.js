"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLlmsTextExport = void 0;
const llmsTextService_1 = require("./llmsTextService");
const portfolioSnapshotService_1 = require("./portfolioSnapshotService");
const getLlmsTextExport = (siteUrl = llmsTextService_1.DEFAULT_PUBLIC_SITE_URL) => (0, llmsTextService_1.buildLlmsText)((0, portfolioSnapshotService_1.getPortfolioSnapshot)(), siteUrl);
exports.getLlmsTextExport = getLlmsTextExport;
