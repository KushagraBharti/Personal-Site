"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cronAuth = void 0;
const crypto_1 = require("crypto");
const cronAuth = (req, res, next) => {
    const expected = process.env.CRON_SECRET;
    if (!expected) {
        return res.status(500).json({ error: "CRON_SECRET is not configured" });
    }
    const authHeader = req.header("authorization");
    const bearerToken = (authHeader === null || authHeader === void 0 ? void 0 : authHeader.toLowerCase().startsWith("bearer "))
        ? authHeader.slice(7).trim()
        : null;
    const provided = bearerToken ||
        req.header("x-cron-secret") ||
        req.header("cron-secret") ||
        req.header("CRON_SECRET");
    if (!provided) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    const providedBuffer = Buffer.from(provided);
    const expectedBuffer = Buffer.from(expected);
    if (providedBuffer.length !== expectedBuffer.length) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    if (!(0, crypto_1.timingSafeEqual)(providedBuffer, expectedBuffer)) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    return next();
};
exports.cronAuth = cronAuth;
