import { Check, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { taskAggregates } from "../../../domain/tasks";
import type { FocusSession, Task } from "../../../shared/model";

export interface TaskSidebarProps {
  tasks: Task[];
  sessions: FocusSession[];
  selectedTaskId: string | null;
  activeTimerTaskId: string | null;
  onAddTask(title: string): void;
  onSelectTask(taskId: string): void;
  onCompleteTask(taskId: string): void;
  onDeleteTask(taskId: string): void;
}

function TaskRow({
  task,
  selected,
  aggregate,
  deleteDisabled,
  onSelect,
  onComplete,
  onDelete
}: {
  task: Task;
  selected: boolean;
  aggregate: { focusedSeconds: number; completedPomodoros: number };
  deleteDisabled: boolean;
  onSelect(): void;
  onComplete(): void;
  onDelete(): void;
}) {
  const focusedMinutes = Math.round(aggregate.focusedSeconds / 60);
  const visibleDots = Math.min(4, aggregate.completedPomodoros);

  return (
    <div className={`task-row ${selected ? "is-selected" : ""}`}>
      <button
        className="task-complete-button"
        type="button"
        aria-label={`标记完成 ${task.title}`}
        onClick={onComplete}
      >
        <Check size={13} />
      </button>
      <button className="task-main" type="button" onClick={onSelect}>
        <span className="task-title">{task.title}</span>
        <span className="task-meta">
          {focusedMinutes > 0 ? `${focusedMinutes} 分钟` : "尚未开始"}
        </span>
      </button>
      <span className="task-dots" aria-label={`已完成 ${aggregate.completedPomodoros} 个番茄`}>
        {Array.from({ length: 4 }, (_, index) => (
          <span
            className={`tomato-dot ${index < visibleDots ? "is-done" : ""}`}
            key={index}
          />
        ))}
      </span>
      <button
        className="task-delete-button"
        type="button"
        aria-label="删除任务"
        title={deleteDisabled ? "结束当前阶段后才能删除" : "删除任务"}
        disabled={deleteDisabled}
        onClick={onDelete}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

export function TaskSidebar({
  tasks,
  sessions,
  selectedTaskId,
  activeTimerTaskId,
  onAddTask,
  onSelectTask,
  onCompleteTask,
  onDeleteTask
}: TaskSidebarProps) {
  const [title, setTitle] = useState("");
  const aggregates = taskAggregates(tasks, sessions);
  const active = tasks.filter((task) => task.deletedAt === null);
  const incomplete = active.filter((task) => task.completedAt === null);
  const completed = active.filter((task) => task.completedAt !== null);

  function submitTask(event: React.FormEvent) {
    event.preventDefault();
    if (title.trim().length === 0) return;
    onAddTask(title);
    setTitle("");
  }

  function requestDelete(task: Task) {
    if (activeTimerTaskId === task.id) return;
    if (window.confirm(`确定删除任务“${task.title}”吗？历史专注记录会保留。`)) {
      onDeleteTask(task.id);
    }
  }

  return (
    <aside className="task-panel">
      <header className="panel-heading">
        <div>
          <span className="eyebrow">TODAY</span>
          <h2>今日任务</h2>
        </div>
        <span className="date-label">
          {new Intl.DateTimeFormat("zh-CN", {
            month: "numeric",
            day: "numeric",
            weekday: "short"
          }).format(new Date())}
        </span>
      </header>

      <form className="add-task" onSubmit={submitTask}>
        <Plus size={17} aria-hidden="true" />
        <input
          aria-label="添加任务"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="添加一项学习任务"
        />
        <button type="submit">添加</button>
      </form>

      <div className="task-list">
        {incomplete.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            selected={selectedTaskId === task.id}
            aggregate={aggregates[task.id] ?? { focusedSeconds: 0, completedPomodoros: 0 }}
            deleteDisabled={activeTimerTaskId === task.id}
            onSelect={() => onSelectTask(task.id)}
            onComplete={() => onCompleteTask(task.id)}
            onDelete={() => requestDelete(task)}
          />
        ))}
        {incomplete.length === 0 && (
          <div className="task-empty">先添加一个想完成的学习任务。</div>
        )}
      </div>

      {completed.length > 0 && (
        <details className="completed-group">
          <summary>已完成 {completed.length} 项</summary>
          <div className="task-list">
            {completed.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                selected={selectedTaskId === task.id}
                aggregate={aggregates[task.id] ?? {
                  focusedSeconds: 0,
                  completedPomodoros: 0
                }}
                deleteDisabled={false}
                onSelect={() => onSelectTask(task.id)}
                onComplete={() => onCompleteTask(task.id)}
                onDelete={() => requestDelete(task)}
              />
            ))}
          </div>
        </details>
      )}
    </aside>
  );
}
