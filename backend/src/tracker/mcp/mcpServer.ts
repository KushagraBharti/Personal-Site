import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
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
import {
  createTaskInputSchema,
  deleteTaskInputSchema,
  listCompletedTasksInputSchema,
  listReferenceInputSchema,
  taskIdInputSchema,
  trackerSnapshotInputSchema,
  updateTaskInputSchema,
} from "./trackerMcpSchemas";

const jsonToolResult = (structuredContent: Record<string, unknown>) => ({
  structuredContent,
  content: [
    {
      type: "text" as const,
      text: JSON.stringify(structuredContent, null, 2),
    },
  ],
});

const toolErrorResult = (error: unknown): CallToolResult => {
  const structuredContent =
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

  return {
    isError: true,
    ...jsonToolResult(structuredContent),
  };
};

const runTool = async (
  action: () => Promise<Record<string, unknown>>,
): Promise<CallToolResult> => {
  try {
    return jsonToolResult(await action());
  } catch (error) {
    return toolErrorResult(error);
  }
};

export const createTrackerMcpServer = (context: TrackerMcpContext) => {
  const server = new McpServer(
    {
      name: "kushagra-tracker",
      version: "1.0.0",
    },
    {
      instructions:
        "Private tracker MCP server. Tools only expose non-archived task lists where Google Calendar sync is enabled. Use task and list IDs returned by read tools for mutations.",
    },
  );

  server.registerTool(
    "get_tracker_snapshot",
    {
      title: "Get Tracker Snapshot",
      description:
        "Summarize calendar-synced tracker lists with active/completed/today/tomorrow/overdue counts. Does not list task bodies.",
      inputSchema: trackerSnapshotInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (input) => runTool(() => getTrackerSnapshot(context, input)),
  );

  server.registerTool(
    "list_tasks",
    {
      title: "List Active Tasks",
      description:
        "List active incomplete tasks from all calendar-synced tracker lists, or from one exact list ID/name.",
      inputSchema: listReferenceInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (input) => runTool(() => listTasks(context, input)),
  );

  server.registerTool(
    "list_completed_tasks",
    {
      title: "List Completed Tasks",
      description:
        "List the most recently completed tasks from calendar-synced tracker lists. Defaults to 10 per list.",
      inputSchema: listCompletedTasksInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (input) => runTool(() => listCompletedTasks(context, input)),
  );

  server.registerTool(
    "create_task",
    {
      title: "Create Task",
      description:
        "Create a task in a calendar-synced tracker list. Requires exact list_id or exact list_name.",
      inputSchema: createTaskInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async (input) => runTool(() => createMcpTask(context, input)),
  );

  server.registerTool(
    "update_task",
    {
      title: "Update Task",
      description:
        "Update fields on one MCP-visible tracker task. Moving a task is allowed only into another calendar-synced list.",
      inputSchema: updateTaskInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async (input) => runTool(() => updateMcpTask(context, input)),
  );

  server.registerTool(
    "complete_task",
    {
      title: "Complete Task",
      description:
        "Mark one MCP-visible tracker task complete. Recurring tasks may create the next occurrence.",
      inputSchema: taskIdInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ task_id }) => runTool(() => completeMcpTask(context, task_id)),
  );

  server.registerTool(
    "uncomplete_task",
    {
      title: "Uncomplete Task",
      description:
        "Mark one MCP-visible tracker task incomplete again. Does not remove any recurrence task already created earlier.",
      inputSchema: taskIdInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ task_id }) => runTool(() => uncompleteMcpTask(context, task_id)),
  );

  server.registerTool(
    "delete_task",
    {
      title: "Delete Task",
      description:
        "Delete one MCP-visible tracker task. Requires confirm_delete and may require confirm_delete_children for subtasks.",
      inputSchema: deleteTaskInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async (input) => runTool(() => deleteMcpTask(context, input)),
  );

  server.registerTool(
    "sync_calendar_now",
    {
      title: "Sync Calendar Now",
      description:
        "Queue and start a manual Google Calendar reconciliation for the configured tracker owner.",
      inputSchema: {},
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async () => runTool(() => syncCalendarNow(context)),
  );

  return server;
};
