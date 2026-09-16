import { useEffect } from "react";
import { buildDashboard } from "../../domain/stats";
import { Dashboard } from "./components/Dashboard";
import { TaskSidebar } from "./components/TaskSidebar";
import { TimerPanel } from "./components/TimerPanel";
import { Toolbar } from "./components/Toolbar";
import { appStore, useStore } from "./store/app-store";

export default function App() {
  const data = useStore(appStore, (state) => state.data);
  const remaining = useStore(appStore, (state) => state.remaining);
  const error = useStore(appStore, (state) => state.error);
  const initialized = useStore(appStore, (state) => state.initialized);
  const selectedTask =
    data.tasks.find(
      (task) => task.id === data.runtime.selectedTaskId && task.deletedAt === null
    ) ?? null;
  const stats = buildDashboard(data.tasks, data.focusSessions, new Date());
  const isRunning =
    data.runtime.startedAt !== null && data.runtime.pausedAt === null;
  const isPaused = data.runtime.pausedAt !== null;
  const durationSeconds =
    data.runtime.startedAt !== null
      ? data.runtime.durationSeconds
      : data.runtime.phase === "shortBreak"
        ? data.settings.shortBreakMinutes * 60
        : data.runtime.phase === "longBreak"
          ? data.settings.longBreakMinutes * 60
          : data.settings.focusMinutes * 60;

  useEffect(() => {
    void appStore.getState().initialize();
    const refreshInterval = window.setInterval(() => {
      appStore.getState().refreshRemaining();
    }, 250);
    const unsubscribe =
      window.pomodoro?.onTimerCommand((command) => {
        appStore.getState().handleTimerCommand(command);
      }) ?? (() => undefined);

    return () => {
      window.clearInterval(refreshInterval);
      unsubscribe();
    };
  }, []);

  return (
    <div className="app-shell">
      <TaskSidebar
        tasks={data.tasks}
        sessions={data.focusSessions}
        selectedTaskId={data.runtime.selectedTaskId}
        activeTimerTaskId={isRunning ? selectedTask?.id ?? null : null}
        onAddTask={(title) => appStore.getState().addTask(title)}
        onSelectTask={(taskId) => appStore.getState().selectTask(taskId)}
        onCompleteTask={(taskId) => appStore.getState().completeTask(taskId)}
        onDeleteTask={(taskId) => appStore.getState().deleteTask(taskId)}
      />

      <main className="workspace">
        <header className="workspace-head">
          <div>
            <div className="brand">
              <span className="brand-mark" aria-hidden="true" />
              <strong>番茄专注</strong>
            </div>
            <span className="current-label">当前任务</span>
            <h1>{selectedTask?.title ?? "暂未选择任务"}</h1>
          </div>
          <Toolbar
            theme={data.settings.theme}
            alwaysOnTop={data.settings.alwaysOnTop}
            onToggleTheme={() => appStore.getState().toggleTheme()}
            onToggleAlwaysOnTop={() =>
              appStore.getState().updateSettings({
                ...data.settings,
                alwaysOnTop: !data.settings.alwaysOnTop
              })
            }
            onOpenSettings={() => undefined}
          />
        </header>

        {error && <div className="error-banner">{error}</div>}
        {!initialized && <div className="loading-banner">正在读取本地数据...</div>}

        <TimerPanel
          taskTitle={selectedTask?.title ?? null}
          phase={data.runtime.phase}
          remaining={remaining}
          durationSeconds={durationSeconds}
          cyclePosition={data.runtime.cyclePosition}
          longBreakEvery={data.settings.longBreakEvery}
          isRunning={isRunning}
          isPaused={isPaused}
          onPrimary={() => {
            if (isRunning) {
              appStore.getState().pauseTimer();
            } else {
              appStore.getState().startTimer();
            }
          }}
          onStop={() => appStore.getState().finishTimer()}
        />

        <Dashboard stats={stats} />
      </main>
    </div>
  );
}
