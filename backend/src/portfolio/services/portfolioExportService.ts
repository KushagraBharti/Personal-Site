import { buildLlmsText, DEFAULT_PUBLIC_SITE_URL } from "./llmsTextService";
import { buildHomepageFallbackHtml } from "./homepageHtmlService";
import { getPortfolioSnapshot } from "./portfolioSnapshotService";

export const getLlmsTextExport = (siteUrl = DEFAULT_PUBLIC_SITE_URL) =>
  buildLlmsText(getPortfolioSnapshot(), siteUrl);

export const getHomepageFallbackHtmlExport = (siteUrl = DEFAULT_PUBLIC_SITE_URL) =>
  buildHomepageFallbackHtml(getPortfolioSnapshot(), siteUrl);
