"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIntroResponse = exports.getPortfolioSnapshot = void 0;
const content_1 = require("../content");
const sanitizeLatestUpdate_1 = require("../utils/sanitizeLatestUpdate");
const sortByOrder = (items) => [...items].sort((left, right) => left.order - right.order);
const getPortfolioSnapshot = () => ({
    generatedAt: new Date().toISOString(),
    profile: content_1.portfolioProfile,
    about: content_1.portfolioAbout,
    intro: Object.assign(Object.assign({}, content_1.portfolioIntro), { latestUpdate: (0, sanitizeLatestUpdate_1.sanitizeLatestUpdate)(content_1.portfolioIntro.latestUpdate) }),
    education: sortByOrder(content_1.portfolioEducation),
    experiences: sortByOrder(content_1.portfolioExperiences),
    projects: sortByOrder(content_1.portfolioProjects),
    media: sortByOrder(content_1.portfolioMedia),
    ai: {
        providers: sortByOrder(content_1.portfolioAiProviders),
    },
});
exports.getPortfolioSnapshot = getPortfolioSnapshot;
const getIntroResponse = () => {
    const snapshot = (0, exports.getPortfolioSnapshot)();
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
exports.getIntroResponse = getIntroResponse;
