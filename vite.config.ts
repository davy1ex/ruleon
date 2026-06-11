/// <reference types="vitest/config" />
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import electron from "vite-plugin-electron/simple";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const isElectron = mode === "electron";
  const isCapacitor = mode === "capacitor";

  return {
    root: projectRoot,
    base: isElectron || isCapacitor ? "./" : "/",
    plugins: [
      react(),
      isElectron &&
        electron({
          main: {
            entry: "electron/main.ts",
            vite: {
              build: {
                rollupOptions: {
                  external: ["electron"],
                },
              },
            },
          },
          preload: {
            input: "electron/preload.ts",
            vite: {
              build: {
                outDir: "dist-electron",
              },
            },
          },
        }),
    ].filter(Boolean),
    worker: {
      format: "es",
    },
    test: {
      globals: true,
      environment: "node",
      include: ["src/**/*.test.ts"],
    },
  };
});
