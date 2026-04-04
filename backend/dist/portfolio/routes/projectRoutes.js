"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const projectsController_1 = require("../controllers/projectsController");
const router = (0, express_1.Router)();
router.get("/projects", projectsController_1.getAllProjects);
router.get("/projects/:slug", projectsController_1.getProjectBySlug);
exports.default = router;
