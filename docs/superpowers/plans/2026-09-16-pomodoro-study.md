# Pomodoro Study Desktop App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-only Windows desktop Pomodoro task manager with accurate timing, task and session history, light/dark themes, tray support, and portable packaging.

**Architecture:** Electron owns desktop integration and atomic JSON persistence. React renders the interface. Pure TypeScript domain modules own timer transitions, task lifecycle, statistics, and settings validation, so all business rules run without Electron. A typed preload bridge exposes only the IPC operations the renderer needs.

**Tech Stack:** Electron, electron-vite, React, TypeScript, Zustand, Lucide React, Vitest, Testing Library, Playwright Electron, electron-builder.

**Spec:** `docs/superpowers/specs/2026-09-16-pomodoro-study-design.md`

## Global Constraints

- Target platform: Windows desktop.
- Node.js version: `>=20`.
- Data is local only; no account, cloud sync, backend, or network API.
- Renderer must use `contextIsolation: true` and `nodeIntegration: false`.
- Timer accuracy is derived from wall-clock timestamps, never accumulated interval ticks.
- Default durations: focus `25`, short break `5`, long break `15`, long-break interval `4`.
- Only fully completed focus phases increment the completed Pomodoro count.
- Early-ended focus phases persist actual focused seconds but do not increment the Pomodoro count.
- Task deletion is soft deletion using `deletedAt`; historical focus sessions remain in statistics.
- A task that owns the active timer cannot be deleted until its current phase ends.
- Theme values are `"light"` and `"dark"`; theme selection persists.
- Focus accent: `#D84F3F`; light rest accent: `#4D7C68`; dark rest accent: `#7EAE96`; dark rest surface: `#20372F`.
- Do not use external assets for core controls. Use `lucide-react` icons.
- All source and test files use TypeScript.
- Run `npm test -- --run` before every task commit.

---

### Task 1: Scaffold Electron, React, and the Test Harness

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `electron.vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `src/main/index.ts`
- Create: `src/preload/index.ts`
- Create: `src/renderer/index.html`
- Create: `src/renderer/src/main.tsx`
- Create: `src/renderer/src/App.tsx`
- Create: `src/renderer/src/App.test.tsx`
- Create: `src/test/setup.ts`

**Interfaces:**
- Consumes: none.
- Produces: `App(): JSX.Element`, a working Electron window, and `npm run dev`, `npm test`, `npm run build`.

- [ ] **Step 1: Create the package manifest and install dependencies**

```json
{
  "name": "pomodoro-study",
  "version": "0.1.0",
  "private": true,
  "description": "A local-first Pomodoro desktop app for focused study.",
  "main": "./out/main/index.js",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "npm run typecheck && electron-vite build",
    "preview": "electron-vite preview",
    "typecheck": "tsc --noEmit && tsc -p tsconfig.node.json --noEmit",
    "test": "vitest",
    "test:e2e": "playwright test",
    "dist:win": "npm run build && electron-builder --win portable"
  },
  "dependencies": {
    "@electron-toolkit/utils": "latest",
    "lucide-react": "latest",
    "react": "latest",
    "react-dom": "latest",
    "zustand": "latest"
  },
  "devDependencies": {
    "@playwright/test": "latest",
    "@testing-library/jest-dom": "latest",
    "@testing-library/react": "latest",
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "@vitejs/plugin-react": "latest",
    "electron": "latest",
    "electron-builder": "latest",
    "electron-vite": "latest",
    "jsdom": "latest",
    "typescript": "latest",
    "vite": "latest",
    "vitest": "latest"
  }
}
```

Run:

```powershell
npm install
```

- [ ] **Step 2: Write the failing app smoke test**

`src/renderer/src/App.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders the product name", () => {
    render(<App />);
    expect(screen.getByText("番茄专注")).toBeInTheDocument();
  });
});
```

`src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 3: Run the test and verify it fails**

Run:

```powershell
npm test -- --run src/renderer/src/App.test.tsx
```

Expected: FAIL because `App.tsx` does not exist or does not render `番茄专注`.

- [ ] **Step 4: Add the minimal Electron and React implementation**

`electron.vite.config.ts`:

```ts
import { resolve } from "node:path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src"),
        "@shared": resolve("src/shared")
      }
    },
    plugins: [react()]
  }
});
```

`src/main/index.ts`:

