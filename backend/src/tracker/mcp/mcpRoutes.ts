import { Router, Request, Response } from "express";
import { getSupabaseAdmin } from "../calendar/services/calendarSyncQueueService";
import {
  authenticateTrackerMcpRequest,
  isTrackerMcpConfigured,
  sendTrackerMcpAuthFailure,
} from "./mcpAuth";
import {
  completeMcpTask,
  createMcpTask,
  deleteMcpTask,
  getTrackerSnapshot,
  listCompletedTasks,
  listTasks,
  syncCalendarNow,
  TrackerMcpContext,
  TrackerMcpServiceError,
  uncompleteMcpTask,
  updateMcpTask,
} from "./trackerMcpService";

const router = Router();
const PROTOCOL_VERSION = "2025-06-18";
const SERVER_INFO = {
  name: "kushagra-tracker",
  version: "1.0.0",
};

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: unknown;
}

const toolDefinitions = [
  {
    name: "get_tracker_snapshot",
    description:
      "Counts for MCP-visible tracker lists. No task bodies.",
    inputSchema: {
      type: "object",
      properties: {
        timezone: {
          type: "string",
          description: "IANA timezone for today/tomorrow counts.",
        },
      },
    },
  },
  {
    name: "list_tasks",
    description:
      "Active tasks from all visible lists or one exact list.",
    inputSchema: {
      type: "object",
      properties: {
        list_id: {
          type: "string",
          description: "Visible list ID.",
        },
        list_name: {
          type: "string",
          description: "Exact visible list name.",
        },
      },
    },
  },
  {
    name: "list_completed_tasks",
    description:
      "Recent completed tasks from visible lists.",
    inputSchema: {
      type: "object",
      properties: {
        list_id: {
          type: "string",
          description: "Visible list ID.",
        },
        list_name: {
          type: "string",
          description: "Exact visible list name.",
        },
        limit_per_list: {
          type: "integer",
          minimum: 1,
          maximum: 75,
          default: 10,
          description: "Completed tasks per list. Max 75.",
        },
      },
    },
  },
  {
    name: "create_task",
    description:
      "Create a task in a visible list.",
    inputSchema: {
      type: "object",
      properties: {
        list_id: {
          type: "string",
          description: "Visible list ID.",
        },
        list_name: {
          type: "string",
          description: "Exact visible list name.",
        },
        parent_task_id: {
          type: ["string", "null"],
          description: "Parent task ID.",
        },
        title: {
          type: "string",
          description: "Task title.",
        },
        details: {
          type: ["string", "null"],
          description: "Task details.",
        },
        due_at: {
          type: ["string", "null"],
          description: "ISO date/time, YYYY-MM-DD, or null.",
        },
        due_timezone: {
          type: ["string", "null"],
          description: "IANA timezone.",
        },
        recurrence_type: {
          type: "string",
          enum: ["none", "daily", "weekly", "biweekly", "custom"],
          default: "none",
          description: "Recurrence type.",
        },
        recurrence_interval: {
          type: ["integer", "null"],
          minimum: 1,
          description: "Custom recurrence interval.",
        },
        recurrence_unit: {
          type: ["string", "null"],
          enum: ["day", "week", "month", null],
          description: "Custom recurrence unit.",
        },
        recurrence_ends_at: {
          type: ["string", "null"],
          description: "ISO timestamp when recurrence ends.",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "update_task",
    description:
      "Update one visible task.",
    inputSchema: {
      type: "object",
      properties: {
        task_id: {
          type: "string",
          description: "Task ID.",
        },
        list_id: {
          type: "string",
          description: "Visible list ID.",
        },
        list_name: {
          type: "string",
          description: "Exact visible list name.",
        },
        parent_task_id: {
          type: ["string", "null"],
          description: "Parent task ID, or null.",
        },
        title: {
          type: "string",
          description: "New task title.",
        },
        details: {
          type: ["string", "null"],
          description: "New task details. Null clears details.",
        },
        due_at: {
          type: ["string", "null"],
          description: "ISO date/time, YYYY-MM-DD, or null.",
        },
        due_timezone: {
          type: ["string", "null"],
          description: "IANA timezone.",
        },
        recurrence_type: {
          type: "string",
          enum: ["none", "daily", "weekly", "biweekly", "custom"],
          description: "Recurrence type.",
        },
        recurrence_interval: {
          type: ["integer", "null"],
          minimum: 1,
          description: "Custom recurrence interval.",
        },
        recurrence_unit: {
          type: ["string", "null"],
          enum: ["day", "week", "month", null],
          description: "Custom recurrence unit.",
        },
        recurrence_ends_at: {
          type: ["string", "null"],
          description: "ISO timestamp when recurrence ends.",
        },
      },
      required: ["task_id"],
    },
  },
  {
    name: "complete_task",
    description: "Mark one visible task complete.",
    inputSchema: {
      type: "object",
      properties: {
        task_id: {
          type: "string",
          description: "Task ID.",
        },
      },
      required: ["task_id"],
    },
  },
  {
    name: "uncomplete_task",
    description: "Mark one visible task incomplete.",
    inputSchema: {
      type: "object",
      properties: {
        task_id: {
          type: "string",
          description: "Task ID.",
        },
      },
      required: ["task_id"],
    },
  },
  {
    name: "delete_task",
    description:
      "Delete one visible task. Confirm first.",
    inputSchema: {
      type: "object",
      properties: {
        task_id: {
          type: "string",
          description: "Task ID.",
        },
        expected_title: {
          type: "string",
          description: "Optional title safety check.",
        },
        confirm_delete: {
          type: "boolean",
          description: "Must be true.",
        },
        confirm_delete_children: {
          type: "boolean",
          description: "Required for subtasks.",
        },
      },
      required: ["task_id", "confirm_delete"],
    },
  },
  {
    name: "sync_calendar_now",
    description:
      "Run tracker Google Calendar sync.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
] as const;

const jsonRpcSuccess = (id: JsonRpcRequest["id"], result: unknown) => ({
  jsonrpc: "2.0",
  id: id ?? null,
  result,
});

const jsonRpcError = (
  id: JsonRpcRequest["id"],
  code: number,
  message: string,
  data?: unknown,
) => ({
  jsonrpc: "2.0",
  id: id ?? null,
  error: data ? { code, message, data } : { code, message },
});

const toolResult = (payload: Record<string, unknown>, isError = false) => ({
  content: [
    {
      type: "text",
      text: JSON.stringify(payload),
    },
  ],
  isError,
});

const toolErrorResult = (error: unknown) => {
  const payload =
    error instanceof TrackerMcpServiceError
      ? {
          ok: false,
          error: error.message,
          code: error.code,
          ...(error.details ? { details: error.details } : {}),
        }
      : {
          ok: false,
          error: error instanceof Error ? error.message : "Unknown MCP error",
          code: 500,
        };

  return toolResult(payload, true);
};

const paramsObject = (params: unknown): Record<string, unknown> =>
  params && typeof params === "object" && !Array.isArray(params)
    ? (params as Record<string, unknown>)
    : {};

const protocolVersionFrom = (params: unknown) => {
  const value = paramsObject(params).protocolVersion;
  return typeof value === "string" && value ? value : PROTOCOL_VERSION;
};

const runTool = async (
  action: () => Promise<Record<string, unknown>>,
) => {
  try {
    return toolResult(await action());
  } catch (error) {
    return toolErrorResult(error);
  }
};

const callTool = async (
  context: TrackerMcpContext,
  name: unknown,
  args: unknown,
) => {
  if (typeof name !== "string" || !name) {
    return toolErrorResult(new TrackerMcpServiceError("Missing tool name."));
  }

  const input = paramsObject(args);
  switch (name) {
    case "get_tracker_snapshot":
      return runTool(() => getTrackerSnapshot(context, input));
    case "list_tasks":
      return runTool(() => listTasks(context, input));
    case "list_completed_tasks":
      return runTool(() => listCompletedTasks(context, input));
    case "create_task":
      return runTool(() => createMcpTask(context, input as never));
    case "update_task":
      return runTool(() => updateMcpTask(context, input as never));
    case "complete_task":
      return runTool(() => completeMcpTask(context, String(input.task_id ?? "")));
    case "uncomplete_task":
      return runTool(() => uncompleteMcpTask(context, String(input.task_id ?? "")));
    case "delete_task":
      return runTool(() => deleteMcpTask(context, input as never));
    case "sync_calendar_now":
      return runTool(() => syncCalendarNow(context));
    default:
      return toolErrorResult(
        new TrackerMcpServiceError(`Unknown tool: ${name}`, 404),
      );
  }
};

const handleJsonRpc = async (
  message: JsonRpcRequest,
  context: TrackerMcpContext,
) => {
  const isNotification = message.id === undefined || message.id === null;
  switch (message.method) {
    case "initialize":
      return jsonRpcSuccess(message.id, {
        protocolVersion: protocolVersionFrom(message.params),
        capabilities: {
          tools: {
            listChanged: false,
          },
        },
        serverInfo: SERVER_INFO,
        instructions:
          "Private tracker MCP server. Only non-archived task lists with Google Calendar sync enabled are visible. Use get_tracker_snapshot first, list_tasks for active work, list_completed_tasks only for recent completed work, and confirm with the user before deleting tasks.",
      });
    case "notifications/initialized":
    case "notifications/cancelled":
      return null;
    case "ping":
      return jsonRpcSuccess(message.id, {});
    case "tools/list":
      return jsonRpcSuccess(message.id, { tools: toolDefinitions });
    case "tools/call": {
      const params = paramsObject(message.params);
      return jsonRpcSuccess(
        message.id,
        await callTool(context, params.name, params.arguments),
      );
    }
    default:
      return isNotification
        ? null
        : jsonRpcError(message.id, -32601, `Method not found: ${message.method}`);
  }
};

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

const handleMcpRequest = async (req: Request, res: Response) => {
  const authResult = authenticateTrackerMcpRequest(req);
  if (!authResult.ok) {
    return sendTrackerMcpAuthFailure(res, authResult);
  }

  const context = {
    supabaseAdmin: getSupabaseAdmin(),
    userId: authResult.ownerUserId,
  };

  try {
    const payload = req.body as JsonRpcRequest | JsonRpcRequest[];
    if (Array.isArray(payload)) {
      const responses = (
        await Promise.all(
          payload.map((message) => handleJsonRpc(message, context)),
        )
      ).filter((response) => response !== null);
      return responses.length > 0
        ? res.json(responses)
        : res.status(202).end();
    }

    const response = await handleJsonRpc(payload, context);
    return response ? res.json(response) : res.status(202).end();
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

const handleMcpStreamProbe = (req: Request, res: Response) => {
  const authResult = authenticateTrackerMcpRequest(req);
  if (!authResult.ok) {
    return sendTrackerMcpAuthFailure(res, authResult);
  }

  res.status(200);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.write(": tracker-mcp stream ready\n\n");
  return res.end();
};

const handleUnsupportedMcpMethod = (req: Request, res: Response) => {
  const authResult = authenticateTrackerMcpRequest(req);
  if (!authResult.ok) {
    return sendTrackerMcpAuthFailure(res, authResult);
  }
  return methodNotAllowed(res);
};

router.post("/", handleMcpRequest);
router.get("/", handleMcpStreamProbe);
router.delete("/", handleUnsupportedMcpMethod);

export default router;
