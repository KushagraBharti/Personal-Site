import { TrackerModule } from "../shared/types";
import TasksHubTracker from "../modules/tasks-hub/components/TasksHubTracker";
import WeeklyTasksTracker from "../modules/tasks/components/TasksTracker";
import PipelineTracker from "../modules/pipeline/components/PipelineTracker";

export const trackerModules: TrackerModule[] = [
  {
    id: "tasks",
    label: "Tasks",
    Component: TasksHubTracker,
  },
  {
    id: "weekly",
    label: "Weekly Tasks",
    Component: WeeklyTasksTracker,
  },
  {
    id: "pipeline",
    label: "Active Deals",
    Component: PipelineTracker,
  },
];

export const defaultModuleId = "tasks";
