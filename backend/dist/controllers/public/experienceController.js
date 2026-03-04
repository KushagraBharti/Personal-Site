"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExperienceById = exports.getAllExperiences = void 0;
const experiences_1 = require("../../data/experiences");
const getAllExperiences = (req, res) => {
    res.json(experiences_1.experiencesData);
};
exports.getAllExperiences = getAllExperiences;
const getExperienceById = (req, res) => {
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const experienceId = parseInt(idParam !== null && idParam !== void 0 ? idParam : '', 10);
    if (!isNaN(experienceId) && experienceId >= 0 && experienceId < experiences_1.experiencesData.length) {
        res.json(experiences_1.experiencesData[experienceId]);
    }
    else {
        res.status(404).json({ message: "Experience not found" });
    }
};
exports.getExperienceById = getExperienceById;
