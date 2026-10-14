import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 2 : 0,
  timeout: 120 * 1000,
  expect: {
    timeout: 10000,
  },
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173",
    actionTimeout: 15000,
    navigationTimeout: 30000,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: process.platform === "win32" ? "npm.cmd run dev" : "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env["CI"],
    stdout: "ignore",
    stderr: "pipe",
    timeout: 120000,
  },
});
