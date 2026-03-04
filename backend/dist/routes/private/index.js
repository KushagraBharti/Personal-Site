"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const financeRoutes_1 = __importDefault(require("./financeRoutes"));
const cronRoutes_1 = __importDefault(require("./cronRoutes"));
const calendarRoutes_1 = __importDefault(require("./calendarRoutes"));
const router = (0, express_1.Router)();
router.use("/finance", financeRoutes_1.default);
router.use("/calendar", calendarRoutes_1.default);
router.use("/cron", cronRoutes_1.default);
exports.default = router;
