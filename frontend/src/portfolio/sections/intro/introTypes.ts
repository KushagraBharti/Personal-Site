import type { GitHubStats, PortfolioAiProvider, PortfolioIntroResponse } from "../../api/contracts";

export interface IntroSectionData extends PortfolioIntroResponse {
  githubStats: GitHubStats | null;
}

export type IntroDisplayData = IntroSectionData["intro"];
export type IntroProfileData = IntroSectionData["profile"];
export type IntroAiProvider = PortfolioAiProvider;