```ts
import { app, BrowserWindow } from "electron";
import { join } from "node:path";
import { is } from "@electron-toolkit/utils";

function createWindow(): void {
  const window = new BrowserWindow({
    width: 960,
    height: 680,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  window.once("ready-to-show", () => window.show());

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    void window.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void window.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", createWindow);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
```

`src/preload/index.ts`:

```ts
import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("pomodoro", {});
```

`src/renderer/index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>番茄专注</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/renderer/src/main.tsx`:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

`src/renderer/src/App.tsx`:

```tsx
export default function App() {
  return <main>番茄专注</main>;
}
```

- [ ] **Step 5: Add TypeScript, Vite test, and ignore configuration**

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "types": ["vitest/globals", "node"]
  },
  "include": ["src/renderer/src", "src/shared", "src/domain", "src/test"]
}
```

`tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "types": ["node"]
  },
  "include": ["electron.vite.config.ts", "src/main", "src/preload", "src/shared"]
}
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"]
  }
});
```

`.gitignore`:

```text
node_modules/
out/
dist/
release/
.vite/
coverage/
playwright-report/
test-results/
*.log
.DS_Store
```

- [ ] **Step 6: Run tests and build**

Run:

```powershell
npm test -- --run src/renderer/src/App.test.tsx
npm run typecheck
npm run build
```

Expected: one test passes; typecheck and build exit with code `0`.

- [ ] **Step 7: Commit**

```powershell
git add .
git commit -m "feat: scaffold electron react app"
```

---

### Task 2: Define the Data Model, Defaults, and Task Lifecycle

**Files:**
- Create: `src/shared/model.ts`
- Create: `src/domain/defaults.ts`
- Create: `src/domain/tasks.ts`
- Create: `src/domain/tasks.test.ts`

**Interfaces:**
- Consumes: none.
- Produces: `AppData`, `Task`, `FocusSession`, `RuntimeState`, `Settings`, `OperationResult<T>`, `createDefaultData()`, `createTask()`, `completeTask()`, `deleteTask()`, `activeTasks()`, `taskAggregates()`.

- [ ] **Step 1: Write failing tests for task lifecycle**

```ts
import { describe, expect, it } from "vitest";
import { activeTasks, completeTask, createTask, deleteTask, taskAggregates } from "./tasks";

describe("task lifecycle", () => {
  it("creates a task with an empty history", () => {
    const task = createTask("复习线性代数", new Date("2026-09-16T01:00:00.000Z"), "task-1");
    expect(task).toEqual({
      id: "task-1",
      title: "复习线性代数",
      createdAt: "2026-09-16T01:00:00.000Z",
      completedAt: null,
      deletedAt: null
    });
  });

  it("soft deletes a task without removing it", () => {
    const task = createTask("旧任务", new Date("2026-09-16T01:00:00.000Z"), "task-1");
    const result = deleteTask([task], "task-1", new Date("2026-09-16T02:00:00.000Z"));
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0]?.deletedAt).toBe("2026-09-16T02:00:00.000Z");
    expect(activeTasks(result.tasks)).toEqual([]);
  });

  it("aggregates only sessions for the requested task", () => {
    const task = createTask("论文", new Date("2026-09-16T01:00:00.000Z"), "task-1");
    const aggregates = taskAggregates([task], [
      {
        id: "s-1",
        taskId: "task-1",
        startedAt: "2026-09-16T01:00:00.000Z",
        endedAt: "2026-09-16T01:25:00.000Z",
        focusedSeconds: 1500,
        completed: true
      }
    ]);
    expect(aggregates["task-1"]).toEqual({ focusedSeconds: 1500, completedPomodoros: 1 });
  });

  it("marks a task completed once", () => {
    const task = createTask("习题", new Date("2026-09-16T01:00:00.000Z"), "task-1");
    const first = completeTask([task], "task-1", new Date("2026-09-16T03:00:00.000Z"));
    const second = completeTask(first.tasks, "task-1", new Date("2026-09-16T04:00:00.000Z"));
    expect(first.tasks[0]?.completedAt).toBe("2026-09-16T03:00:00.000Z");
    expect(second.tasks[0]?.completedAt).toBe("2026-09-16T03:00:00.000Z");
  });
});
```

- [ ] **Step 2: Run the tests and verify they fail**

Run:

```powershell
npm test -- --run src/domain/tasks.test.ts
```

Expected: FAIL because the domain modules do not exist.

- [ ] **Step 3: Implement the model, defaults, and task operations**

`src/shared/model.ts`:

```ts
export type Theme = "light" | "dark";
export type TimerPhase = "idle" | "focus" | "shortBreak" | "longBreak";

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
```

`src/domain/defaults.ts`:

```ts
import type { AppData, RuntimeState, Settings } from "../shared/model";

