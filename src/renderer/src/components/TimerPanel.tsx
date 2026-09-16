import { Pause, Play, SkipForward, Square } from "lucide-react";
import type { TimerPhase } from "../../../shared/model";

export interface TimerPanelProps {
  taskTitle: string | null;
  phase: TimerPhase;
  remaining: number;
  durationSeconds: number;
  cyclePosition: number;
  longBreakEvery: number;
  isRunning: boolean;
  isPaused: boolean;
  onPrimary(): void;
  onStop(): void;
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function phaseLabel(phase: TimerPhase): string {
  if (phase === "focus") return "专注中";
  if (phase === "shortBreak") return "短休息";
  if (phase === "longBreak") return "长休息";
  return "等待开始";
}

export function TimerPanel({
  taskTitle,
  phase,
  remaining,
  durationSeconds,
  cyclePosition,
  longBreakEvery,
  isRunning,
  isPaused,
  onPrimary,
  onStop
}: TimerPanelProps) {
  const disabled = taskTitle === null;
  const isBreak = phase === "shortBreak" || phase === "longBreak";
  const primaryLabel =
    isRunning && !isPaused ? "暂停" : isBreak ? "开始休息" : isPaused ? "继续" : "开始专注";
  const secondaryLabel = isBreak ? "跳过休息" : "提前结束";
  const progress = durationSeconds > 0 ? remaining / durationSeconds : 0;
  const circumference = 2 * Math.PI * 96;
  const dashOffset = circumference * (1 - progress);

  return (
    <section className="timer-panel" data-phase={phase} aria-label="番茄计时器">
      <div className="mode-line">
        <span className="mode-dot" aria-hidden="true" />
        <span className="mode-label">{phaseLabel(phase)}</span>
      </div>

      <div className="timer-ring">
        <svg viewBox="0 0 220 220" aria-hidden="true">
          <circle className="ring-track" cx="110" cy="110" r="96" />
          <circle
            className="ring-progress"
            cx="110"
            cy="110"
            r="96"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="timer-copy">
          <strong>{formatTime(remaining)}</strong>
          <span>{taskTitle === null ? "请选择任务" : isBreak ? "休息一下" : "保持专注"}</span>
        </div>
      </div>

      <div className="cycle-row">
        <span>本轮</span>
        <span className="cycle-dots" aria-label={`循环进度 ${cyclePosition}/${longBreakEvery}`}>
          {Array.from({ length: longBreakEvery }, (_, index) => (
            <span
              className={`cycle-dot ${index < cyclePosition ? "is-done" : ""}`}
              key={index}
            />
          ))}
        </span>
        <span>第 {Math.min(cyclePosition + 1, longBreakEvery)} 个番茄</span>
      </div>

      <div className="timer-controls">
        <button
          className="primary-button"
          type="button"
          disabled={disabled}
          onClick={onPrimary}
        >
          {isRunning && !isPaused ? <Pause size={16} /> : <Play size={16} />}
          {primaryLabel}
        </button>
        <button
          className="secondary-button"
          type="button"
          disabled={disabled || (!isRunning && !isPaused && !isBreak)}
          onClick={onStop}
        >
          {isBreak ? <SkipForward size={15} /> : <Square size={14} />}
          {secondaryLabel}
        </button>
      </div>
    </section>
  );
}
