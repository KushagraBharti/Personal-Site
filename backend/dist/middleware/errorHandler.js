"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, _req, res, next) => {
    var _a, _b;
    if (res.headersSent) {
        return next(err);
    }
    const status = (_b = (_a = err === null || err === void 0 ? void 0 : err.status) !== null && _a !== void 0 ? _a : err === null || err === void 0 ? void 0 : err.statusCode) !== null && _b !== void 0 ? _b : 500;
    const message = "Internal server error";
    // Always log server errors; the client response stays generic.
    console.error(err);
    res.status(status).json({ error: message });
};
exports.errorHandler = errorHandler;
