import { execFileSync, execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const electronDir = path.join(root, "node_modules/electron");
const pathFile = path.join(electronDir, "path.txt");
const distDir = path.join(electronDir, "dist");

function getPlatformPath() {
  const platform = process.env.npm_config_platform || os.platform();

  switch (platform) {
    case "mas":
    case "darwin":
      return "Electron.app/Contents/MacOS/Electron";
    case "freebsd":
    case "openbsd":
    case "linux":
      return "electron";
    case "win32":
      return "electron.exe";
    default:
      throw new Error(
        `Electron builds are not available on platform: ${platform}`,
      );
  }
}

function getPlatformArch() {
  const platform = process.env.npm_config_platform || os.platform();
  let arch = process.env.npm_config_arch || os.arch();

  if (
    platform === "darwin" &&
    process.platform === "darwin" &&
    arch === "x64" &&
    process.env.npm_config_arch === undefined
  ) {
    try {
      const output = execSync("sysctl -in sysctl.proc_translated", {
        encoding: "utf8",
      });
      if (output.trim() === "1") {
        arch = "arm64";
      }
    } catch {
      // Ignore failure
    }
  }

  return { platform, arch };
}

function isElectronReady() {
  try {
    const version = JSON.parse(
      fs.readFileSync(path.join(electronDir, "package.json"), "utf8"),
    ).version;
    const distVersion = fs
      .readFileSync(path.join(distDir, "version"), "utf8")
      .replace(/^v/, "")
      .trim();
    if (distVersion !== version) {
      return false;
    }

    const platformPath = getPlatformPath();
    const recordedPath = fs.readFileSync(pathFile, "utf8").trim();
    if (recordedPath !== platformPath) {
      return false;
    }

    return fs.existsSync(path.join(distDir, platformPath));
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
  const { platform, arch } = getPlatformArch();
  const zipPath = path.join(
    cacheDir,
    `electron-v${version}-${platform}-${arch}.zip`,
  );

  if (!fs.existsSync(zipPath)) {
    return false;
  }

  fs.rmSync(distDir, { recursive: true, force: true });
  fs.mkdirSync(distDir, { recursive: true });
  execFileSync("unzip", ["-q", zipPath, "-d", distDir], { stdio: "inherit" });
  fs.writeFileSync(pathFile, getPlatformPath());
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
