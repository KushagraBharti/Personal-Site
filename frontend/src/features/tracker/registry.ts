import { TrackerModule } from "./shared/types";
import TasksTracker from "./modules/tasks/components/TasksTracker";
import PipelineTracker from "./modules/pipeline/components/PipelineTracker";
import FinanceTracker from "./modules/finance/components/FinanceTracker";

export const trackerModules: TrackerModule[] = [
  {
    id: "tasks",
    label: "Weekly",
    Component: TasksTracker,
  },
  {
    id: "pipeline",
    label: "Active Deals",
    Component: PipelineTracker,
  },
  {
    id: "finance",
    label: "Finance",
    Component: FinanceTracker,
  },
];

export const defaultModuleId = "tasks";
