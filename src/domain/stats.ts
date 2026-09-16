import type { FocusSession, Task } from "../shared/model";

export interface DayFocusStat {
  date: string;
  label: string;
  focusedMinutes: number;
}

export interface DashboardStats {
  today: {
    date: string;
    focusedMinutes: number;
    completedPomodoros: number;
    completedTasks: number;
  };
  last7Days: DayFocusStat[];
}

const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export function localDateKey(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfLocalDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function nextLocalMidnight(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate() + 1);
}

function splitSessionByLocalDay(
  session: FocusSession
): Map<string, number> {
  const result = new Map<string, number>();
  const startMs = new Date(session.startedAt).getTime();
  const endMs = new Date(session.endedAt).getTime();
  const wallMs = endMs - startMs;

  if (
    !Number.isFinite(startMs) ||
    !Number.isFinite(endMs) ||
    wallMs <= 0 ||
    session.focusedSeconds <= 0
  ) {
    return result;
  }

  let cursor = new Date(startMs);
  while (cursor.getTime() < endMs) {
    const dayEnd = nextLocalMidnight(cursor);
    const segmentEnd = Math.min(dayEnd.getTime(), endMs);
    const segmentMs = segmentEnd - cursor.getTime();
    const allocatedSeconds = (session.focusedSeconds * segmentMs) / wallMs;
    const key = localDateKey(cursor);
    result.set(key, (result.get(key) ?? 0) + allocatedSeconds);
    cursor = new Date(segmentEnd);
  }

  return result;
}

function roundedMinutes(seconds: number): number {
  return Math.round(seconds / 60);
}

export function buildDashboard(
  tasks: Task[],
  sessions: FocusSession[],
  now: Date
): DashboardStats {
  const todayKey = localDateKey(now);
  const focusSecondsByDay = new Map<string, number>();
  const completedPomodorosByDay = new Map<string, number>();

  for (const session of sessions) {
    for (const [date, seconds] of splitSessionByLocalDay(session)) {
      focusSecondsByDay.set(date, (focusSecondsByDay.get(date) ?? 0) + seconds);
    }

    if (session.completed) {
      const endedAt = new Date(session.endedAt);
      if (Number.isFinite(endedAt.getTime())) {
        const key = localDateKey(endedAt);
        completedPomodorosByDay.set(key, (completedPomodorosByDay.get(key) ?? 0) + 1);
      }
    }
  }

  const todayStart = startOfLocalDay(now);
  const last7Days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(todayStart);
    date.setDate(todayStart.getDate() - (6 - index));
    const key = localDateKey(date);

    return {
      date: key,
      label: WEEKDAYS[date.getDay()] ?? "",
      focusedMinutes: roundedMinutes(focusSecondsByDay.get(key) ?? 0)
    };
  });

  const completedTasks = tasks.filter((task) => {
    if (task.completedAt === null) return false;
    return localDateKey(new Date(task.completedAt)) === todayKey;
  }).length;

  return {
    today: {
      date: todayKey,
      focusedMinutes: roundedMinutes(focusSecondsByDay.get(todayKey) ?? 0),
      completedPomodoros: completedPomodorosByDay.get(todayKey) ?? 0,
      completedTasks
    },
    last7Days
  };
}
