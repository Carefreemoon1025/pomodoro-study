import { createStore } from "zustand/vanilla";
import { createDefaultData } from "../../../domain/defaults";
import { nextTheme, validateSettings } from "../../../domain/settings";
import {
  completeTask as completeTaskDomain,
  createTask,
  deleteTask as deleteTaskDomain
} from "../../../domain/tasks";
import {
  finishPhase,
  pauseTimer as pauseTimerDomain,
  remainingSeconds,
  resumeTimer as resumeTimerDomain,
  startBreak,
  startFocus
} from "../../../domain/timer";
import type { PomodoroApi } from "../../../shared/ipc";
import type { AppData, Settings, TimerCommand } from "../../../shared/model";

export interface AppStoreState {
  data: AppData;
  remaining: number;
  initialized: boolean;
  error: string | null;
  initialize(): Promise<void>;
  refreshRemaining(): void;
  addTask(title: string): void;
  selectTask(taskId: string): void;
  completeTask(taskId: string): void;
  deleteTask(taskId: string): void;
  startTimer(): void;
  pauseTimer(): void;
  resumeTimer(): void;
  finishTimer(): void;
  updateSettings(settings: Settings): void;
  toggleTheme(): void;
  handleTimerCommand(command: TimerCommand): void;
}

const fallbackApi: PomodoroApi = {
  loadData: async () => createDefaultData(),
  saveData: async () => ({ ok: true }),
  setAlwaysOnTop: async () => undefined,
  showNotification: async () => undefined,
  onTimerCommand: () => () => undefined
};

function applyTheme(theme: Settings["theme"]): void {
  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = theme;
  }
}

function displaySeconds(data: AppData): number {
  const { runtime, settings } = data;

  if (runtime.startedAt !== null) {
    return remainingSeconds(runtime, Date.now());
  }

  if (runtime.phase === "shortBreak") return settings.shortBreakMinutes * 60;
  if (runtime.phase === "longBreak") return settings.longBreakMinutes * 60;
  return settings.focusMinutes * 60;
}

