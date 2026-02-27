import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PW_BASE_URL ?? "http://127.0.0.1:5173";
const webServerCommand =
  process.env.PW_WEBSERVER_COMMAND ??
  "VITE_API_MOCKING=true VITE_API_URL=http://localhost:8080 pnpm exec vite --host 127.0.0.1 --port 5173 --strictPort";
const skipWebServer = process.env.PW_SKIP_WEBSERVER === "true";
const ignoreHTTPSErrors =
  process.env.PW_IGNORE_HTTPS_ERRORS === "true" || baseURL.startsWith("https://");

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL,
    ignoreHTTPSErrors,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: skipWebServer
    ? undefined
    : {
        command: webServerCommand,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
      },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
