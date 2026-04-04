"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const introController_1 = require("../controllers/introController");
const router = (0, express_1.Router)();
router.get("/intro", introController_1.getIntroData);
exports.default = router;
