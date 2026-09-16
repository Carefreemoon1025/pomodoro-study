/// <reference types="vite/client" />

import type { PomodoroApi } from "../../shared/ipc";

declare global {
  interface Window {
    pomodoro: PomodoroApi;
  }
}
