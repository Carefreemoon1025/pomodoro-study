import { _electron as electron, expect, test } from "@playwright/test";
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("adds a task, controls the timer, and switches theme", async () => {
  const userDataDirectory = join(tmpdir(), `pomodoro-e2e-${Date.now()}`);
  const electronApp = await electron.launch({
    args: ["."],
    env: {
      ...process.env,
      POMODORO_E2E_DATA_DIR: userDataDirectory,
      POMODORO_TEST_DURATION_SECONDS: "5"
    }
  });

  try {
    const page = await electronApp.firstWindow();
    await expect(page.getByText("番茄专注")).toBeVisible();

    await page.getByLabel("添加任务").fill("端到端测试");
    await page.getByRole("button", { name: "添加" }).click();
    await page.getByText("端到端测试").click();

    await page.getByRole("button", { name: "开始专注" }).click();
    await expect(page.getByRole("button", { name: "暂停" })).toBeVisible();

    await page.getByRole("button", { name: "暂停" }).click();
    await expect(page.getByRole("button", { name: "继续" })).toBeVisible();

    await page.getByRole("button", { name: "继续" }).click();
    await page.getByRole("button", { name: "深色" }).click();
    await expect(page.getByRole("button", { name: "浅色" })).toBeVisible();
  } finally {
    await electronApp.close();
    rmSync(userDataDirectory, { recursive: true, force: true });
  }
});
