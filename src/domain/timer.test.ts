import { describe, expect, it } from "vitest";
import { DEFAULT_RUNTIME, DEFAULT_SETTINGS } from "./defaults";
import {
  finishPhase,
  pauseTimer,
  remainingSeconds,
  resumeTimer,
  startBreak,
  startFocus
} from "./timer";

describe("timer state machine", () => {
  it("derives remaining time from wall-clock timestamps", () => {
    const runtime = startFocus({ ...DEFAULT_RUNTIME }, "task-1", DEFAULT_SETTINGS, 1_000);

    expect(remainingSeconds(runtime, 61_000)).toBe(1500 - 60);
  });

  it("creates a completed focus session and advances to a short break", () => {
    const runtime = startFocus({ ...DEFAULT_RUNTIME }, "task-1", DEFAULT_SETTINGS, 0);
    const result = finishPhase(runtime, DEFAULT_SETTINGS, 1_500_000, "session-1");

    expect(result.session).toMatchObject({
      taskId: "task-1",
      focusedSeconds: 1500,
      completed: true
    });
    expect(result.runtime.cyclePosition).toBe(1);
    expect(result.runtime.phase).toBe("shortBreak");
  });

  it("uses a long break after the fourth completed focus", () => {
    const runtime = startFocus(
      { ...DEFAULT_RUNTIME, cyclePosition: 3 },
      "task-1",
      DEFAULT_SETTINGS,
      0
    );
    const result = finishPhase(runtime, DEFAULT_SETTINGS, 1_500_000, "session-1");

    expect(result.runtime.cyclePosition).toBe(4);
    expect(result.runtime.phase).toBe("longBreak");
  });

  it("does not count an early-ended focus as a completed Pomodoro", () => {
    const runtime = startFocus({ ...DEFAULT_RUNTIME }, "task-1", DEFAULT_SETTINGS, 0);
    const result = finishPhase(runtime, DEFAULT_SETTINGS, 300_000, "session-1");

    expect(result.session).toMatchObject({ focusedSeconds: 300, completed: false });
    expect(result.runtime.cyclePosition).toBe(0);
    expect(result.runtime.phase).toBe("idle");
  });

  it("starts the pending break without changing cycle position", () => {
    const completed = finishPhase(
      startFocus({ ...DEFAULT_RUNTIME }, "task-1", DEFAULT_SETTINGS, 0),
      DEFAULT_SETTINGS,
      1_500_000,
      "session-1"
    );
    const breakRuntime = startBreak(completed.runtime, DEFAULT_SETTINGS, 1_600_000);

    expect(breakRuntime.phase).toBe("shortBreak");
    expect(breakRuntime.durationSeconds).toBe(300);
    expect(breakRuntime.cyclePosition).toBe(1);
  });

  it("subtracts paused time from elapsed focus", () => {
    const started = startFocus({ ...DEFAULT_RUNTIME }, "task-1", DEFAULT_SETTINGS, 0);
    const paused = pauseTimer(started, 10_000);
    const resumed = resumeTimer(paused, 20_000);

    expect(remainingSeconds(resumed, 30_000)).toBe(1480);
  });
});
