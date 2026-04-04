"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectBySlug = exports.getAllProjects = void 0;
const portfolioSnapshotService_1 = require("../services/portfolioSnapshotService");
const getAllProjects = (_req, res) => {
    res.json((0, portfolioSnapshotService_1.getPortfolioSnapshot)().projects);
};
exports.getAllProjects = getAllProjects;
const getProjectBySlug = (req, res) => {
    const slug = typeof req.params.slug === "string" ? req.params.slug : "";
    const project = (0, portfolioSnapshotService_1.getPortfolioSnapshot)().projects.find((entry) => entry.slug === slug);
    if (!project) {
        res.status(404).json({ message: "Project not found" });
        return;
    }
    res.json(project);
};
exports.getProjectBySlug = getProjectBySlug;
