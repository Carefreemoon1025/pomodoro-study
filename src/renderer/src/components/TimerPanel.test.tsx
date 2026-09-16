import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TimerPanel } from "./TimerPanel";

const commonProps = {
  taskTitle: null,
  phase: "idle" as const,
  remaining: 1500,
  durationSeconds: 1500,
  cyclePosition: 0,
  longBreakEvery: 4,
  isRunning: false,
  isPaused: false,
  onPrimary: vi.fn(),
  onStop: vi.fn()
};

describe("TimerPanel", () => {
  it("disables the start button when no task is selected", () => {
    render(<TimerPanel {...commonProps} />);

    expect(screen.getByRole("button", { name: "开始专注" }).hasAttribute("disabled")).toBe(
      true
    );
  });

  it("renders the sage-green break state", () => {
    const { container } = render(
      <TimerPanel
        {...commonProps}
        taskTitle="复习线性代数"
        phase="shortBreak"
        remaining={300}
        durationSeconds={300}
      />
    );

    expect(screen.getByText("短休息")).toBeTruthy();
    expect(container.querySelector('[data-phase="shortBreak"]')).toBeTruthy();
    expect(screen.getByRole("button", { name: "开始休息" })).toBeTruthy();
  });
});
