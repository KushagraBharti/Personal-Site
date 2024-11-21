"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectById = exports.getAllProjects = void 0;
const projects_1 = require("../data/projects");
// Fetch all projects
const getAllProjects = (req, res) => {
    res.json(projects_1.projectsData);
};
exports.getAllProjects = getAllProjects;
// Fetch a single project by ID
const getProjectById = (req, res) => {
    const projectId = parseInt(req.params.id, 10);
    if (!isNaN(projectId) && projectId >= 0 && projectId < projects_1.projectsData.length) {
        res.json(projects_1.projectsData[projectId]);
    }
    else {
        res.status(404).json({ message: "Project not found" });
    }
};
exports.getProjectById = getProjectById;
