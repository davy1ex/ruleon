#!/usr/bin/env node
/**
 * Regenerate app icons from build/icons/logo-source.png (1024×1024).
 * Requires macOS `sips` or set ICON_SIPS to a compatible binary.
 */
import { execSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "build/icons/logo-source.png");
const sips = process.env.ICON_SIPS ?? "sips";

if (!existsSync(source)) {
  console.error(`Missing ${source}. Add a 1024×1024 logo first.`);
  process.exit(1);
}

function resize(input, output, size) {
  mkdirSync(dirname(output), { recursive: true });
  copyFileSync(input, output);
  execSync(`${sips} -z ${size} ${size} ${JSON.stringify(output)}`, {
    stdio: "inherit",
  });
}

const electronSizes = [256, 512];
for (const size of electronSizes) {
  resize(source, join(root, `build/icons/${size}x${size}.png`), size);
}

resize(source, join(root, "public/logo.png"), 512);
resize(source, join(root, "public/favicon.png"), 32);

const androidLauncher = {
  "mipmap-mdpi": 48,
  "mipmap-hdpi": 72,
  "mipmap-xhdpi": 96,
  "mipmap-xxhdpi": 144,
  "mipmap-xxxhdpi": 192,
};

const androidForeground = {
  "mipmap-mdpi": 108,
  "mipmap-hdpi": 162,
  "mipmap-xhdpi": 216,
  "mipmap-xxhdpi": 324,
  "mipmap-xxxhdpi": 432,
};

const resRoot = join(root, "android/app/src/main/res");

for (const [folder, size] of Object.entries(androidLauncher)) {
  const dir = join(resRoot, folder);
  resize(source, join(dir, "ic_launcher.png"), size);
  resize(source, join(dir, "ic_launcher_round.png"), size);
}

for (const [folder, size] of Object.entries(androidForeground)) {
  resize(source, join(resRoot, folder, "ic_launcher_foreground.png"), size);
}

const splashSizes = {
  "drawable-mdpi": 320,
  "drawable-hdpi": 480,
  "drawable-xhdpi": 720,
  "drawable-xxhdpi": 960,
  "drawable-xxxhdpi": 1280,
  "drawable-port-mdpi": 320,
  "drawable-port-hdpi": 480,
  "drawable-port-xhdpi": 720,
  "drawable-port-xxhdpi": 960,
  "drawable-port-xxxhdpi": 1280,
  "drawable-land-mdpi": 480,
  "drawable-land-hdpi": 720,
  "drawable-land-xhdpi": 960,
  "drawable-land-xxhdpi": 1280,
  "drawable-land-xxxhdpi": 1920,
};

for (const [folder, width] of Object.entries(splashSizes)) {
  const output = join(resRoot, folder, "splash.png");
  mkdirSync(dirname(output), { recursive: true });
  copyFileSync(source, output);
  execSync(`${sips} -Z ${width} ${JSON.stringify(output)}`, { stdio: "inherit" });
}

resize(source, join(resRoot, "drawable/splash.png"), 480);

console.log("App icons generated from build/icons/logo-source.png");
