"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeLatestUpdate = void 0;
const sanitizeLatestUpdate = (latestUpdate) => latestUpdate
    .replace(/\band leetcoding\b!?/gi, "")
    .replace(/\bleetcoding\b!?/gi, "")
    .replace(/\s+/g, " ")
    .trim();
exports.sanitizeLatestUpdate = sanitizeLatestUpdate;