export const DEFAULT_SETTINGS: Settings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakEvery: 4,
  soundEnabled: true,
  theme: "light",
  alwaysOnTop: false
};

export const DEFAULT_RUNTIME: RuntimeState = {
  selectedTaskId: null,
  cyclePosition: 0,
  phase: "idle",
  startedAt: null,
  durationSeconds: 0,
  pausedAt: null,
  accumulatedPausedMs: 0
};

export function createDefaultData(): AppData {
  return {
    schemaVersion: 1,
    settings: { ...DEFAULT_SETTINGS },
    tasks: [],
    focusSessions: [],
    runtime: { ...DEFAULT_RUNTIME }
  };
}
```

`src/domain/tasks.ts`:

```ts
import type { FocusSession, Task } from "../shared/model";

export function createTask(title: string, now = new Date(), id = crypto.randomUUID()): Task {
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

export function completeTask(tasks: Task[], taskId: string, now = new Date()): { tasks: Task[] } {
  return {
    tasks: tasks.map((task) =>
      task.id === taskId && task.completedAt === null
        ? { ...task, completedAt: now.toISOString() }
        : task
    )
  };
}

export function deleteTask(tasks: Task[], taskId: string, now = new Date()): { tasks: Task[] } {
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
```

- [ ] **Step 4: Run the tests**

Run:

```powershell
npm test -- --run src/domain/tasks.test.ts
```

Expected: all task lifecycle tests pass.

- [ ] **Step 5: Commit**

```powershell
git add src/shared/model.ts src/domain/defaults.ts src/domain/tasks.ts src/domain/tasks.test.ts
git commit -m "feat: add task domain model"
```

---

### Task 3: Implement the Timer State Machine

**Files:**
- Create: `src/domain/timer.ts`
- Create: `src/domain/timer.test.ts`

**Interfaces:**
- Consumes: `RuntimeState`, `FocusSession`, `Settings`.
- Produces: `remainingSeconds(runtime, nowMs)`, `startFocus(runtime, taskId, settings, nowMs)`, `startBreak(runtime, settings, nowMs)`, `pauseTimer(runtime, nowMs)`, `resumeTimer(runtime, nowMs)`, `finishPhase(runtime, settings, nowMs)`.

- [ ] **Step 1: Write failing timer tests**

```ts
import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, DEFAULT_RUNTIME } from "./defaults";
import { finishPhase, remainingSeconds, startFocus, startBreak } from "./timer";

describe("timer state machine", () => {
  it("derives remaining time from wall-clock timestamps", () => {
    const runtime = startFocus({ ...DEFAULT_RUNTIME }, "task-1", DEFAULT_SETTINGS, 1_000);
    expect(remainingSeconds(runtime, 61_000)).toBe(1500 - 60);
  });

  it("creates a completed focus session and advances to a short break", () => {
    const runtime = startFocus({ ...DEFAULT_RUNTIME }, "task-1", DEFAULT_SETTINGS, 0);
    const result = finishPhase(runtime, DEFAULT_SETTINGS, 1_500_000, "session-1");
    expect(result.session).toMatchObject({
      taskId: "task-1",
      focusedSeconds: 1500,
      completed: true
    });
    expect(result.runtime.cyclePosition).toBe(1);
    expect(result.runtime.phase).toBe("shortBreak");
  });

  it("uses a long break after the fourth completed focus", () => {
    const runtime = {
      ...startFocus({ ...DEFAULT_RUNTIME, cyclePosition: 3 }, "task-1", DEFAULT_SETTINGS, 0),
      phase: "focus" as const
    };
    const result = finishPhase(runtime, DEFAULT_SETTINGS, 1_500_000, "session-1");
    expect(result.runtime.cyclePosition).toBe(4);
    expect(result.runtime.phase).toBe("longBreak");
  });

  it("does not count an early-ended focus as a completed Pomodoro", () => {
    const runtime = startFocus({ ...DEFAULT_RUNTIME }, "task-1", DEFAULT_SETTINGS, 0);
    const result = finishPhase(runtime, DEFAULT_SETTINGS, 300_000, "session-1");
    expect(result.session).toMatchObject({ focusedSeconds: 300, completed: false });
    expect(result.runtime.cyclePosition).toBe(0);
    expect(result.runtime.phase).toBe("idle");
  });

  it("starts the pending break without changing cycle position", () => {
    const completed = finishPhase(
      startFocus({ ...DEFAULT_RUNTIME }, "task-1", DEFAULT_SETTINGS, 0),
      DEFAULT_SETTINGS,
      1_500_000,
      "session-1"
    );
    const breakRuntime = startBreak(completed.runtime, DEFAULT_SETTINGS, 1_600_000);
    expect(breakRuntime.phase).toBe("shortBreak");
    expect(breakRuntime.durationSeconds).toBe(300);
    expect(breakRuntime.cyclePosition).toBe(1);
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```powershell
npm test -- --run src/domain/timer.test.ts
```

Expected: FAIL because `src/domain/timer.ts` does not exist.

- [ ] **Step 3: Implement the timer state machine**

`src/domain/timer.ts`:

```ts
import type { FocusSession, RuntimeState, Settings } from "../shared/model";

function startRuntime(
  runtime: RuntimeState,
  phase: RuntimeState["phase"],
  taskId: string | null,
  durationSeconds: number,
  nowMs: number
): RuntimeState {
  return {
    ...runtime,
    selectedTaskId: taskId,
    phase,
    startedAt: new Date(nowMs).toISOString(),
    durationSeconds,
    pausedAt: null,
    accumulatedPausedMs: 0
  };
}

export function startFocus(
  runtime: RuntimeState,
  taskId: string,
  settings: Settings,
  nowMs: number
): RuntimeState {
  return startRuntime(runtime, "focus", taskId, settings.focusMinutes * 60, nowMs);
}

export function startBreak(
  runtime: RuntimeState,
  settings: Settings,
  nowMs: number
): RuntimeState {
  const duration =
    runtime.phase === "longBreak" ? settings.longBreakMinutes : settings.shortBreakMinutes;
  return startRuntime(runtime, runtime.phase, runtime.selectedTaskId, duration * 60, nowMs);
}

export function pauseTimer(runtime: RuntimeState, nowMs: number): RuntimeState {
  if (runtime.startedAt === null || runtime.pausedAt !== null) return runtime;
  return { ...runtime, pausedAt: new Date(nowMs).toISOString() };
}

export function resumeTimer(runtime: RuntimeState, nowMs: number): RuntimeState {
  if (runtime.pausedAt === null) return runtime;
  const pausedMs = nowMs - new Date(runtime.pausedAt).getTime();
  return {
    ...runtime,
    pausedAt: null,
    accumulatedPausedMs: runtime.accumulatedPausedMs + Math.max(0, pausedMs)
  };
}

export function elapsedSeconds(runtime: RuntimeState, nowMs: number): number {
  if (runtime.startedAt === null) return 0;
  const endMs = runtime.pausedAt === null ? nowMs : new Date(runtime.pausedAt).getTime();
  const elapsedMs =
    endMs - new Date(runtime.startedAt).getTime() - runtime.accumulatedPausedMs;
  return Math.max(0, Math.floor(elapsedMs / 1000));
}

export function remainingSeconds(runtime: RuntimeState, nowMs: number): number {
  return Math.max(0, runtime.durationSeconds - elapsedSeconds(runtime, nowMs));
}

export interface FinishPhaseResult {
  runtime: RuntimeState;
  session: FocusSession | null;
}

export function finishPhase(
  runtime: RuntimeState,
  settings: Settings,
  nowMs: number,
  sessionId: string
): FinishPhaseResult {
  if (runtime.phase === "idle" || runtime.startedAt === null) {
    return { runtime, session: null };
  }

  if (runtime.phase !== "focus") {
    const completedLongBreak = runtime.phase === "longBreak";
    return {
      runtime: {
        ...runtime,
        phase: "idle",
        startedAt: null,
        durationSeconds: 0,
        pausedAt: null,
        accumulatedPausedMs: 0,
        cyclePosition: completedLongBreak ? 0 : runtime.cyclePosition
      },
      session: null
    };
  }

  const focusedSeconds = Math.min(runtime.durationSeconds, elapsedSeconds(runtime, nowMs));
  const completed = focusedSeconds >= runtime.durationSeconds;
  const nextCyclePosition = completed ? runtime.cyclePosition + 1 : runtime.cyclePosition;
  const nextPhase = completed
    ? nextCyclePosition % settings.longBreakEvery === 0
      ? "longBreak"
      : "shortBreak"
    : "idle";

  return {
    runtime: {
      ...runtime,
      phase: nextPhase,
      startedAt: null,
      durationSeconds: 0,
      pausedAt: null,
      accumulatedPausedMs: 0,
      cyclePosition: nextCyclePosition
    },
    session: {
      id: sessionId,
      taskId: runtime.selectedTaskId!,
      startedAt: runtime.startedAt,
      endedAt: new Date(nowMs).toISOString(),
      focusedSeconds,
      completed
    }
  };
}
```

- [ ] **Step 4: Run the timer tests**

Run:

```powershell
npm test -- --run src/domain/timer.test.ts
```

Expected: all timer tests pass.

- [ ] **Step 5: Commit**

```powershell
git add src/domain/timer.ts src/domain/timer.test.ts
git commit -m "feat: add accurate timer state machine"
```

---

### Task 4: Add Statistics and Settings Validation

**Files:**
- Create: `src/domain/stats.ts`
- Create: `src/domain/stats.test.ts`
- Create: `src/domain/settings.ts`
- Create: `src/domain/settings.test.ts`

**Interfaces:**
- Consumes: `FocusSession`, `Task`, `Settings`.
- Produces: `buildDashboard(tasks, sessions, now)`, `validateSettings(input)`, `nextTheme(theme)`.

- [ ] **Step 1: Write failing statistics and settings tests**

`src/domain/stats.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildDashboard } from "./stats";

describe("dashboard statistics", () => {
  it("groups focus sessions by local day and keeps deleted task history", () => {
    const dashboard = buildDashboard(
      [],
      [
        {
          id: "s-1",
          taskId: "deleted-task",
          startedAt: "2026-09-15T23:50:00.000Z",
          endedAt: "2026-09-16T00:15:00.000Z",
          focusedSeconds: 1500,
          completed: true
        }
      ],
      new Date("2026-09-16T12:00:00.000Z")
    );
    expect(dashboard.today.focusedMinutes).toBe(25);
    expect(dashboard.today.completedPomodoros).toBe(1);
  });
});
```

`src/domain/settings.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "./defaults";
import { nextTheme, validateSettings } from "./settings";

describe("settings", () => {
  it("rejects out-of-range durations", () => {
    expect(validateSettings({ ...DEFAULT_SETTINGS, focusMinutes: 0 }).ok).toBe(false);
    expect(validateSettings({ ...DEFAULT_SETTINGS, shortBreakMinutes: 61 }).ok).toBe(false);
  });

  it("toggles theme", () => {
    expect(nextTheme("light")).toBe("dark");
    expect(nextTheme("dark")).toBe("light");
  });
});
```

- [ ] **Step 2: Run the tests and verify they fail**

Run:

```powershell
npm test -- --run src/domain/stats.test.ts src/domain/settings.test.ts
```

Expected: FAIL because the modules do not exist.

- [ ] **Step 3: Implement statistics and validation**

Implement `buildDashboard` with a 7-item array ending on the local date of `now`.
Each item contains `{ date, label, focusedMinutes }`. `today` contains focused
minutes, completed Pomodoros, and tasks completed today. A deleted task still
counts if its `completedAt` falls on the requested local day.

Implement `validateSettings` with these bounds:

```ts
const bounds = {
  focusMinutes: [1, 180],
  shortBreakMinutes: [1, 60],
  longBreakMinutes: [1, 120],
  longBreakEvery: [2, 8]
} as const;
```

Return `{ ok: true, value: normalizedSettings }` when all values are finite
integers inside their bounds; otherwise return `{ ok: false, error }`.

Implement:

```ts
export function nextTheme(theme: Theme): Theme {
  return theme === "light" ? "dark" : "light";
}
```

- [ ] **Step 4: Run the tests**

Run:

```powershell
npm test -- --run src/domain/stats.test.ts src/domain/settings.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```powershell
git add src/domain/stats.ts src/domain/stats.test.ts src/domain/settings.ts src/domain/settings.test.ts
git commit -m "feat: add statistics and settings validation"
```

---

### Task 5: Implement Atomic JSON Persistence and Recovery

**Files:**
- Create: `src/main/storage/file-store.ts`
- Create: `src/main/storage/file-store.test.ts`

**Interfaces:**
- Consumes: `AppData`, `createDefaultData()`.
- Produces: `FileStore` class with `load(): Promise<AppData>`, `save(data): Promise<void>`, and `get dataPath(): string`.

- [ ] **Step 1: Write failing persistence tests**

```ts
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FileStore } from "./file-store";

describe("FileStore", () => {
  it("saves and loads data", async () => {
    const dir = await mkdtemp(join(tmpdir(), "pomodoro-store-"));
    const store = new FileStore(join(dir, "data.json"));
    const data = { ...(await store.load()), tasks: [] };
    await store.save(data);
    expect(JSON.parse(await readFile(store.dataPath, "utf8")).schemaVersion).toBe(1);
  });

  it("recovers from a corrupt primary file using the backup", async () => {
    const dir = await mkdtemp(join(tmpdir(), "pomodoro-store-"));
    const store = new FileStore(join(dir, "data.json"));
    await store.save({ ...(await store.load()), tasks: [] });
    await store.save({ ...(await store.load()), tasks: [] });
    await writeFile(store.dataPath, "{bad json", "utf8");
    const loaded = await store.load();
    expect(loaded.schemaVersion).toBe(1);
  });
});
```

- [ ] **Step 2: Run the tests and verify they fail**

Run:

```powershell
npm test -- --run src/main/storage/file-store.test.ts
```

Expected: FAIL because `FileStore` does not exist.

- [ ] **Step 3: Implement atomic save and recovery**

Implement `FileStore.save` as:

1. `mkdir(dirname(path), { recursive: true })`
2. Write validated `AppData` to `${path}.tmp`
3. Copy the current primary file to `${path}.bak` when it exists
4. `rename(tmpPath, dataPath)`

Implement `load` as:

1. Try primary JSON parse.
2. On failure, copy the corrupt file to `data.corrupt-<timestamp>.json`.
3. Try backup JSON parse.
4. On failure, return `createDefaultData()` and save it.

Validate `schemaVersion === 1`, arrays, and settings shape before returning.

- [ ] **Step 4: Run the storage tests**

Run:

```powershell
npm test -- --run src/main/storage/file-store.test.ts
```

Expected: both tests pass.

- [ ] **Step 5: Commit**

```powershell
git add src/main/storage/file-store.ts src/main/storage/file-store.test.ts
git commit -m "feat: add atomic local data storage"
```

---

### Task 6: Add the Typed IPC Bridge and Main-Process Services

**Files:**
- Create: `src/shared/ipc.ts`
- Create: `src/main/services.ts`
- Create: `src/preload/index.ts`
- Modify: `src/main/index.ts`

**Interfaces:**
- Consumes: `FileStore`, `AppData`.
- Produces: IPC channels `data:load`, `data:save`, `window:set-always-on-top`, `notification:show`, and `timer:command`; preload API `window.pomodoro`.

- [ ] **Step 1: Add channel constants and API types**

`src/shared/ipc.ts`:

```ts
import type { AppData } from "./model";

export const IPC = {
  loadData: "data:load",
  saveData: "data:save",
  setAlwaysOnTop: "window:set-always-on-top",
  showNotification: "notification:show",
  timerCommand: "timer:command"
} as const;

export interface PomodoroApi {
  loadData(): Promise<AppData>;
  saveData(data: AppData): Promise<{ ok: boolean; error?: string }>;
  setAlwaysOnTop(enabled: boolean): Promise<void>;
  showNotification(title: string, body: string): Promise<void>;
  onTimerCommand(listener: (command: "start" | "pause") => void): () => void;
}
```

- [ ] **Step 2: Expose the typed preload API**

Use `contextBridge.exposeInMainWorld("pomodoro", api)`. For event cleanup,
return `() => ipcRenderer.removeListener(IPC.timerCommand, handler)`.

Add a renderer type declaration in `src/renderer/src/env.d.ts`:

```ts
import type { PomodoroApi } from "../../shared/ipc";

declare global {
  interface Window {
    pomodoro: PomodoroApi;
  }
}
```

- [ ] **Step 3: Wire Electron main-process services**

In `src/main/index.ts`:

- Resolve `FileStore` to `join(app.getPath("userData"), "data.json")`.
- Register each IPC handler exactly once.
- Validate `AppData` inside `data:save` before writing.
- Use `new Notification({ title, body }).show()` for notifications.
- Create the tray with actions “显示窗口”“开始/暂停”“退出”.
- Send `timer:command` to the active renderer.
- Use `app.requestSingleInstanceLock()` and focus the existing window on a
  second launch.
- Hide the window on the close event unless the application is quitting.

- [ ] **Step 4: Run typecheck and all tests**

Run:

```powershell
npm run typecheck
npm test -- --run
```

Expected: no type errors; all existing tests pass.

- [ ] **Step 5: Commit**

```powershell
git add src/shared/ipc.ts src/main/index.ts src/main/services.ts src/preload/index.ts src/renderer/src/env.d.ts
git commit -m "feat: add typed desktop ipc services"
```

---

### Task 7: Build the Renderer State Store

**Files:**
- Create: `src/renderer/src/store/app-store.ts`
- Create: `src/renderer/src/store/app-store.test.ts`

**Interfaces:**
- Consumes: domain functions and `window.pomodoro`.
- Produces: Zustand store with `data`, `remaining`, `initialize()`, `addTask()`, `selectTask()`, `completeTask()`, `deleteTask()`, `startTimer()`, `pauseTimer()`, `resumeTimer()`, `finishTimer()`, `updateSettings()`, `toggleTheme()`.

- [ ] **Step 1: Write failing store tests**

Test these behaviors using a fake `window.pomodoro`:

```ts
it("does not start without a selected task");
it("starts focus for the selected task");
it("keeps the selected task in history after soft deletion");
it("switches theme and persists data");
```

- [ ] **Step 2: Run the store tests and verify they fail**

Run:

```powershell
npm test -- --run src/renderer/src/store/app-store.test.ts
```

Expected: FAIL because the store does not exist.

- [ ] **Step 3: Implement store initialization and persistence**

- `initialize` calls `window.pomodoro.loadData()`.
- Apply `data.settings.theme` to `document.documentElement.dataset.theme`.
- Start a `250ms` interval that refreshes `remaining`.
- When remaining reaches zero, call `finishTimer`.
- Call `window.pomodoro.saveData(nextData)` after every mutation.
- Keep one in-memory snapshot and do not reload data after every save.

- [ ] **Step 4: Implement task and timer actions**

- `startTimer` returns early when no selected task exists.
- `finishTimer` calls `finishPhase`, appends a non-null session, and sends a
  notification describing completion or early termination.
- `deleteTask` is blocked when `runtime.phase === "focus"` and the task owns
  the active timer.
- `toggleTheme` uses `nextTheme` and persists the change.

- [ ] **Step 5: Run the store tests and all tests**

Run:

```powershell
npm test -- --run src/renderer/src/store/app-store.test.ts
npm test -- --run
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```powershell
git add src/renderer/src/store/app-store.ts src/renderer/src/store/app-store.test.ts
git commit -m "feat: connect renderer to domain state"
```

---

### Task 8: Implement the Main Interface and Theme

**Files:**
- Create: `src/renderer/src/styles.css`
- Create: `src/renderer/src/components/TaskSidebar.tsx`
- Create: `src/renderer/src/components/TimerPanel.tsx`
- Create: `src/renderer/src/components/Dashboard.tsx`
- Create: `src/renderer/src/components/Toolbar.tsx`
- Create: `src/renderer/src/components/TaskSidebar.test.tsx`
- Create: `src/renderer/src/components/TimerPanel.test.tsx`
- Modify: `src/renderer/src/App.tsx`

**Interfaces:**
- Consumes: renderer store actions and state.
- Produces: complete main interface matching the approved sketch.

- [ ] **Step 1: Write failing component tests**

Test:

```ts
it("renders task title, focused minutes, and Pomodoro count");
it("disables the start button when no task is selected");
it("shows the sage-green break state");
it("places theme, pin, and settings controls in that order");
```

- [ ] **Step 2: Run the tests and verify they fail**

Run:

```powershell
npm test -- --run src/renderer/src/components
```

Expected: FAIL because the components do not exist.

- [ ] **Step 3: Implement the task sidebar**

- Add task input with Enter and button submit.
- Render active tasks in creation order.
- Render completed tasks in a collapsed section.
- Show focused minutes and Pomodoro dots.
- Add a `Trash2` action and confirmation dialog.
- Show an inline error when an active timer prevents deletion.

- [ ] **Step 4: Implement the timer panel and toolbar**

- Render current task, phase label, SVG progress ring, remaining time, cycle dots,
  primary control, secondary control, and empty-task warning.
- Toolbar order: theme, pin, settings.
- Theme control uses `Sun` in dark mode and `Moon` in light mode.
- Pin uses `Pin`; settings uses `Settings`.

- [ ] **Step 5: Implement the dashboard and theme palette**

- Three metrics: focused minutes, completed Pomodoros, completed tasks.
- Seven bars with day labels and accessible labels.
- CSS variables for light and dark themes.
- Focus accent `#D84F3F`.
- Light rest accent `#4D7C68`.
- Dark rest accent `#7EAE96`; dark rest surface `#20372F`.

- [ ] **Step 6: Run component tests, typecheck, and build**

Run:

```powershell
npm test -- --run
npm run typecheck
npm run build
```

Expected: tests pass; typecheck and build exit with code `0`.

- [ ] **Step 7: Commit**

```powershell
git add src/renderer/src
git commit -m "feat: build pomodoro task interface"
```

---

### Task 9: Add Settings, Tray Commands, Packaging, and End-to-End Verification

**Files:**
- Create: `src/renderer/src/components/SettingsDrawer.tsx`
- Create: `src/renderer/src/components/SettingsDrawer.test.tsx`
- Create: `playwright.config.ts`
- Create: `tests/e2e/app.spec.ts`
- Create: `electron-builder.yml`
- Create: `README.md`
- Modify: `src/main/index.ts`
- Modify: `src/renderer/src/App.tsx`

**Interfaces:**
- Consumes: all prior tasks.
- Produces: settings UI, tray command handling, portable Windows packaging, and
  verified end-to-end behavior.

- [ ] **Step 1: Write failing settings tests**

Test:

```ts
it("updates focus, short-break, long-break, and long-break interval values");
it("rejects invalid durations");
it("persists notification and always-on-top settings");
```

- [ ] **Step 2: Run the settings tests and verify they fail**

Run:

```powershell
npm test -- --run src/renderer/src/components/SettingsDrawer.test.tsx
```

Expected: FAIL because `SettingsDrawer` does not exist.

- [ ] **Step 3: Implement the settings drawer**

- Use a right-side drawer that does not unmount the timer.
- Present number inputs for four durations.
- Present switches for notification sound and always-on-top.
- Present theme selection.
- Add “恢复默认设置”.
- Validate on blur and show field-level errors.

- [ ] **Step 4: Handle tray commands**

- `start` calls `startTimer()` or `resumeTimer()`.
- `pause` calls `pauseTimer()`.
- Subscribe once during app initialization and clean up on unmount.

- [ ] **Step 5: Add Electron end-to-end tests**

`tests/e2e/app.spec.ts` must launch Electron with `_electron.launch`, wait for
the main window, add a task, select it, start a short test timer, pause it,
resume it, switch theme, and verify the main controls remain visible.

Use a test-only environment variable `POMODORO_TEST_DURATION_SECONDS=2` to
avoid waiting 25 minutes. Production defaults remain unchanged.

- [ ] **Step 6: Add Windows packaging and README**

`electron-builder.yml`:

```yaml
appId: com.local.pomodoro-study
productName: 番茄专注
directories:
  output: release
files:
  - out/**
win:
  target:
    - portable
    - nsis
```

README must document:

- `npm install`
- `npm run dev`
- `npm test -- --run`
- `npm run build`
- `npm run dist:win`
- local data location
- soft-delete behavior

- [ ] **Step 7: Run full verification**

Run:

```powershell
npm test -- --run
npm run typecheck
npm run build
npm run test:e2e
npm run dist:win
```

Expected: all tests pass; typecheck and build exit with code `0`; Windows
portable output appears under `release/`.

- [ ] **Step 8: Commit**

```powershell
git add .
git commit -m "feat: complete settings packaging and end-to-end flow"
```
