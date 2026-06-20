"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTrackerMcpAuthFailure = exports.authenticateTrackerMcpRequest = exports.isTrackerMcpConfigured = exports.getTrackerMcpOwnerUserId = void 0;
const node_crypto_1 = require("node:crypto");
const DEFAULT_ALLOWED_ORIGINS = [
    "https://poke.com",
    "https://www.poke.com",
];
const localOriginRegex = /^http:\/\/(?:localhost|127\.0\.0\.1):\d+$/i;
const splitCsv = (value) => (value !== null && value !== void 0 ? value : "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
const getConfiguredApiKey = () => process.env.TRACKER_MCP_API_KEY || process.env.POKE_TRACKER_MCP_API_KEY || "";
const getTrackerMcpOwnerUserId = () => process.env.TRACKER_MCP_OWNER_USER_ID ||
    process.env.POKE_TRACKER_OWNER_USER_ID ||
    "";
exports.getTrackerMcpOwnerUserId = getTrackerMcpOwnerUserId;
const isTrackerMcpConfigured = () => process.env.TRACKER_MCP_ENABLED !== "0" &&
    !!getConfiguredApiKey() &&
    !!(0, exports.getTrackerMcpOwnerUserId)();
exports.isTrackerMcpConfigured = isTrackerMcpConfigured;
const getBearerToken = (req) => {
    var _a, _b, _c;
    const header = (_a = req.get("authorization")) !== null && _a !== void 0 ? _a : "";
    const match = /^Bearer\s+(.+)$/i.exec(header);
    return (_c = (_b = match === null || match === void 0 ? void 0 : match[1]) === null || _b === void 0 ? void 0 : _b.trim()) !== null && _c !== void 0 ? _c : "";
};
const safeStringEquals = (left, right) => {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);
    if (leftBuffer.length !== rightBuffer.length)
        return false;
    return (0, node_crypto_1.timingSafeEqual)(leftBuffer, rightBuffer);
};
const isAllowedOrigin = (origin) => {
    const configured = splitCsv(process.env.TRACKER_MCP_ALLOWED_ORIGINS);
    const allowed = new Set([...DEFAULT_ALLOWED_ORIGINS, ...configured]);
    if (allowed.has(origin))
        return true;
    return process.env.NODE_ENV !== "production" && localOriginRegex.test(origin);
};
const authenticateTrackerMcpRequest = (req) => {
    var _a;
    if (process.env.TRACKER_MCP_ENABLED === "0") {
        return { ok: false, status: 503, error: "Tracker MCP is disabled" };
    }
    const origin = req.get("origin");
    if (origin && !isAllowedOrigin(origin)) {
        return { ok: false, status: 403, error: "Origin not allowed" };
    }
    const configuredApiKey = getConfiguredApiKey();
    const ownerUserId = (0, exports.getTrackerMcpOwnerUserId)();
    if (!configuredApiKey || !ownerUserId) {
        return { ok: false, status: 503, error: "Tracker MCP is not configured" };
    }
    const bearerToken = getBearerToken(req);
    if (!bearerToken || !safeStringEquals(bearerToken, configuredApiKey)) {
        return { ok: false, status: 401, error: "Unauthorized" };
    }
    const pokeUserId = ((_a = req.get("x-poke-user-id")) === null || _a === void 0 ? void 0 : _a.trim()) || null;
    const allowedPokeUserIds = splitCsv(process.env.TRACKER_MCP_ALLOWED_POKE_USER_IDS);
    if (allowedPokeUserIds.length > 0 &&
        (!pokeUserId || !allowedPokeUserIds.includes(pokeUserId))) {
        return { ok: false, status: 403, error: "Poke user not allowed" };
    }
    return {
        ok: true,
        ownerUserId,
        pokeUserId,
    };
};
exports.authenticateTrackerMcpRequest = authenticateTrackerMcpRequest;
const sendTrackerMcpAuthFailure = (res, authResult) => res.status(authResult.status).json({
    error: authResult.error,
});
exports.sendTrackerMcpAuthFailure = sendTrackerMcpAuthFailure;
