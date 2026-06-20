import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TasksHubTracker from "./TasksHubTracker";
import { TaskList, TrackerTask } from "../types";

const useTasksHubModuleMock = vi.hoisted(() => vi.fn());

vi.mock("../hooks", () => ({
  useTasksHubModule: useTasksHubModuleMock,
}));

const list: TaskList = {
  id: "list-1",
  user_id: "user-1",
  name: "Main list",
  color_hex: "#00FFFF",
  sort_order: 1,
  archived: false,
  created_at: "2026-06-20T00:00:00.000Z",
  updated_at: "2026-06-20T00:00:00.000Z",
};

const rootTask: TrackerTask = {
  id: "root-1",
  user_id: "user-1",
  list_id: "list-1",
  parent_task_id: null,
  title: "Root task",
  details: null,
  due_at: null,
  due_timezone: null,
  is_completed: false,
  completed_at: null,
  recurrence_type: "none",
  recurrence_interval: null,
  recurrence_unit: null,
  recurrence_ends_at: null,
  sort_order: 1,
  created_at: "2026-06-20T00:00:00.000Z",
  updated_at: "2026-06-20T00:00:00.000Z",
};

const subtask: TrackerTask = {
  ...rootTask,
  id: "sub-1",
  parent_task_id: "root-1",
  title: "Child task",
  details: "Existing child details",
  sort_order: 1,
};

const buildModuleState = (saveTask = vi.fn().mockResolvedValue(true)) => ({
  allListsKey: "all",
  lists: [list],
  tasksByParent: { "root-1": [subtask] },
  rootTasksByList: { "list-1": [rootTask] },
  countsByList: { "list-1": { open: 2, completed: 0, total: 2 } },
  selectedListId: "list-1",
  setSelectedListId: vi.fn(),
  getSortForList: vi.fn(() => ({ mode: "custom", direction: "asc" })),
  setSortForList: vi.fn(),
  errorMessage: "",
  createList: vi.fn(),
  saveList: vi.fn(),
  removeList: vi.fn(),
  createTaskFromDraft: vi.fn(),
  saveTask,
  removeTask: vi.fn(),
  toggleTaskCompletion: vi.fn(),
  reorderTasks: vi.fn(),
  reorderLists: vi.fn(),
  buildTaskDraft: vi.fn((listId: string, parentTaskId: string | null) => ({
    list_id: listId,
    parent_task_id: parentTaskId,
    title: "",
    details: "",
    due_at: "",
    recurrence_type: "none",
    recurrence_interval: 1,
    recurrence_unit: "week",
    recurrence_ends_at: "",
  })),
  calendarState: null,
  calendarBusy: false,
  calendarSyncResult: null,
  calendarLiveResult: null,
  syncEnabledByList: {},
  connectGoogleCalendar: vi.fn(),
  disconnectGoogleCalendar: vi.fn(),
  setListCalendarSync: vi.fn(),
  syncCalendarNow: vi.fn(),
  rebuildCalendarNow: vi.fn(),
});

describe("TasksHubTracker", () => {
  beforeEach(() => {
    useTasksHubModuleMock.mockReset();
  });

  it("opens and saves the subtask edit expansion", async () => {
    const saveTask = vi.fn().mockResolvedValue(true);
    useTasksHubModuleMock.mockReturnValue(buildModuleState(saveTask));

    render(<TasksHubTracker />);

    fireEvent.click(screen.getByRole("button", { name: "Child task" }));
    fireEvent.change(screen.getByDisplayValue("Child task"), {
      target: { value: "Edited child task" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(saveTask).toHaveBeenCalledWith(
        "sub-1",
        expect.objectContaining({
          title: "Edited child task",
          details: "Existing child details",
        })
      );
    });
  });

  it("cancels the subtask edit expansion without saving", async () => {
    const saveTask = vi.fn().mockResolvedValue(true);
    useTasksHubModuleMock.mockReturnValue(buildModuleState(saveTask));

    render(<TasksHubTracker />);

    fireEvent.click(screen.getByRole("button", { name: "Child task" }));
    fireEvent.change(screen.getByDisplayValue("Child task"), {
      target: { value: "Edited child task" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(screen.queryByDisplayValue("Edited child task")).not.toBeInTheDocument();
    });
    expect(saveTask).not.toHaveBeenCalled();
  });
});
