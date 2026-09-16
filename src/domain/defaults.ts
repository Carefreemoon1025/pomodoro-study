import type { AppData, RuntimeState, Settings } from "../shared/model";

export const DEFAULT_SETTINGS: Settings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakEvery: 4,
  soundEnabled: true,
  theme: "light",
  alwaysOnTop: false
};

export const DEFAULT_RUNTIME: RuntimeState = {
  selectedTaskId: null,
  cyclePosition: 0,
  phase: "idle",
  startedAt: null,
  durationSeconds: 0,
  pausedAt: null,
  accumulatedPausedMs: 0
};

export function createDefaultData(): AppData {
  return {
    schemaVersion: 1,
    settings: { ...DEFAULT_SETTINGS },
    tasks: [],
    focusSessions: [],
    runtime: { ...DEFAULT_RUNTIME }
  };
}
