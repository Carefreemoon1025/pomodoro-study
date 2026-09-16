import type { AppData, TimerCommand } from "./model";

export const IPC = {
  loadData: "data:load",
  saveData: "data:save",
  setAlwaysOnTop: "window:set-always-on-top",
  showNotification: "notification:show",
  timerCommand: "timer:command"
} as const;

export interface PomodoroApi {
  testDurationSeconds?: number;
  loadData(): Promise<AppData>;
  saveData(data: AppData): Promise<{ ok: boolean; error?: string }>;
  setAlwaysOnTop(enabled: boolean): Promise<void>;
  showNotification(title: string, body: string): Promise<void>;
  onTimerCommand(listener: (command: TimerCommand) => void): () => void;
}
