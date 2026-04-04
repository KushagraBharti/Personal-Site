"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const educationController_1 = require("../controllers/educationController");
const router = (0, express_1.Router)();
router.get("/education", educationController_1.getAllEducation);
router.get("/education/:slug", educationController_1.getEducationBySlug);
exports.default = router;
