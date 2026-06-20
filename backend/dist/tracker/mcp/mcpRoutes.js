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
const express_1 = require("express");
const streamableHttp_js_1 = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const calendarSyncQueueService_1 = require("../calendar/services/calendarSyncQueueService");
const mcpAuth_1 = require("./mcpAuth");
const mcpServer_1 = require("./mcpServer");
const router = (0, express_1.Router)();
const methodNotAllowed = (res) => res.status(405).json({
    jsonrpc: "2.0",
    error: {
        code: -32000,
        message: "Method not allowed.",
    },
    id: null,
});
router.get("/health", (_req, res) => {
    res.json({
        ok: true,
        service: "tracker-mcp",
        configured: (0, mcpAuth_1.isTrackerMcpConfigured)(),
    });
});
const handleMcpRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const authResult = (0, mcpAuth_1.authenticateTrackerMcpRequest)(req);
    if (!authResult.ok) {
        return (0, mcpAuth_1.sendTrackerMcpAuthFailure)(res, authResult);
    }
    const server = (0, mcpServer_1.createTrackerMcpServer)({
        supabaseAdmin: (0, calendarSyncQueueService_1.getSupabaseAdmin)(),
        userId: authResult.ownerUserId,
    });
    const transport = new streamableHttp_js_1.StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
    });
    res.on("close", () => {
        transport.close().catch(() => { });
        server.close().catch(() => { });
    });
    try {
        yield server.connect(transport);
        yield transport.handleRequest(req, res, req.method === "POST" ? req.body : undefined);
    }
    catch (error) {
        console.error("Failed to handle tracker MCP request", error);
        if (!res.headersSent) {
            res.status(500).json({
                jsonrpc: "2.0",
                error: {
                    code: -32603,
                    message: "Internal server error",
                },
                id: null,
            });
        }
    }
});
const handleUnsupportedMcpMethod = (req, res) => {
    const authResult = (0, mcpAuth_1.authenticateTrackerMcpRequest)(req);
    if (!authResult.ok) {
        return (0, mcpAuth_1.sendTrackerMcpAuthFailure)(res, authResult);
    }
    return methodNotAllowed(res);
};
router.post("/", handleMcpRequest);
router.get("/", handleMcpRequest);
router.delete("/", handleUnsupportedMcpMethod);
exports.default = router;
