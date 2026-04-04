"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const liveWidgetsController_1 = require("../controllers/liveWidgetsController");
const router = (0, express_1.Router)();
router.get("/", liveWidgetsController_1.getWeather);
exports.default = router;