export function createAppStore(
  api: PomodoroApi,
  now: () => number = Date.now
) {
  return createStore<AppStoreState>((set, get) => {
    const persist = (data: AppData): void => {
      void api.saveData(data).then((result) => {
        if (!result.ok) {
          set({ error: result.error ?? "保存失败" });
        }
      });
    };

    return {
      data: createDefaultData(),
      remaining: 25 * 60,
      initialized: false,
      error: null,

      async initialize() {
        try {
          const data = await api.loadData();
          set({ data, initialized: true, error: null });
          applyTheme(data.settings.theme);
          void api.setAlwaysOnTop(data.settings.alwaysOnTop);
          get().refreshRemaining();
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "数据加载失败",
            initialized: true
          });
        }
      },

      refreshRemaining() {
        const state = get();
        const runtime = state.data.runtime;
        const remaining =
          runtime.startedAt !== null ? remainingSeconds(runtime, now()) : displaySeconds(state.data);

        set({ remaining });

        if (runtime.startedAt !== null && remaining === 0 && runtime.pausedAt === null) {
          get().finishTimer();
        }
      },

      addTask(title) {
        const normalizedTitle = title.trim();
        if (normalizedTitle.length === 0) {
          set({ error: "任务名称不能为空" });
          return;
        }

        const nextData = {
          ...get().data,
          tasks: [...get().data.tasks, createTask(normalizedTitle)]
        };
        set({ data: nextData, error: null });
        persist(nextData);
      },

      selectTask(taskId) {
        const task = get().data.tasks.find(
          (candidate) => candidate.id === taskId && candidate.deletedAt === null
        );
        if (!task) return;

        const nextData = {
          ...get().data,
          runtime: { ...get().data.runtime, selectedTaskId: taskId }
        };
        set({ data: nextData, error: null });
        persist(nextData);
      },

      completeTask(taskId) {
        const nextData = {
          ...get().data,
          tasks: completeTaskDomain(get().data.tasks, taskId).tasks
        };
        set({ data: nextData, error: null });
        persist(nextData);
      },

      deleteTask(taskId) {
        const state = get();
        const activeTimerTask =
          state.data.runtime.startedAt !== null &&
          state.data.runtime.selectedTaskId === taskId;

        if (activeTimerTask) {
          set({ error: "请先结束当前阶段，再删除正在计时的任务" });
          return;
        }

        const nextData = {
          ...state.data,
          tasks: deleteTaskDomain(state.data.tasks, taskId).tasks,
          runtime:
            state.data.runtime.selectedTaskId === taskId
              ? { ...state.data.runtime, selectedTaskId: null }
              : state.data.runtime
        };
        set({ data: nextData, error: null });
        persist(nextData);
      },

      startTimer() {
        const state = get();
        const runtime = state.data.runtime;
        const selectedTaskId = runtime.selectedTaskId;

        if (selectedTaskId === null) {
          set({ error: "请先选择一项任务" });
          return;
        }

        let nextRuntime = runtime;
        if (runtime.pausedAt !== null) {
          nextRuntime = resumeTimerDomain(runtime, now());
        } else if (runtime.phase === "shortBreak" || runtime.phase === "longBreak") {
          nextRuntime = startBreak(runtime, state.data.settings, now());
        } else if (runtime.startedAt === null) {
          nextRuntime = startFocus(
            runtime,
            selectedTaskId,
            state.data.settings,
            now()
          );
        }

        const nextData = { ...state.data, runtime: nextRuntime };
        set({ data: nextData, error: null });
        persist(nextData);
        get().refreshRemaining();
      },

      pauseTimer() {
        const state = get();
        const nextData = {
          ...state.data,
          runtime: pauseTimerDomain(state.data.runtime, now())
        };
        set({ data: nextData, error: null });
        persist(nextData);
        get().refreshRemaining();
      },

      resumeTimer() {
        const state = get();
        const nextData = {
          ...state.data,
          runtime: resumeTimerDomain(state.data.runtime, now())
        };
        set({ data: nextData, error: null });
        persist(nextData);
        get().refreshRemaining();
      },

      finishTimer() {
        const state = get();
        const runtime = state.data.runtime;
        if (runtime.startedAt === null) {
          get().refreshRemaining();
          return;
        }

        const previousPhase = runtime.phase;
        const result = finishPhase(
          runtime,
          state.data.settings,
          now(),
          crypto.randomUUID()
        );
        const nextData: AppData = {
          ...state.data,
          runtime: result.runtime,
          focusSessions: result.session
            ? [...state.data.focusSessions, result.session]
            : state.data.focusSessions
        };

        set({ data: nextData, error: null, remaining: 0 });
        persist(nextData);
        get().refreshRemaining();

        if (result.session?.completed) {
          void api.showNotification("专注完成", "这一轮已记录，可以开始休息了。");
        } else if (previousPhase === "shortBreak" || previousPhase === "longBreak") {
          void api.showNotification("休息结束", "准备好后开始下一轮专注。");
        }
      },

      updateSettings(settings) {
        const validated = validateSettings(settings);
        if (!validated.ok) {
          set({ error: validated.error });
          return;
        }

        const nextData = { ...get().data, settings: validated.value };
        set({ data: nextData, error: null });
        applyTheme(validated.value.theme);
        void api.setAlwaysOnTop(validated.value.alwaysOnTop);
        persist(nextData);
        get().refreshRemaining();
      },

      toggleTheme() {
        const state = get();
        const theme = nextTheme(state.data.settings.theme);
        const nextData = {
          ...state.data,
          settings: { ...state.data.settings, theme }
        };
        set({ data: nextData, error: null });
        applyTheme(theme);
        persist(nextData);
      },

      handleTimerCommand(command) {
        if (command === "start") {
          get().startTimer();
        } else {
          get().pauseTimer();
        }
      }
    };
  });
}

const runtimeWindow = window as Window & { pomodoro?: PomodoroApi };
export const appStore = createAppStore(runtimeWindow.pomodoro ?? fallbackApi);

export { useStore } from "zustand";
