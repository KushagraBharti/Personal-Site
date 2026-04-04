"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIntroData = void 0;
const portfolioSnapshotService_1 = require("../services/portfolioSnapshotService");
const getIntroData = (_req, res) => {
    res.json((0, portfolioSnapshotService_1.getIntroResponse)());
};
exports.getIntroData = getIntroData;
