import type { AppData, TimerCommand } from "../shared/model";
import { validateAppData } from "./storage/file-store";

export interface DataStore {
  load(): Promise<AppData>;
  save(data: AppData): Promise<void>;
}

export interface DesktopBridge {
  setAlwaysOnTop(enabled: boolean): void;
  showNotification(title: string, body: string): void;
  sendTimerCommand(command: TimerCommand): void;
}

export class DesktopServices {
  constructor(
    private readonly store: DataStore,
    private readonly bridge: DesktopBridge
  ) {}

  loadData(): Promise<AppData> {
    return this.store.load();
  }

  async saveData(data: AppData): Promise<{ ok: boolean; error?: string }> {
    try {
      validateAppData(data);
      await this.store.save(data);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "保存失败"
      };
    }
  }

  setAlwaysOnTop(enabled: boolean): void {
    this.bridge.setAlwaysOnTop(enabled);
  }

  showNotification(title: string, body: string): void {
    this.bridge.showNotification(title, body);
  }

  sendTimerCommand(command: TimerCommand): void {
    this.bridge.sendTimerCommand(command);
  }
}
