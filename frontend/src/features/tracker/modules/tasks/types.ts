import { TaskStatus, TaskTemplate } from "../../shared/types";

export type TemplateGroup = { category: string; tasks: TaskTemplate[]; order: number };

export type TaskStatusUpsert = Omit<TaskStatus, "id"> & { id?: string };
