import type { FocusSession, Task } from "../shared/model";

export function createTask(
  title: string,
  now = new Date(),
  id: string = crypto.randomUUID()
): Task {
  return {
    id,
    title: title.trim(),
    createdAt: now.toISOString(),
    completedAt: null,
    deletedAt: null
  };
}

export function activeTasks(tasks: Task[]): Task[] {
  return tasks.filter((task) => task.deletedAt === null);
}

export function completeTask(
  tasks: Task[],
  taskId: string,
  now = new Date()
): { tasks: Task[] } {
  return {
    tasks: tasks.map((task) =>
      task.id === taskId && task.completedAt === null
        ? { ...task, completedAt: now.toISOString() }
        : task
    )
  };
}

export function deleteTask(
  tasks: Task[],
  taskId: string,
  now = new Date()
): { tasks: Task[] } {
  return {
    tasks: tasks.map((task) =>
      task.id === taskId ? { ...task, deletedAt: now.toISOString() } : task
    )
  };
}

export function taskAggregates(
  tasks: Task[],
  sessions: FocusSession[]
): Record<string, { focusedSeconds: number; completedPomodoros: number }> {
  const result = Object.fromEntries(
    tasks.map((task) => [task.id, { focusedSeconds: 0, completedPomodoros: 0 }])
  );

  for (const session of sessions) {
    const aggregate = result[session.taskId];
    if (!aggregate) continue;

    aggregate.focusedSeconds += session.focusedSeconds;
    if (session.completed) aggregate.completedPomodoros += 1;
  }

  return result;
}
