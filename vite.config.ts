/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import electron from "vite-plugin-electron/simple";

export default defineConfig(({ mode }) => {
  const isElectron = mode === "electron";

  return {
    base: isElectron ? "./" : "/",
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
