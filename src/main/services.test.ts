import { describe, expect, it, vi } from "vitest";
import { createDefaultData } from "../domain/defaults";
import type { AppData } from "../shared/model";
import { DesktopServices, type DesktopBridge, type DataStore } from "./services";

function createHarness() {
  const data = createDefaultData();
  const store: DataStore = {
    load: vi.fn().mockResolvedValue(data),
    save: vi.fn().mockResolvedValue(undefined)
  };
  const bridge: DesktopBridge = {
    setAlwaysOnTop: vi.fn(),
    showNotification: vi.fn(),
    sendTimerCommand: vi.fn()
  };

  return {
    data,
    store,
    bridge,
    services: new DesktopServices(store, bridge)
  };
}

describe("DesktopServices", () => {
  it("loads and saves valid application data", async () => {
    const { data, services, store } = createHarness();

    await expect(services.loadData()).resolves.toEqual(data);
    await expect(services.saveData(data)).resolves.toEqual({ ok: true });
    expect(store.save).toHaveBeenCalledWith(data);
  });

  it("rejects invalid application data before writing", async () => {
    const { data, services, store } = createHarness();
    const invalid = { ...data, schemaVersion: 2 } as unknown as AppData;

    await expect(services.saveData(invalid)).resolves.toEqual({
      ok: false,
      error: "不支持的数据版本"
    });
    expect(store.save).not.toHaveBeenCalled();
  });

  it("forwards desktop commands to the bridge", () => {
    const { services, bridge } = createHarness();

    services.setAlwaysOnTop(true);
    services.showNotification("专注完成", "可以休息了");
    services.sendTimerCommand("pause");

    expect(bridge.setAlwaysOnTop).toHaveBeenCalledWith(true);
    expect(bridge.showNotification).toHaveBeenCalledWith("专注完成", "可以休息了");
    expect(bridge.sendTimerCommand).toHaveBeenCalledWith("pause");
  });
});
