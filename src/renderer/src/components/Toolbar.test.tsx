import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Toolbar } from "./Toolbar";

describe("Toolbar", () => {
  it("places theme, pin, and settings controls in that order", () => {
    render(
      <Toolbar
        theme="light"
        alwaysOnTop={false}
        onToggleTheme={vi.fn()}
        onToggleAlwaysOnTop={vi.fn()}
        onOpenSettings={vi.fn()}
      />
    );

    const controls = screen.getAllByRole("button").map((button) => button.textContent);
    expect(controls).toEqual(["深色", "置顶", "设置"]);
  });
});
