import type { OperationResult, Settings, Theme } from "../shared/model";

const bounds = {
  focusMinutes: [1, 180],
  shortBreakMinutes: [1, 60],
  longBreakMinutes: [1, 120],
  longBreakEvery: [2, 8]
} as const;

export function validateSettings(
  settings: Settings
): OperationResult<Settings> {
  for (const key of Object.keys(bounds) as Array<keyof typeof bounds>) {
    const value = settings[key];
    const [minimum, maximum] = bounds[key];

    if (!Number.isInteger(value) || value < minimum || value > maximum) {
      return {
        ok: false,
        error: `${key} 必须在 ${minimum} 到 ${maximum} 之间`
      };
    }
  }

  return { ok: true, value: { ...settings } };
}

export function nextTheme(theme: Theme): Theme {
  return theme === "light" ? "dark" : "light";
}
