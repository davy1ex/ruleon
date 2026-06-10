import { app, BrowserWindow, ipcMain } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { DualBackupPayload } from "./backupTypes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function formatBackupTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-") + `_${pad(date.getHours())}-${pad(date.getMinutes())}`;
}

function assertSafeMarkdownFilename(filename: string): string {
  const base = path.basename(filename);
  if (base !== filename || base.includes("..") || !base.endsWith(".md")) {
    throw new Error("Invalid backup filename");
  }
  return base;
}

function attachWorkspaceShortcuts(win: BrowserWindow): void {
  win.webContents.on("before-input-event", (event, input) => {
    if (input.type !== "keyDown") {
      return;
    }

    const mod = input.control || input.meta;
    if (!mod || input.shift || input.alt) {
      return;
    }

    // Physical KeyW — block Chromium/Electron "close window" and route to the app.
    if (input.code === "KeyW") {
      event.preventDefault();
      win.webContents.send("workspace:close-tab");
    }
  });
}

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  attachWorkspaceShortcuts(win);

  if (process.env.VITE_DEV_SERVER_URL) {
    void win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    void win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

ipcMain.handle(
  "backup:save",
  async (_event, payload: DualBackupPayload): Promise<string> => {
    const stamp = formatBackupTimestamp(new Date());
    const backupRoot = path.join(
      app.getPath("userData"),
      "Backups",
      `Backup_${stamp}`,
    );
    const mdRoot = path.join(backupRoot, "markdown");

    await fs.mkdir(mdRoot, { recursive: true });

    await fs.writeFile(
      path.join(backupRoot, "ruleon.sqlite"),
      Buffer.from(payload.dbBuffer),
    );

    await Promise.all(
      payload.mdFiles.map(({ filename, content }) => {
        const safe = assertSafeMarkdownFilename(filename);
        return fs.writeFile(path.join(mdRoot, safe), content, "utf8");
      }),
    );

    return backupRoot;
  },
);

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
