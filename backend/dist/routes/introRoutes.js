"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/introRoutes.ts
const express_1 = __importDefault(require("express"));
const introController_1 = require("../controllers/introController");
const router = express_1.default.Router();
// GET /api/intro
router.get("/intro", introController_1.getIntroData);
exports.default = router;
