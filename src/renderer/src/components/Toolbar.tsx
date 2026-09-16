import { Moon, Pin, Settings, Sun } from "lucide-react";
import type { Theme } from "../../../shared/model";

export interface ToolbarProps {
  theme: Theme;
  alwaysOnTop: boolean;
  onToggleTheme(): void;
  onToggleAlwaysOnTop(): void;
  onOpenSettings(): void;
}

export function Toolbar({
  theme,
  alwaysOnTop,
  onToggleTheme,
  onToggleAlwaysOnTop,
  onOpenSettings
}: ToolbarProps) {
  return (
    <div className="workspace-tools" aria-label="窗口工具">
      <button className="tool-button" type="button" onClick={onToggleTheme}>
        {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
        <span>{theme === "light" ? "深色" : "浅色"}</span>
      </button>
      <button
        className={`tool-button ${alwaysOnTop ? "is-active" : ""}`}
        type="button"
        aria-pressed={alwaysOnTop}
        onClick={onToggleAlwaysOnTop}
      >
        <Pin size={15} />
        <span>{alwaysOnTop ? "取消置顶" : "置顶"}</span>
      </button>
      <button className="tool-button" type="button" onClick={onOpenSettings}>
        <Settings size={15} />
        <span>设置</span>
      </button>
    </div>
  );
}
