"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireUser = void 0;
const calendarSyncQueueService_1 = require("../tracker/calendar/services/calendarSyncQueueService");
const requireUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const authHeader = req.header("authorization");
    const token = (authHeader === null || authHeader === void 0 ? void 0 : authHeader.toLowerCase().startsWith("bearer "))
        ? authHeader.slice(7).trim()
        : null;
    if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    try {
        const supabaseAdmin = (0, calendarSyncQueueService_1.getSupabaseAdmin)();
        const { data, error } = yield supabaseAdmin.auth.getUser(token);
        if (error || !data.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const user = {
            id: data.user.id,
            email: (_a = data.user.email) !== null && _a !== void 0 ? _a : undefined,
        };
        req.user = user;
        return next();
    }
    catch (error) {
        console.error("requireUser failed", error);
        return res.status(500).json({ error: "Server misconfigured" });
    }
});
exports.requireUser = requireUser;
