import { expect, type Page } from "@playwright/test";

export const TEST_USERNAME = "vault-admin+mock@agentpassvault.local";
export const TEST_PASSWORD = "MockMasterPass!2026#LocalOnly";

export async function setupRequestCapture(page: Page) {
  await page.addInitScript(() => {
    const originalFetch = window.fetch.bind(window);
    (window as any).__capturedRequests = [];

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const method = init?.method ?? "GET";
      const body = init?.body;

      (window as any).__capturedRequests.push({
        url,
        method,
        body: typeof body === "string" ? body : null,
      });

      return originalFetch(input, init);
    };
  });
}

export async function login(page: Page, username = TEST_USERNAME, password = TEST_PASSWORD) {
  await page.goto("/");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page.getByRole("heading", { name: "Pending Requests" })).toBeVisible();
}

export async function getCapturedRequests(page: Page): Promise<Array<{ url: string; method: string; body: string | null }>> {
  return page.evaluate(() => (window as any).__capturedRequests ?? []);
}
