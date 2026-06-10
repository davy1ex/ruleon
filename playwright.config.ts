import { defineConfig, devices } from "@playwright/test";

const serverUrl = "http://127.0.0.1:5173";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: serverUrl,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: process.env.CI ? "npm run preview:e2e" : "npm run dev:e2e",
    url: serverUrl,
    reuseExistingServer: !process.env.CI,
    timeout: process.env.CI ? 60_000 : 120_000,
  },
});
