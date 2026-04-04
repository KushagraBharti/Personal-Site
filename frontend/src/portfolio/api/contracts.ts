export interface PortfolioSocialLink {
  label: string;
  href: string;
}

export interface PortfolioExternalLink {
  label: string;
  href: string;
}

export interface PortfolioProfile {
  name: string;
  headline: string;
  personalSummary: string;
  primaryEmail: string;
  socialLinks: PortfolioSocialLink[];
  externalLinks: PortfolioExternalLink[];
}

export interface PortfolioAboutContent {
  introHeading: string;
  introBody: string;
  currentProjects: string[];
  currentLearning: string[];
  interestsOutsideTechnology: string[];
}

export interface PortfolioFeaturedRead {
  title: string;
  link: string;
}

export interface PortfolioIntroContent {
  personalPhoto: string;
  latestUpdate: string;
  funFact: string;
  featuredRead: PortfolioFeaturedRead;
  aiProjects: string[];
  travelPlans: string;
}

export interface PortfolioMediaItem {
  slug: string;
  order: number;
  title: string;
  subtitle: string;
  embedUrl: string;
  type: "video";
}

export interface PortfolioEducation {
  slug: string;
  order: number;
  dateRange: string;
  position: string;
  focus: string;
  description: string;
  schoolLink: string;
}

export interface PortfolioExperience {
  slug: string;
  order: number;
  position: string;
  summary: string;
  description: string[];
  tags: string[];
  companyLink: string;
}

export interface PortfolioProject {
  slug: string;
  order: number;
  title: string;
  summary: string;
  description: string[];
  tags: string[];
  githubLink?: string;
  thumbnail?: string;
}

export interface PortfolioAiProviderLinkAction {
  type: "link";
  hrefTemplate: string;
}

export interface PortfolioAiProviderClipboardAction {
  type: "clipboard";
  targetUrl: string;
}

export type PortfolioAiProviderAction =
  | PortfolioAiProviderLinkAction
  | PortfolioAiProviderClipboardAction;

export interface PortfolioAiProvider {
  slug: string;
  order: number;
  label: string;
  icon: "openai" | "claude" | "gemini";
  hoverColorClass: string;
  promptTemplate: string;
  action: PortfolioAiProviderAction;
}

export interface PortfolioSnapshot {
  generatedAt: string;
  profile: PortfolioProfile;
  about: PortfolioAboutContent;
  intro: PortfolioIntroContent;
  education: PortfolioEducation[];
  experiences: PortfolioExperience[];
  projects: PortfolioProject[];
  media: PortfolioMediaItem[];
  ai: {
    providers: PortfolioAiProvider[];
  };
}

export interface PortfolioIntroResponse {
  profile: Pick<PortfolioProfile, "name" | "headline" | "primaryEmail" | "socialLinks">;
  intro: PortfolioIntroContent;
  ai: PortfolioSnapshot["ai"];
}

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
