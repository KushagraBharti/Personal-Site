"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEducationBySlug = exports.getAllEducation = void 0;
const portfolioSnapshotService_1 = require("../services/portfolioSnapshotService");
const getAllEducation = (_req, res) => {
    res.json((0, portfolioSnapshotService_1.getPortfolioSnapshot)().education);
};
exports.getAllEducation = getAllEducation;
const getEducationBySlug = (req, res) => {
    const slug = typeof req.params.slug === "string" ? req.params.slug : "";
    const education = (0, portfolioSnapshotService_1.getPortfolioSnapshot)().education.find((entry) => entry.slug === slug);
    if (!education) {
        res.status(404).json({ message: "Education not found" });
        return;
    }
    res.json(education);
};
exports.getEducationBySlug = getEducationBySlug;
