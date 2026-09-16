import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "../../../domain/defaults";
import { SettingsDrawer } from "./SettingsDrawer";

describe("SettingsDrawer", () => {
  it("updates all duration values", () => {
    const onSave = vi.fn();
    render(
      <SettingsDrawer
        open
        settings={DEFAULT_SETTINGS}
        onClose={vi.fn()}
        onSave={onSave}
      />
    );

    fireEvent.change(screen.getByLabelText("专注时长"), { target: { value: "30" } });
    fireEvent.change(screen.getByLabelText("短休息"), { target: { value: "6" } });
    fireEvent.change(screen.getByLabelText("长休息"), { target: { value: "20" } });
    fireEvent.change(screen.getByLabelText("长休息间隔"), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "保存设置" }));

    expect(onSave).toHaveBeenCalledWith({
      ...DEFAULT_SETTINGS,
      focusMinutes: 30,
      shortBreakMinutes: 6,
      longBreakMinutes: 20,
      longBreakEvery: 3
    });
  });

  it("rejects invalid durations", () => {
    const onSave = vi.fn();
    render(
      <SettingsDrawer
        open
        settings={DEFAULT_SETTINGS}
        onClose={vi.fn()}
        onSave={onSave}
      />
    );

    fireEvent.change(screen.getByLabelText("专注时长"), { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: "保存设置" }));

    expect(screen.getByRole("alert").textContent).toContain("1 到 180");
    expect(onSave).not.toHaveBeenCalled();
  });

  it("persists notification and always-on-top switches", () => {
    const onSave = vi.fn();
    render(
      <SettingsDrawer
        open
        settings={DEFAULT_SETTINGS}
        onClose={vi.fn()}
        onSave={onSave}
      />
    );

    fireEvent.click(screen.getByLabelText("通知声音"));
    fireEvent.click(screen.getByLabelText("窗口置顶"));
    fireEvent.click(screen.getByRole("button", { name: "保存设置" }));

    expect(onSave).toHaveBeenCalledWith({
      ...DEFAULT_SETTINGS,
      soundEnabled: false,
      alwaysOnTop: true
    });
  });
});
