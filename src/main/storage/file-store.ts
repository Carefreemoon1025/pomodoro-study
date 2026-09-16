import {
  access,
  copyFile,
  mkdir,
  readFile,
  rename,
  writeFile
} from "node:fs/promises";
import { dirname } from "node:path";
import { createDefaultData } from "../../domain/defaults";
import { validateSettings } from "../../domain/settings";
import type { AppData } from "../../shared/model";

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateAppData(value: unknown): AppData {
  if (!isRecord(value) || value.schemaVersion !== 1) {
    throw new Error("不支持的数据版本");
  }

  if (!isRecord(value.settings)) {
    throw new Error("设置数据无效");
  }

  const settings = validateSettings(value.settings as unknown as AppData["settings"]);
  if (!settings.ok) {
    throw new Error(settings.error);
  }

  if (!Array.isArray(value.tasks) || !Array.isArray(value.focusSessions)) {
    throw new Error("任务或专注记录无效");
  }

  if (!isRecord(value.runtime)) {
    throw new Error("计时状态无效");
  }

  return {
    schemaVersion: 1,
    settings: settings.value,
    tasks: value.tasks as AppData["tasks"],
    focusSessions: value.focusSessions as AppData["focusSessions"],
    runtime: value.runtime as unknown as AppData["runtime"]
  };
}

export class FileStore {
  readonly dataPath: string;

  constructor(dataPath: string) {
    this.dataPath = dataPath;
  }

  private get backupPath(): string {
    return `${this.dataPath}.bak`;
  }

  private get temporaryPath(): string {
    return `${this.dataPath}.tmp`;
  }

  private async read(path: string): Promise<AppData> {
    const contents = await readFile(path, "utf8");
    return validateAppData(JSON.parse(contents));
  }

  private async writeAtomic(data: AppData, preserveBackup: boolean): Promise<void> {
    await mkdir(dirname(this.dataPath), { recursive: true });
    await writeFile(this.temporaryPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");

    if (preserveBackup && (await exists(this.dataPath))) {
      await copyFile(this.dataPath, this.backupPath);
    }

    await rename(this.temporaryPath, this.dataPath);
  }

  async load(): Promise<AppData> {
    try {
      return await this.read(this.dataPath);
    } catch {
      const primaryExists = await exists(this.dataPath);

      if (primaryExists) {
        const corruptPath = `${this.dataPath}.corrupt-${Date.now()}`;
        await copyFile(this.dataPath, corruptPath);
      }

      try {
        return await this.read(this.backupPath);
      } catch {
        const defaults = createDefaultData();
        await this.writeAtomic(defaults, false);
        return defaults;
      }
    }
  }

  async save(data: AppData): Promise<void> {
    const validated = validateAppData(data);
    await this.writeAtomic(validated, true);
  }
}
