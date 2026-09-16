import { contextBridge, ipcRenderer } from "electron";
import { IPC, type PomodoroApi } from "../shared/ipc";
import type { TimerCommand } from "../shared/model";

const testDurationArgument = process.argv.find((argument) =>
  argument.startsWith("--pomodoro-test-duration=")
);
const testDurationSeconds = testDurationArgument
  ? Number(testDurationArgument.split("=")[1])
  : undefined;

const api: PomodoroApi = {
  testDurationSeconds:
    Number.isFinite(testDurationSeconds) && (testDurationSeconds ?? 0) > 0
      ? testDurationSeconds
      : undefined,
  loadData: () => ipcRenderer.invoke(IPC.loadData),
  saveData: (data) => ipcRenderer.invoke(IPC.saveData, data),
  setAlwaysOnTop: (enabled) => ipcRenderer.invoke(IPC.setAlwaysOnTop, enabled),
  showNotification: (title, body) =>
    ipcRenderer.invoke(IPC.showNotification, title, body),
  onTimerCommand: (listener) => {
    const handler = (_event: Electron.IpcRendererEvent, command: TimerCommand) => {
      listener(command);
    };
    ipcRenderer.on(IPC.timerCommand, handler);
    return () => ipcRenderer.removeListener(IPC.timerCommand, handler);
  }
};

contextBridge.exposeInMainWorld("pomodoro", api);
