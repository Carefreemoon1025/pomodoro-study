import { describe, expect, it } from "vitest";
import type { FocusSession, Task } from "../shared/model";
import { buildDashboard } from "./stats";

describe("dashboard statistics", () => {
  it("splits a focus session across midnight by local date", () => {
    const session: FocusSession = {
      id: "s-1",
      taskId: "task-1",
      startedAt: new Date(2026, 8, 16, 23, 50).toISOString(),
      endedAt: new Date(2026, 8, 17, 0, 15).toISOString(),
      focusedSeconds: 1500,
      completed: true
    };

    const dashboard = buildDashboard([], [session], new Date(2026, 8, 17, 12, 0));

    expect(dashboard.today.focusedMinutes).toBe(15);
    expect(dashboard.today.completedPomodoros).toBe(1);
    expect(dashboard.last7Days.at(-2)?.focusedMinutes).toBe(10);
  });

  it("counts early-ended focus minutes without a completed Pomodoro", () => {
    const session: FocusSession = {
      id: "s-1",
      taskId: "task-1",
      startedAt: new Date(2026, 8, 16, 9, 0).toISOString(),
      endedAt: new Date(2026, 8, 16, 9, 5).toISOString(),
      focusedSeconds: 300,
      completed: false
    };

    const dashboard = buildDashboard([], [session], new Date(2026, 8, 16, 12, 0));

    expect(dashboard.today.focusedMinutes).toBe(5);
    expect(dashboard.today.completedPomodoros).toBe(0);
  });

  it("keeps deleted task history in completed-task statistics", () => {
    const task: Task = {
      id: "task-1",
      title: "已完成任务",
      createdAt: new Date(2026, 8, 16, 8, 0).toISOString(),
      completedAt: new Date(2026, 8, 16, 11, 0).toISOString(),
      deletedAt: new Date(2026, 8, 16, 12, 0).toISOString()
    };

    const dashboard = buildDashboard([task], [], new Date(2026, 8, 16, 13, 0));

    expect(dashboard.today.completedTasks).toBe(1);
  });
});
