"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExperienceBySlug = exports.getAllExperiences = void 0;
const portfolioSnapshotService_1 = require("../services/portfolioSnapshotService");
const getAllExperiences = (_req, res) => {
    res.json((0, portfolioSnapshotService_1.getPortfolioSnapshot)().experiences);
};
exports.getAllExperiences = getAllExperiences;
const getExperienceBySlug = (req, res) => {
    const slug = typeof req.params.slug === "string" ? req.params.slug : "";
    const experience = (0, portfolioSnapshotService_1.getPortfolioSnapshot)().experiences.find((entry) => entry.slug === slug);
    if (!experience) {
        res.status(404).json({ message: "Experience not found" });
        return;
    }
    res.json(experience);
};
exports.getExperienceBySlug = getExperienceBySlug;
