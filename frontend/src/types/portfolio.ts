export interface PortfolioSocialLink {
  label: string;
  href: string;
}

export interface PortfolioExternalLink {
  label: string;
  href: string;
}

export interface PortfolioAboutContent {
  introHeading: string;
  introBody: string;
  currentProjects: string[];
  currentLearning: string[];
  interestsOutsideTechnology: string[];
}

export interface PortfolioProfile {
  name: string;
  headline: string;
  personalSummary: string;
  primaryEmail: string;
  socialLinks: PortfolioSocialLink[];
  externalLinks: PortfolioExternalLink[];
  about: PortfolioAboutContent;
}

export interface PortfolioIntro {
  personalPhoto: string;
  latestUpdate: string;
  funFact: string;
  featuredBlog: {
    title: string;
    link: string;
  };
  aiProjects: string[];
  travelPlans: string;
}

export interface PortfolioEducation {
  dateRange: string;
  position: string;
  focus: string;
  description: string;
  schoolLink: string;
}

export interface PortfolioExperience {
  position: string;
  summary: string;
  description: string[];
  tags: string[];
  companyLink: string;
}

export interface PortfolioProject {
  title: string;
  summary: string;
  description: string[];
  tags: string[];
  githubLink: string;
  thumbnail?: string;
}

export interface PortfolioSnapshot {
  generatedAt: string;
  profile: PortfolioProfile;
  intro: PortfolioIntro;
  education: PortfolioEducation[];
  experiences: PortfolioExperience[];
  projects: PortfolioProject[];
}
