import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "src");
const MAX_LINES = 200;

function walk(dir) {
  const entries = readdirSync(dir);
  const files = [];

  for (const entry of entries) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      files.push(...walk(path));
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry)) {
      files.push(path);
    }
  }

  return files;
}

const violations = walk(ROOT)
  .map((file) => ({
    file,
    lines: readFileSync(file, "utf8").split("\n").length,
  }))
  .filter(({ lines }) => lines > MAX_LINES);

if (violations.length > 0) {
  console.error(`Files exceeding ${MAX_LINES} lines:`);
  for (const { file, lines } of violations) {
    console.error(`  ${file}: ${lines}`);
  }
  process.exit(1);
}

console.log(`All source files are within ${MAX_LINES} lines.`);
