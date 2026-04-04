export type {
  PortfolioAboutContent,
  PortfolioAiProvider,
  PortfolioExternalLink,
  PortfolioEducation,
  PortfolioExperience,
  PortfolioIntroContent,
  PortfolioIntroResponse,
  PortfolioMediaItem,
  PortfolioProfile,
  PortfolioProject,
  PortfolioSnapshot,
  PortfolioSocialLink,
} from "../../../../backend/src/portfolio/contracts";

export interface GitHubStats {
  totalRepos: number;
  totalCommits: number;
}

export interface LeetCodeStats {
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
}

export interface WeatherData {
  name: string;
  main: { temp: number };
  weather: { description: string }[];
}
