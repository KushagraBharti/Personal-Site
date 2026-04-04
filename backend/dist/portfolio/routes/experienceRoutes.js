"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const experiencesController_1 = require("../controllers/experiencesController");
const router = (0, express_1.Router)();
router.get("/experiences", experiencesController_1.getAllExperiences);
router.get("/experiences/:slug", experiencesController_1.getExperienceBySlug);
exports.default = router;
