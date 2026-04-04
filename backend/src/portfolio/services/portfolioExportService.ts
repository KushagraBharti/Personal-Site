import { buildLlmsText, DEFAULT_PUBLIC_SITE_URL } from "./llmsTextService";
import { getPortfolioSnapshot } from "./portfolioSnapshotService";

export const getLlmsTextExport = (siteUrl = DEFAULT_PUBLIC_SITE_URL) =>
  buildLlmsText(getPortfolioSnapshot(), siteUrl);
