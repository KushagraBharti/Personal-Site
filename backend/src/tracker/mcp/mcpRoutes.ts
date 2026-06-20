import { Router, Request, Response } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { getSupabaseAdmin } from "../calendar/services/calendarSyncQueueService";
import {
  authenticateTrackerMcpRequest,
  isTrackerMcpConfigured,
  sendTrackerMcpAuthFailure,
} from "./mcpAuth";
import { createTrackerMcpServer } from "./mcpServer";

const router = Router();

const methodNotAllowed = (res: Response) =>
  res.status(405).json({
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
    configured: isTrackerMcpConfigured(),
  });
});

const handleMcpPost = async (req: Request, res: Response) => {
  const authResult = authenticateTrackerMcpRequest(req);
  if (!authResult.ok) {
    return sendTrackerMcpAuthFailure(res, authResult);
  }

  const server = createTrackerMcpServer({
    supabaseAdmin: getSupabaseAdmin(),
    userId: authResult.ownerUserId,
  });
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  res.on("close", () => {
    transport.close().catch(() => {});
    server.close().catch(() => {});
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
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
};

const handleUnsupportedMcpMethod = (req: Request, res: Response) => {
  const authResult = authenticateTrackerMcpRequest(req);
  if (!authResult.ok) {
    return sendTrackerMcpAuthFailure(res, authResult);
  }
  return methodNotAllowed(res);
};

router.post("/", handleMcpPost);
router.get("/", handleUnsupportedMcpMethod);
router.delete("/", handleUnsupportedMcpMethod);

export default router;
