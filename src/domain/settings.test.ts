import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "./defaults";
import { nextTheme, validateSettings } from "./settings";

describe("settings", () => {
  it("accepts the default settings", () => {
    expect(validateSettings(DEFAULT_SETTINGS)).toEqual({
      ok: true,
      value: DEFAULT_SETTINGS
    });
  });

  it("rejects out-of-range durations", () => {
    expect(validateSettings({ ...DEFAULT_SETTINGS, focusMinutes: 0 }).ok).toBe(false);
    expect(validateSettings({ ...DEFAULT_SETTINGS, shortBreakMinutes: 61 }).ok).toBe(false);
    expect(validateSettings({ ...DEFAULT_SETTINGS, longBreakEvery: 9 }).ok).toBe(false);
  });

  it("rejects non-integer durations", () => {
    expect(validateSettings({ ...DEFAULT_SETTINGS, focusMinutes: 25.5 }).ok).toBe(false);
  });

  it("toggles theme", () => {
    expect(nextTheme("light")).toBe("dark");
    expect(nextTheme("dark")).toBe("light");
  });
});
