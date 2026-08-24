import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PREVIEW_PORT ?? 4175);

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/preview-global-setup.ts",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    channel: "chrome",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
  },
});
