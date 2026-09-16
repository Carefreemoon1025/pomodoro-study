import { join } from "node:path";
import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  nativeImage,
  Notification,
  Tray
} from "electron";
import { is } from "@electron-toolkit/utils";
import { IPC } from "../shared/ipc";
import type { AppData, TimerCommand } from "../shared/model";
import { DesktopServices, type DesktopBridge } from "./services";
import { FileStore } from "./storage/file-store";

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let quitting = false;

function showMainWindow(): void {
  if (!mainWindow) {
    createWindow();
    return;
  }

  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

function createTrayIcon() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
      <circle cx="16" cy="18" r="12" fill="#d84f3f"/>
      <path d="M16 6c3-4 7-4 9-3-1 4-4 6-8 6z" fill="#2e7d55"/>
    </svg>
  `;
  return nativeImage.createFromDataURL(
    `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`
  );
}

function createTray(services: DesktopServices): void {
  tray = new Tray(createTrayIcon());
  tray.setToolTip("番茄专注");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "显示窗口", click: showMainWindow },
      { type: "separator" },
      {
        label: "开始 / 继续",
        click: () => services.sendTimerCommand("start")
      },
      {
        label: "暂停",
        click: () => services.sendTimerCommand("pause")
      },
      { type: "separator" },
      {
        label: "退出",
        click: () => {
          quitting = true;
          app.quit();
        }
      }
    ])
  );
  tray.on("double-click", showMainWindow);
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 960,
    height: 680,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.once("ready-to-show", () => mainWindow?.show());

  mainWindow.on("close", (event) => {
    if (!quitting && tray) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", showMainWindow);

  app.whenReady().then(() => {
    const store = new FileStore(join(app.getPath("userData"), "data.json"));
    const bridge: DesktopBridge = {
      setAlwaysOnTop: (enabled) => {
        mainWindow?.setAlwaysOnTop(enabled, "floating");
      },
      showNotification: (title, body) => {
        if (Notification.isSupported()) {
          new Notification({ title, body }).show();
        }
      },
      sendTimerCommand: (command: TimerCommand) => {
        mainWindow?.webContents.send(IPC.timerCommand, command);
      }
    };
    const services = new DesktopServices(store, bridge);

    ipcMain.handle(IPC.loadData, () => services.loadData());
    ipcMain.handle(IPC.saveData, (_event, data: AppData) => services.saveData(data));
    ipcMain.handle(IPC.setAlwaysOnTop, (_event, enabled: boolean) => {
      services.setAlwaysOnTop(Boolean(enabled));
    });
    ipcMain.handle(IPC.showNotification, (_event, title: string, body: string) => {
      services.showNotification(String(title), String(body));
    });

    createTray(services);
    createWindow();
    app.on("activate", showMainWindow);
  });

  app.on("before-quit", () => {
    quitting = true;
  });

  app.on("window-all-closed", () => {
    if (!tray) app.quit();
  });
}
