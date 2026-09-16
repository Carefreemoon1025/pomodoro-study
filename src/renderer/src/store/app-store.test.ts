import { describe, expect, it, vi } from "vitest";
import { createDefaultData } from "../../../domain/defaults";
import type { AppData, Task } from "../../../shared/model";
import type { PomodoroApi } from "../../../shared/ipc";
import { createAppStore } from "./app-store";

const task: Task = {
  id: "task-1",
  title: "复习线性代数",
  createdAt: "2026-09-16T01:00:00.000Z",
  completedAt: null,
  deletedAt: null
};

function createApi(data: AppData = createDefaultData()): PomodoroApi {
  return {
    loadData: vi.fn().mockResolvedValue(data),
    saveData: vi.fn().mockResolvedValue({ ok: true }),
    setAlwaysOnTop: vi.fn().mockResolvedValue(undefined),
    showNotification: vi.fn().mockResolvedValue(undefined),
    onTimerCommand: vi.fn().mockReturnValue(() => undefined)
  };
}

describe("app store", () => {
  it("does not start without a selected task", async () => {
    const api = createApi();
    const store = createAppStore(api, () => 1_000);
    await store.getState().initialize();

    store.getState().startTimer();

    expect(store.getState().data.runtime.phase).toBe("idle");
    expect(api.saveData).not.toHaveBeenCalled();
  });

  it("starts focus for the selected task", async () => {
    const data = { ...createDefaultData(), tasks: [task] };
    const api = createApi(data);
    const store = createAppStore(api, () => 1_000);
    await store.getState().initialize();

    store.getState().selectTask("task-1");
    store.getState().startTimer();

    expect(store.getState().data.runtime.phase).toBe("focus");
    expect(store.getState().data.runtime.durationSeconds).toBe(1500);
    expect(store.getState().data.runtime.startedAt).toBe(
      new Date(1_000).toISOString()
    );
  });

  it("soft deletes a task without removing its focus history", async () => {
    const data: AppData = {
      ...createDefaultData(),
      tasks: [task],
      focusSessions: [
        {
          id: "session-1",
          taskId: task.id,
          startedAt: "2026-09-16T01:00:00.000Z",
          endedAt: "2026-09-16T01:25:00.000Z",
          focusedSeconds: 1500,
          completed: true
        }
      ],
      runtime: {
        ...createDefaultData().runtime,
        selectedTaskId: task.id
      }
    };
    const store = createAppStore(createApi(data), () => 1_000);
    await store.getState().initialize();

    store.getState().deleteTask(task.id);

    expect(store.getState().data.tasks[0]?.deletedAt).not.toBeNull();
    expect(store.getState().data.focusSessions).toHaveLength(1);
    expect(store.getState().data.runtime.selectedTaskId).toBeNull();
  });

  it("prevents deleting the task owned by the active timer", async () => {
    const data = { ...createDefaultData(), tasks: [task] };
    const store = createAppStore(createApi(data), () => 1_000);
    await store.getState().initialize();
    store.getState().selectTask(task.id);
    store.getState().startTimer();

    store.getState().deleteTask(task.id);

    expect(store.getState().data.tasks[0]?.deletedAt).toBeNull();
    expect(store.getState().error).toContain("结束当前阶段");
  });

  it("switches theme and persists the new setting", async () => {
    const api = createApi();
    const store = createAppStore(api, () => 1_000);
    await store.getState().initialize();

    store.getState().toggleTheme();

    expect(store.getState().data.settings.theme).toBe("dark");
    expect(api.saveData).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: expect.objectContaining({ theme: "dark" })
      })
    );
  });
});
