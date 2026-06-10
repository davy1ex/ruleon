import { execFileSync, execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const electronDir = path.join(root, "node_modules/electron");
const pathFile = path.join(electronDir, "path.txt");
const distDir = path.join(electronDir, "dist");
const binaryPath = path.join(distDir, "electron");

function isElectronReady() {
  try {
    return (
      fs.existsSync(pathFile) &&
      fs.readFileSync(pathFile, "utf8").trim() === "electron" &&
      fs.existsSync(binaryPath)
    );
  } catch {
    return false;
  }
}

function extractFromCacheZip() {
  const cacheDir = path.join(os.homedir(), ".cache/electron");
  if (!fs.existsSync(cacheDir)) {
    return false;
  }

  const version = JSON.parse(
    fs.readFileSync(path.join(electronDir, "package.json"), "utf8"),
  ).version;
  const zipPath = path.join(
    cacheDir,
    `electron-v${version}-linux-x64.zip`,
  );

  if (!fs.existsSync(zipPath)) {
    return false;
  }

  fs.rmSync(distDir, { recursive: true, force: true });
  fs.mkdirSync(distDir, { recursive: true });
  execFileSync("unzip", ["-q", zipPath, "-d", distDir], { stdio: "inherit" });
  fs.writeFileSync(pathFile, "electron");
  return true;
}

if (isElectronReady()) {
  process.exit(0);
}

console.log("Electron binary missing — installing…");

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

try {
  execSync("node install.js", {
    cwd: electronDir,
    stdio: "inherit",
    env,
  });
} catch {
  // install.js can fail silently when extract is interrupted
}

if (!isElectronReady() && !extractFromCacheZip()) {
  console.error(
    "Electron install failed. Try: rm -rf node_modules/electron && npm install",
  );
  process.exit(1);
}
