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
      "Summarize calendar-synced tracker lists with active/completed/today/tomorrow/overdue counts. Does not list task bodies.",
    inputSchema: {
      type: "object",
      properties: {
        timezone: {
          type: "string",
          description:
            "IANA timezone for today/tomorrow counts. Defaults to tracker MCP timezone.",
        },
      },
    },
  },
  {
    name: "list_tasks",
    description:
      "List active incomplete tasks from all calendar-synced tracker lists, or from one exact list ID/name.",
    inputSchema: {
      type: "object",
      properties: {
        list_id: {
          type: "string",
          description: "Exact task list ID. Provide either list_id or list_name, not both.",
        },
        list_name: {
          type: "string",
          description:
            "Exact normalized task list name. Provide either list_id or list_name, not both.",
        },
      },
    },
  },
  {
    name: "list_completed_tasks",
    description:
      "List the most recently completed tasks from calendar-synced tracker lists. Defaults to 10 per list.",
    inputSchema: {
      type: "object",
      properties: {
        list_id: {
          type: "string",
          description: "Exact task list ID. Provide either list_id or list_name, not both.",
        },
        list_name: {
          type: "string",
          description:
            "Exact normalized task list name. Provide either list_id or list_name, not both.",
        },
        limit_per_list: {
          type: "integer",
          minimum: 1,
          maximum: 75,
          default: 10,
          description: "Most recent completed tasks to return per list. Max 75.",
        },
      },
    },
  },
  {
    name: "create_task",
    description:
      "Create a task in a calendar-synced tracker list. Requires exact list_id or exact list_name.",
    inputSchema: {
      type: "object",
      properties: {
        list_id: {
          type: "string",
          description: "Exact task list ID. Provide either list_id or list_name, not both.",
        },
        list_name: {
          type: "string",
          description:
            "Exact normalized task list name. Provide either list_id or list_name, not both.",
        },
        parent_task_id: {
          type: ["string", "null"],
          description: "Optional parent task ID for creating a subtask.",
        },
        title: {
          type: "string",
          description: "Task title.",
        },
        details: {
          type: ["string", "null"],
          description: "Optional task details. Null clears details.",
        },
        due_at: {
          type: ["string", "null"],
          description:
            "Due date/time as ISO 8601, YYYY-MM-DD for date-only, or null for no due date.",
        },
        due_timezone: {
          type: ["string", "null"],
          description: "IANA timezone for the due date/time, such as America/Chicago.",
        },
        recurrence_type: {
          type: "string",
          enum: ["none", "daily", "weekly", "biweekly", "custom"],
          default: "none",
          description: "Task recurrence type.",
        },
        recurrence_interval: {
          type: ["integer", "null"],
          minimum: 1,
          description:
            "Custom recurrence interval. Only used when recurrence_type is custom.",
        },
        recurrence_unit: {
          type: ["string", "null"],
          enum: ["day", "week", "month", null],
          description: "Custom recurrence unit. Only used when recurrence_type is custom.",
        },
        recurrence_ends_at: {
          type: ["string", "null"],
          description: "Optional ISO 8601 timestamp when recurrence ends.",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "update_task",
    description:
      "Update fields on one MCP-visible tracker task. Moving a task is allowed only into another calendar-synced list.",
    inputSchema: {
      type: "object",
      properties: {
        task_id: {
          type: "string",
          description: "Task ID from a prior tool result.",
        },
        list_id: {
          type: "string",
          description: "Exact task list ID. Provide either list_id or list_name, not both.",
        },
        list_name: {
          type: "string",
          description:
            "Exact normalized task list name. Provide either list_id or list_name, not both.",
        },
        parent_task_id: {
          type: ["string", "null"],
          description: "Set a parent task ID, or null to make this a root task.",
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
          description:
            "Due date/time as ISO 8601, YYYY-MM-DD for date-only, or null for no due date.",
        },
        due_timezone: {
          type: ["string", "null"],
          description: "IANA timezone for the due date/time, such as America/Chicago.",
        },
        recurrence_type: {
          type: "string",
          enum: ["none", "daily", "weekly", "biweekly", "custom"],
          description: "Task recurrence type.",
        },
        recurrence_interval: {
          type: ["integer", "null"],
          minimum: 1,
          description:
            "Custom recurrence interval. Only used when recurrence_type is custom.",
        },
        recurrence_unit: {
          type: ["string", "null"],
          enum: ["day", "week", "month", null],
          description: "Custom recurrence unit. Only used when recurrence_type is custom.",
        },
        recurrence_ends_at: {
          type: ["string", "null"],
          description: "Optional ISO 8601 timestamp when recurrence ends. Null clears it.",
        },
      },
      required: ["task_id"],
    },
  },
  {
    name: "complete_task",
    description:
      "Mark one MCP-visible tracker task complete. Recurring tasks may create the next occurrence.",
    inputSchema: {
      type: "object",
      properties: {
        task_id: {
          type: "string",
          description: "Task ID from a prior tool result.",
        },
      },
      required: ["task_id"],
    },
  },
  {
    name: "uncomplete_task",
    description:
      "Mark one MCP-visible tracker task incomplete again. Does not remove any recurrence task already created earlier.",
    inputSchema: {
      type: "object",
      properties: {
        task_id: {
          type: "string",
          description: "Task ID from a prior tool result.",
        },
      },
      required: ["task_id"],
    },
  },
  {
    name: "delete_task",
    description:
      "Delete one MCP-visible tracker task. Requires confirm_delete and may require confirm_delete_children for subtasks.",
    inputSchema: {
      type: "object",
      properties: {
        task_id: {
          type: "string",
          description: "Task ID from a prior tool result.",
        },
        expected_title: {
          type: "string",
          description:
            "Optional safety check. Delete is refused if this does not match the current title.",
        },
        confirm_delete: {
          type: "boolean",
          description: "Must be true to delete the task.",
        },
        confirm_delete_children: {
          type: "boolean",
          description: "Must be true when deleting a task that has subtasks.",
        },
      },
      required: ["task_id", "confirm_delete"],
    },
  },
  {
    name: "sync_calendar_now",
    description:
      "Queue and start a manual Google Calendar reconciliation for the configured tracker owner.",
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
          "Private tracker MCP server. Only non-archived task lists with Google Calendar sync enabled are visible. Use get_tracker_snapshot first, list_tasks for active work, list_completed_tasks only for recent completed work, and confirm with the user before deleting tasks. For create_task, keep titles short; put links/context in details; if the user gives a date without a time, set due_at to 10:00 PM in the tracker timezone.",
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
