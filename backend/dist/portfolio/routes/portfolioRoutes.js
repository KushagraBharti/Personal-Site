"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const portfolioController_1 = require("../controllers/portfolioController");
const router = (0, express_1.Router)();
router.get("/portfolio", portfolioController_1.getPortfolioContent);
router.get("/portfolio/llms.txt", portfolioController_1.getLlmsText);
exports.default = router;
