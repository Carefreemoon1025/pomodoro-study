import type { FocusSession, RuntimeState, Settings } from "../shared/model";

function startRuntime(
  runtime: RuntimeState,
  phase: RuntimeState["phase"],
  taskId: string | null,
  durationSeconds: number,
  nowMs: number
): RuntimeState {
  return {
    ...runtime,
    selectedTaskId: taskId,
    phase,
    startedAt: new Date(nowMs).toISOString(),
    durationSeconds,
    pausedAt: null,
    accumulatedPausedMs: 0
  };
}

export function startFocus(
  runtime: RuntimeState,
  taskId: string,
  settings: Settings,
  nowMs: number
): RuntimeState {
  return startRuntime(runtime, "focus", taskId, settings.focusMinutes * 60, nowMs);
}

export function startBreak(
  runtime: RuntimeState,
  settings: Settings,
  nowMs: number
): RuntimeState {
  const duration =
    runtime.phase === "longBreak" ? settings.longBreakMinutes : settings.shortBreakMinutes;
  const phase = runtime.phase === "longBreak" ? "longBreak" : "shortBreak";

  return startRuntime(runtime, phase, runtime.selectedTaskId, duration * 60, nowMs);
}

export function pauseTimer(runtime: RuntimeState, nowMs: number): RuntimeState {
  if (runtime.startedAt === null || runtime.pausedAt !== null) return runtime;
  return { ...runtime, pausedAt: new Date(nowMs).toISOString() };
}

export function resumeTimer(runtime: RuntimeState, nowMs: number): RuntimeState {
  if (runtime.pausedAt === null) return runtime;

  const pausedMs = nowMs - new Date(runtime.pausedAt).getTime();
  return {
    ...runtime,
    pausedAt: null,
    accumulatedPausedMs: runtime.accumulatedPausedMs + Math.max(0, pausedMs)
  };
}

export function elapsedSeconds(runtime: RuntimeState, nowMs: number): number {
  if (runtime.startedAt === null) return 0;

  const endMs = runtime.pausedAt === null ? nowMs : new Date(runtime.pausedAt).getTime();
  const elapsedMs =
    endMs - new Date(runtime.startedAt).getTime() - runtime.accumulatedPausedMs;

  return Math.max(0, Math.floor(elapsedMs / 1000));
}

export function remainingSeconds(runtime: RuntimeState, nowMs: number): number {
  return Math.max(0, runtime.durationSeconds - elapsedSeconds(runtime, nowMs));
}

export interface FinishPhaseResult {
  runtime: RuntimeState;
  session: FocusSession | null;
}

export function finishPhase(
  runtime: RuntimeState,
  settings: Settings,
  nowMs: number,
  sessionId: string
): FinishPhaseResult {
  if (runtime.phase === "idle" || runtime.startedAt === null) {
    return { runtime, session: null };
  }

  if (runtime.phase !== "focus") {
    const completedLongBreak = runtime.phase === "longBreak";
    return {
      runtime: {
        ...runtime,
        phase: "idle",
        startedAt: null,
        durationSeconds: 0,
        pausedAt: null,
        accumulatedPausedMs: 0,
        cyclePosition: completedLongBreak ? 0 : runtime.cyclePosition
      },
      session: null
    };
  }

  const focusedSeconds = Math.min(runtime.durationSeconds, elapsedSeconds(runtime, nowMs));
  const completed = focusedSeconds >= runtime.durationSeconds;
  const nextCyclePosition = completed ? runtime.cyclePosition + 1 : runtime.cyclePosition;
  const nextPhase = completed
    ? nextCyclePosition % settings.longBreakEvery === 0
      ? "longBreak"
      : "shortBreak"
    : "idle";

  return {
    runtime: {
      ...runtime,
      phase: nextPhase,
      startedAt: null,
      durationSeconds: 0,
      pausedAt: null,
      accumulatedPausedMs: 0,
      cyclePosition: nextCyclePosition
    },
    session:
      focusedSeconds > 0
        ? {
            id: sessionId,
            taskId: runtime.selectedTaskId!,
            startedAt: runtime.startedAt,
            endedAt: new Date(nowMs).toISOString(),
            focusedSeconds,
            completed
          }
        : null
  };
}
