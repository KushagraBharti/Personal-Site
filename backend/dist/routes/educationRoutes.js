"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const educationController_1 = require("../controllers/educationController");
const router = express_1.default.Router();
router.get('/education', educationController_1.getAllEducation);
router.get('/education/:id', educationController_1.getEducationById);
exports.default = router;
