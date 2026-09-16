import { describe, expect, it } from "vitest";
import {
  activeTasks,
  completeTask,
  createTask,
  deleteTask,
  taskAggregates
} from "./tasks";

describe("task lifecycle", () => {
  it("creates a task with an empty history", () => {
    const task = createTask(
      "复习线性代数",
      new Date("2026-09-16T01:00:00.000Z"),
      "task-1"
    );

    expect(task).toEqual({
      id: "task-1",
      title: "复习线性代数",
      createdAt: "2026-09-16T01:00:00.000Z",
      completedAt: null,
      deletedAt: null
    });
  });

  it("soft deletes a task without removing it", () => {
    const task = createTask("旧任务", new Date("2026-09-16T01:00:00.000Z"), "task-1");
    const result = deleteTask([task], "task-1", new Date("2026-09-16T02:00:00.000Z"));

    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0]?.deletedAt).toBe("2026-09-16T02:00:00.000Z");
    expect(activeTasks(result.tasks)).toEqual([]);
  });

  it("aggregates only sessions for the requested task", () => {
    const task = createTask("论文", new Date("2026-09-16T01:00:00.000Z"), "task-1");
    const aggregates = taskAggregates(
      [task],
      [
        {
          id: "s-1",
          taskId: "task-1",
          startedAt: "2026-09-16T01:00:00.000Z",
          endedAt: "2026-09-16T01:25:00.000Z",
          focusedSeconds: 1500,
          completed: true
        }
      ]
    );

    expect(aggregates["task-1"]).toEqual({
      focusedSeconds: 1500,
      completedPomodoros: 1
    });
  });

  it("marks a task completed once", () => {
    const task = createTask("习题", new Date("2026-09-16T01:00:00.000Z"), "task-1");
    const first = completeTask([task], "task-1", new Date("2026-09-16T03:00:00.000Z"));
    const second = completeTask(first.tasks, "task-1", new Date("2026-09-16T04:00:00.000Z"));

    expect(first.tasks[0]?.completedAt).toBe("2026-09-16T03:00:00.000Z");
    expect(second.tasks[0]?.completedAt).toBe("2026-09-16T03:00:00.000Z");
  });
});
