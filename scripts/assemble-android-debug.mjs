import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const androidDir = path.join(root, "android");
const studioJbr = "/Applications/Android Studio.app/Contents/jbr/Contents/Home";

const env = { ...process.env };
if (!env.JAVA_HOME && fs.existsSync(path.join(studioJbr, "bin", "java"))) {
  env.JAVA_HOME = studioJbr;
}

const gradlew =
  process.platform === "win32"
    ? path.join(androidDir, "gradlew.bat")
    : path.join(androidDir, "gradlew");

const result = spawnSync(gradlew, ["assembleDebug"], {
  cwd: androidDir,
  stdio: "inherit",
  env,
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const apk = path.join(
  androidDir,
  "app/build/outputs/apk/debug/app-debug.apk",
);
console.log(`\nAPK: ${apk}`);
