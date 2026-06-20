"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTaskInputSchema = exports.taskIdInputSchema = exports.updateTaskInputSchema = exports.createTaskInputSchema = exports.listCompletedTasksInputSchema = exports.listReferenceInputSchema = exports.trackerSnapshotInputSchema = void 0;
const zod_1 = require("zod");
const trackerMcpService_1 = require("./trackerMcpService");
const idSchema = (label) => zod_1.z.string().trim().min(1).describe(`${label} ID from a prior tool result.`);
exports.trackerSnapshotInputSchema = {
    timezone: zod_1.z
        .string()
        .trim()
        .min(1)
        .optional()
        .describe("IANA timezone for today/tomorrow counts. Defaults to tracker MCP timezone."),
};
exports.listReferenceInputSchema = {
    list_id: idSchema("Task list")
        .optional()
        .describe("Exact task list ID. Provide either list_id or list_name, not both."),
    list_name: zod_1.z
        .string()
        .trim()
        .min(1)
        .optional()
        .describe("Exact normalized task list name. Provide either list_id or list_name, not both."),
};
exports.listCompletedTasksInputSchema = Object.assign(Object.assign({}, exports.listReferenceInputSchema), { limit_per_list: zod_1.z
        .number()
        .int()
        .min(1)
        .max(trackerMcpService_1.COMPLETED_TASK_MAX_LIMIT)
        .default(10)
        .describe(`Most recent completed tasks to return per list. Max ${trackerMcpService_1.COMPLETED_TASK_MAX_LIMIT}.`) });
const recurrenceTypeSchema = zod_1.z
    .enum(["none", "daily", "weekly", "biweekly", "custom"])
    .describe("Task recurrence type.");
const recurrenceUnitSchema = zod_1.z
    .enum(["day", "week", "month"])
    .nullable()
    .describe("Custom recurrence unit. Only used when recurrence_type is custom.");
const dueAtSchema = zod_1.z
    .string()
    .trim()
    .min(1)
    .nullable()
    .optional()
    .describe("Due date/time. Use YYYY-MM-DD for 10:00 PM in due_timezone, offsetless ISO for local time, absolute ISO for a fixed instant, or null for no due date.");
const dueTimezoneSchema = zod_1.z
    .string()
    .trim()
    .min(1)
    .nullable()
    .optional()
    .describe("IANA timezone used for date-only and offsetless due_at values, such as America/Chicago.");
exports.createTaskInputSchema = Object.assign(Object.assign({}, exports.listReferenceInputSchema), { parent_task_id: idSchema("Parent task")
        .nullable()
        .optional()
        .describe("Optional parent task ID for creating a subtask."), title: zod_1.z.string().trim().min(1).describe("Short clean task title. Put links, descriptions, and extra context in details."), details: zod_1.z
        .string()
        .trim()
        .nullable()
        .optional()
        .describe("Optional task details. Null clears details."), due_at: dueAtSchema, due_timezone: dueTimezoneSchema, recurrence_type: recurrenceTypeSchema.default("none"), recurrence_interval: zod_1.z
        .number()
        .int()
        .min(1)
        .nullable()
        .optional()
        .describe("Custom recurrence interval. Only used when recurrence_type is custom."), recurrence_unit: recurrenceUnitSchema.optional(), recurrence_ends_at: zod_1.z
        .string()
        .trim()
        .min(1)
        .nullable()
        .optional()
        .describe("Optional ISO 8601 timestamp when recurrence ends.") });
exports.updateTaskInputSchema = Object.assign(Object.assign({ task_id: idSchema("Task") }, exports.listReferenceInputSchema), { parent_task_id: idSchema("Parent task")
        .nullable()
        .optional()
        .describe("Set a parent task ID, or null to make this a root task."), title: zod_1.z.string().trim().min(1).optional().describe("New task title."), details: zod_1.z
        .string()
        .trim()
        .nullable()
        .optional()
        .describe("New task details. Null clears details."), due_at: dueAtSchema, due_timezone: dueTimezoneSchema, recurrence_type: recurrenceTypeSchema.optional(), recurrence_interval: zod_1.z
        .number()
        .int()
        .min(1)
        .nullable()
        .optional()
        .describe("Custom recurrence interval. Only used when recurrence_type is custom."), recurrence_unit: recurrenceUnitSchema.optional(), recurrence_ends_at: zod_1.z
        .string()
        .trim()
        .min(1)
        .nullable()
        .optional()
        .describe("Optional ISO 8601 timestamp when recurrence ends. Null clears it.") });
exports.taskIdInputSchema = {
    task_id: idSchema("Task"),
};
exports.deleteTaskInputSchema = {
    task_id: idSchema("Task"),
    expected_title: zod_1.z
        .string()
        .trim()
        .min(1)
        .optional()
        .describe("Optional safety check. Delete is refused if this does not match the current title."),
    confirm_delete: zod_1.z
        .boolean()
        .describe("Must be true to delete the task."),
    confirm_delete_children: zod_1.z
        .boolean()
        .optional()
        .describe("Must be true when deleting a task that has subtasks."),
};
