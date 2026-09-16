import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { FocusSession, Task } from "../../../shared/model";
import { TaskSidebar } from "./TaskSidebar";

const task: Task = {
  id: "task-1",
  title: "复习线性代数",
  createdAt: "2026-09-16T01:00:00.000Z",
  completedAt: null,
  deletedAt: null
};

const session: FocusSession = {
  id: "session-1",
  taskId: "task-1",
  startedAt: "2026-09-16T01:00:00.000Z",
  endedAt: "2026-09-16T01:25:00.000Z",
  focusedSeconds: 1500,
  completed: true
};

describe("TaskSidebar", () => {
  it("renders focused minutes and Pomodoro progress", () => {
    render(
      <TaskSidebar
        tasks={[task]}
        sessions={[session]}
        selectedTaskId="task-1"
        activeTimerTaskId={null}
        onAddTask={vi.fn()}
        onSelectTask={vi.fn()}
        onCompleteTask={vi.fn()}
        onDeleteTask={vi.fn()}
      />
    );

    expect(screen.getByText(task.title)).toBeTruthy();
    expect(screen.getByText("25 分钟")).toBeTruthy();
    expect(screen.getByLabelText("已完成 1 个番茄")).toBeTruthy();
  });

  it("disables deletion for the task owned by the active timer", () => {
    render(
      <TaskSidebar
        tasks={[task]}
        sessions={[]}
        selectedTaskId="task-1"
        activeTimerTaskId="task-1"
        onAddTask={vi.fn()}
        onSelectTask={vi.fn()}
        onCompleteTask={vi.fn()}
        onDeleteTask={vi.fn()}
      />
    );

    expect(screen.getByLabelText("删除任务").hasAttribute("disabled")).toBe(true);
  });
});
