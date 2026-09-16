export type Theme = "light" | "dark";
export type TimerPhase = "idle" | "focus" | "shortBreak" | "longBreak";
export type TimerCommand = "start" | "pause";

export interface Settings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  longBreakEvery: number;
  soundEnabled: boolean;
  theme: Theme;
  alwaysOnTop: boolean;
}

export interface Task {
  id: string;
  title: string;
  createdAt: string;
  completedAt: string | null;
  deletedAt: string | null;
}

export interface FocusSession {
  id: string;
  taskId: string;
  startedAt: string;
  endedAt: string;
  focusedSeconds: number;
  completed: boolean;
}

export interface RuntimeState {
  selectedTaskId: string | null;
  cyclePosition: number;
  phase: TimerPhase;
  startedAt: string | null;
  durationSeconds: number;
  pausedAt: string | null;
  accumulatedPausedMs: number;
}

export interface AppData {
  schemaVersion: 1;
  settings: Settings;
  tasks: Task[];
  focusSessions: FocusSession[];
  runtime: RuntimeState;
}

export type OperationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };
