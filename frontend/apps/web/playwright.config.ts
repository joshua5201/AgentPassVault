import { defineConfig, devices } from "@playwright/test";

const apiMocking = process.env.PW_API_MOCKING ?? "true";
const apiClientFallback =
  process.env.PW_API_CLIENT_FALLBACK ?? (apiMocking === "true" ? "true" : "false");
const apiUrl = process.env.PW_API_URL ?? "http://localhost:8080";
const baseURL = process.env.PW_BASE_URL ?? "http://127.0.0.1:5173";
const parsedBaseUrl = new URL(baseURL);
const webServerHost = process.env.PW_WEB_HOST ?? parsedBaseUrl.hostname;
const webServerPort =
  process.env.PW_WEB_PORT ??
  (parsedBaseUrl.port || (parsedBaseUrl.protocol === "https:" ? "443" : "80"));
const webServerCommand =
  process.env.PW_WEBSERVER_COMMAND ??
  `VITE_API_MOCKING=${apiMocking} VITE_API_CLIENT_FALLBACK=${apiClientFallback} VITE_API_PROXY=${apiMocking === "false" ? "true" : "false"} VITE_API_URL=${apiUrl} pnpm exec vite --host ${webServerHost} --port ${webServerPort} --strictPort`;
const skipWebServer = process.env.PW_SKIP_WEBSERVER === "true";
const ignoreHTTPSErrors =
  process.env.PW_IGNORE_HTTPS_ERRORS === "true" || baseURL.startsWith("https://");
const integrationMode = apiMocking === "false";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: integrationMode ? ["**/integration-smoke.spec.ts"] : ["**/*.spec.ts"],
  testIgnore: integrationMode ? [] : ["**/integration-smoke.spec.ts"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  globalSetup: "./tests/e2e/global-setup.ts",
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
