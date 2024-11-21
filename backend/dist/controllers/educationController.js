"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEducationById = exports.getAllEducation = void 0;
const education_1 = require("../data/education");
const getAllEducation = (req, res) => {
    res.json(education_1.educationData);
};
exports.getAllEducation = getAllEducation;
const getEducationById = (req, res) => {
    const experienceId = parseInt(req.params.id, 10);
    if (!isNaN(experienceId) && experienceId >= 0 && experienceId < education_1.educationData.length) {
        res.json(education_1.educationData[experienceId]);
    }
    else {
        res.status(404).json({ message: "Education not found" });
    }
};
exports.getEducationById = getEducationById;
