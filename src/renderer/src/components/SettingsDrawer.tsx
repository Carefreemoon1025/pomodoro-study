import { RotateCcw, X } from "lucide-react";
import { useEffect, useState } from "react";
import { DEFAULT_SETTINGS } from "../../../domain/defaults";
import { validateSettings } from "../../../domain/settings";
import type { Settings } from "../../../shared/model";

export interface SettingsDrawerProps {
  open: boolean;
  settings: Settings;
  onClose(): void;
  onSave(settings: Settings): void;
}

export function SettingsDrawer({
  open,
  settings,
  onClose,
  onSave
}: SettingsDrawerProps) {
  const [draft, setDraft] = useState(settings);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDraft(settings);
      setError(null);
    }
  }, [open, settings]);

  if (!open) return null;

  function updateNumber(key: keyof Settings, value: string) {
    setDraft((current) => ({ ...current, [key]: Number(value) }));
  }

  function save() {
    const result = validateSettings(draft);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setError(null);
    onSave(result.value);
    onClose();
  }

  return (
    <div className="drawer-backdrop" onMouseDown={onClose}>
      <aside
        className="settings-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="设置"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="drawer-head">
          <div>
            <span className="eyebrow">PREFERENCES</span>
            <h2>设置</h2>
          </div>
          <button className="icon-button" type="button" aria-label="关闭设置" onClick={onClose}>
            <X size={17} />
          </button>
        </header>

        <div className="drawer-section">
          <h3>番茄节奏</h3>
          <label>
            <span>专注时长</span>
            <div className="number-field">
              <input
                aria-label="专注时长"
                type="number"
                min="1"
                max="180"
                value={draft.focusMinutes}
                onChange={(event) => updateNumber("focusMinutes", event.target.value)}
              />
              <em>分钟</em>
            </div>
          </label>
          <label>
            <span>短休息</span>
            <div className="number-field">
              <input
                aria-label="短休息"
                type="number"
                min="1"
                max="60"
                value={draft.shortBreakMinutes}
                onChange={(event) => updateNumber("shortBreakMinutes", event.target.value)}
              />
              <em>分钟</em>
            </div>
          </label>
          <label>
            <span>长休息</span>
            <div className="number-field">
              <input
                aria-label="长休息"
                type="number"
                min="1"
                max="120"
                value={draft.longBreakMinutes}
                onChange={(event) => updateNumber("longBreakMinutes", event.target.value)}
              />
              <em>分钟</em>
            </div>
          </label>
          <label>
            <span>长休息间隔</span>
            <div className="number-field">
              <input
                aria-label="长休息间隔"
                type="number"
                min="2"
                max="8"
                value={draft.longBreakEvery}
                onChange={(event) => updateNumber("longBreakEvery", event.target.value)}
              />
              <em>个番茄</em>
            </div>
          </label>
        </div>

        <div className="drawer-section">
          <h3>习惯</h3>
          <label className="switch-row">
            <span>通知声音</span>
            <input
              type="checkbox"
              checked={draft.soundEnabled}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  soundEnabled: event.target.checked
                }))
              }
            />
          </label>
          <label className="switch-row">
            <span>窗口置顶</span>
            <input
              type="checkbox"
              checked={draft.alwaysOnTop}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  alwaysOnTop: event.target.checked
                }))
              }
            />
          </label>
          <label className="select-row">
            <span>主题</span>
            <select
              value={draft.theme}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  theme: event.target.value === "dark" ? "dark" : "light"
                }))
              }
            >
              <option value="light">浅色</option>
              <option value="dark">深色</option>
            </select>
          </label>
        </div>

        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}

        <div className="drawer-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={() => setDraft({ ...DEFAULT_SETTINGS })}
          >
            <RotateCcw size={15} />
            恢复默认设置
          </button>
          <button className="primary-button" type="button" onClick={save}>
            保存设置
          </button>
        </div>
      </aside>
    </div>
  );
}
