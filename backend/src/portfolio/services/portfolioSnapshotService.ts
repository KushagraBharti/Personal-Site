import {
  portfolioAbout,
  portfolioAiProviders,
  portfolioEducation,
  portfolioExperiences,
  portfolioIntro,
  portfolioMedia,
  portfolioProfile,
  portfolioProjects,
} from "../content";
import type {
  PortfolioEducation,
  PortfolioExperience,
  PortfolioIntroResponse,
  PortfolioMediaItem,
  PortfolioProject,
  PortfolioSnapshot,
} from "../contracts";
import { sanitizeLatestUpdate } from "../utils/sanitizeLatestUpdate";

const sortByOrder = <T extends { order: number }>(items: T[]): T[] =>
  [...items].sort((left, right) => left.order - right.order);

export const getPortfolioSnapshot = (): PortfolioSnapshot => ({
  generatedAt: new Date().toISOString(),
  profile: portfolioProfile,
  about: portfolioAbout,
  intro: {
    ...portfolioIntro,
    latestUpdate: sanitizeLatestUpdate(portfolioIntro.latestUpdate),
  },
  education: sortByOrder<PortfolioEducation>(portfolioEducation),
  experiences: sortByOrder<PortfolioExperience>(portfolioExperiences),
  projects: sortByOrder<PortfolioProject>(portfolioProjects),
  media: sortByOrder<PortfolioMediaItem>(portfolioMedia),
  ai: {
    providers: sortByOrder(portfolioAiProviders),
  },
});

export const getIntroResponse = (): PortfolioIntroResponse => {
  const snapshot = getPortfolioSnapshot();
  return {
    profile: {
      name: snapshot.profile.name,
      headline: snapshot.profile.headline,
      primaryEmail: snapshot.profile.primaryEmail,
      socialLinks: snapshot.profile.socialLinks,
    },
    intro: snapshot.intro,
    ai: snapshot.ai,
  };
};
