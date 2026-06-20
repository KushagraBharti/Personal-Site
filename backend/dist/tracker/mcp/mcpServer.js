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
exports.createTrackerMcpServer = void 0;
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const trackerMcpService_1 = require("./trackerMcpService");
const trackerMcpSchemas_1 = require("./trackerMcpSchemas");
const jsonToolResult = (structuredContent) => ({
    structuredContent,
    content: [
        {
            type: "text",
            text: JSON.stringify(structuredContent, null, 2),
        },
    ],
});
const toolErrorResult = (error) => {
    const structuredContent = error instanceof trackerMcpService_1.TrackerMcpServiceError
        ? Object.assign({ ok: false, error: error.message, code: error.code }, (error.details ? { details: error.details } : {})) : {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown MCP error",
        code: 500,
    };
    return Object.assign({ isError: true }, jsonToolResult(structuredContent));
};
const runTool = (action) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return jsonToolResult(yield action());
    }
    catch (error) {
        return toolErrorResult(error);
    }
});
const createTrackerMcpServer = (context) => {
    const server = new mcp_js_1.McpServer({
        name: "kushagra-tracker",
        version: "1.0.0",
    }, {
        instructions: "Private tracker MCP server. Tools only expose non-archived task lists where Google Calendar sync is enabled. Use task and list IDs returned by read tools for mutations.",
    });
    server.registerTool("get_tracker_snapshot", {
        title: "Get Tracker Snapshot",
        description: "Summarize calendar-synced tracker lists with active/completed/today/tomorrow/overdue counts. Does not list task bodies.",
        inputSchema: trackerMcpSchemas_1.trackerSnapshotInputSchema,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    }, (input) => __awaiter(void 0, void 0, void 0, function* () { return runTool(() => (0, trackerMcpService_1.getTrackerSnapshot)(context, input)); }));
    server.registerTool("list_tasks", {
        title: "List Active Tasks",
        description: "List active incomplete tasks from all calendar-synced tracker lists, or from one exact list ID/name.",
        inputSchema: trackerMcpSchemas_1.listReferenceInputSchema,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    }, (input) => __awaiter(void 0, void 0, void 0, function* () { return runTool(() => (0, trackerMcpService_1.listTasks)(context, input)); }));
    server.registerTool("list_completed_tasks", {
        title: "List Completed Tasks",
        description: "List the most recently completed tasks from calendar-synced tracker lists. Defaults to 10 per list.",
        inputSchema: trackerMcpSchemas_1.listCompletedTasksInputSchema,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    }, (input) => __awaiter(void 0, void 0, void 0, function* () { return runTool(() => (0, trackerMcpService_1.listCompletedTasks)(context, input)); }));
    server.registerTool("create_task", {
        title: "Create Task",
        description: "Create a task in a calendar-synced tracker list. Requires exact list_id or exact list_name.",
        inputSchema: trackerMcpSchemas_1.createTaskInputSchema,
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: false,
        },
    }, (input) => __awaiter(void 0, void 0, void 0, function* () { return runTool(() => (0, trackerMcpService_1.createMcpTask)(context, input)); }));
    server.registerTool("update_task", {
        title: "Update Task",
        description: "Update fields on one MCP-visible tracker task. Moving a task is allowed only into another calendar-synced list.",
        inputSchema: trackerMcpSchemas_1.updateTaskInputSchema,
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: false,
        },
    }, (input) => __awaiter(void 0, void 0, void 0, function* () { return runTool(() => (0, trackerMcpService_1.updateMcpTask)(context, input)); }));
    server.registerTool("complete_task", {
        title: "Complete Task",
        description: "Mark one MCP-visible tracker task complete. Recurring tasks may create the next occurrence.",
        inputSchema: trackerMcpSchemas_1.taskIdInputSchema,
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    }, (_a) => __awaiter(void 0, [_a], void 0, function* ({ task_id }) { return runTool(() => (0, trackerMcpService_1.completeMcpTask)(context, task_id)); }));
    server.registerTool("uncomplete_task", {
        title: "Uncomplete Task",
        description: "Mark one MCP-visible tracker task incomplete again. Does not remove any recurrence task already created earlier.",
        inputSchema: trackerMcpSchemas_1.taskIdInputSchema,
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    }, (_a) => __awaiter(void 0, [_a], void 0, function* ({ task_id }) { return runTool(() => (0, trackerMcpService_1.uncompleteMcpTask)(context, task_id)); }));
    server.registerTool("delete_task", {
        title: "Delete Task",
        description: "Delete one MCP-visible tracker task. Requires confirm_delete and may require confirm_delete_children for subtasks.",
        inputSchema: trackerMcpSchemas_1.deleteTaskInputSchema,
        annotations: {
            readOnlyHint: false,
            destructiveHint: true,
            idempotentHint: false,
            openWorldHint: false,
        },
    }, (input) => __awaiter(void 0, void 0, void 0, function* () { return runTool(() => (0, trackerMcpService_1.deleteMcpTask)(context, input)); }));
    server.registerTool("sync_calendar_now", {
        title: "Sync Calendar Now",
        description: "Queue and start a manual Google Calendar reconciliation for the configured tracker owner.",
        inputSchema: {},
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: true,
        },
    }, () => __awaiter(void 0, void 0, void 0, function* () { return runTool(() => (0, trackerMcpService_1.syncCalendarNow)(context)); }));
    return server;
};
exports.createTrackerMcpServer = createTrackerMcpServer;
