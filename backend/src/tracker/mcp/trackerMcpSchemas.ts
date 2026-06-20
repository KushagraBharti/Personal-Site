import { z } from "zod";
import { COMPLETED_TASK_MAX_LIMIT } from "./trackerMcpService";

const idSchema = (label: string) =>
  z.string().trim().min(1).describe(`${label} ID from a prior tool result.`);

export const trackerSnapshotInputSchema = {
  timezone: z
    .string()
    .trim()
    .min(1)
    .optional()
    .describe("IANA timezone for today/tomorrow counts. Defaults to tracker MCP timezone."),
};

export const listReferenceInputSchema = {
  list_id: idSchema("Task list")
    .optional()
    .describe("Exact task list ID. Provide either list_id or list_name, not both."),
  list_name: z
    .string()
    .trim()
    .min(1)
    .optional()
    .describe("Exact normalized task list name. Provide either list_id or list_name, not both."),
};

export const listCompletedTasksInputSchema = {
  ...listReferenceInputSchema,
  limit_per_list: z
    .number()
    .int()
    .min(1)
    .max(COMPLETED_TASK_MAX_LIMIT)
    .default(10)
    .describe(`Most recent completed tasks to return per list. Max ${COMPLETED_TASK_MAX_LIMIT}.`),
};

const recurrenceTypeSchema = z
  .enum(["none", "daily", "weekly", "biweekly", "custom"])
  .describe("Task recurrence type.");

const recurrenceUnitSchema = z
  .enum(["day", "week", "month"])
  .nullable()
  .describe("Custom recurrence unit. Only used when recurrence_type is custom.");

const dueAtSchema = z
  .string()
  .trim()
  .min(1)
  .nullable()
  .optional()
  .describe("Due date/time. Use YYYY-MM-DD for 10:00 PM in due_timezone, offsetless ISO for local time, absolute ISO for a fixed instant, or null for no due date.");

const dueTimezoneSchema = z
  .string()
  .trim()
  .min(1)
  .nullable()
  .optional()
  .describe("IANA timezone used for date-only and offsetless due_at values, such as America/Chicago.");

export const createTaskInputSchema = {
  ...listReferenceInputSchema,
  parent_task_id: idSchema("Parent task")
    .nullable()
    .optional()
    .describe("Optional parent task ID for creating a subtask."),
  title: z.string().trim().min(1).describe("Short clean task title. Put links, descriptions, and extra context in details."),
  details: z
    .string()
    .trim()
    .nullable()
    .optional()
    .describe("Optional task details. Null clears details."),
  due_at: dueAtSchema,
  due_timezone: dueTimezoneSchema,
  recurrence_type: recurrenceTypeSchema.default("none"),
  recurrence_interval: z
    .number()
    .int()
    .min(1)
    .nullable()
    .optional()
    .describe("Custom recurrence interval. Only used when recurrence_type is custom."),
  recurrence_unit: recurrenceUnitSchema.optional(),
  recurrence_ends_at: z
    .string()
    .trim()
    .min(1)
    .nullable()
    .optional()
    .describe("Optional ISO 8601 timestamp when recurrence ends."),
};

export const updateTaskInputSchema = {
  task_id: idSchema("Task"),
  ...listReferenceInputSchema,
  parent_task_id: idSchema("Parent task")
    .nullable()
    .optional()
    .describe("Set a parent task ID, or null to make this a root task."),
  title: z.string().trim().min(1).optional().describe("New task title."),
  details: z
    .string()
    .trim()
    .nullable()
    .optional()
    .describe("New task details. Null clears details."),
  due_at: dueAtSchema,
  due_timezone: dueTimezoneSchema,
  recurrence_type: recurrenceTypeSchema.optional(),
  recurrence_interval: z
    .number()
    .int()
    .min(1)
    .nullable()
    .optional()
    .describe("Custom recurrence interval. Only used when recurrence_type is custom."),
  recurrence_unit: recurrenceUnitSchema.optional(),
  recurrence_ends_at: z
    .string()
    .trim()
    .min(1)
    .nullable()
    .optional()
    .describe("Optional ISO 8601 timestamp when recurrence ends. Null clears it."),
};

export const taskIdInputSchema = {
  task_id: idSchema("Task"),
};

export const deleteTaskInputSchema = {
  task_id: idSchema("Task"),
  expected_title: z
    .string()
    .trim()
    .min(1)
    .optional()
    .describe("Optional safety check. Delete is refused if this does not match the current title."),
  confirm_delete: z
    .boolean()
    .describe("Must be true to delete the task."),
  confirm_delete_children: z
    .boolean()
    .optional()
    .describe("Must be true when deleting a task that has subtasks."),
};
