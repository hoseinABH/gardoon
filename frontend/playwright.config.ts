import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    locale: "fa-IR",
    timezoneId: "Asia/Tehran",
    viewport: { width: 390, height: 844 },
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "mobile-chrome",
      use: {
        ...devices["Pixel 7"],
        channel: "chrome",
        viewport: { width: 390, height: 844 },
      },
    },
  ],
});
