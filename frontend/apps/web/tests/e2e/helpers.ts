import { expect, type Page } from "@playwright/test";

export const TEST_USERNAME = "vault-admin+mock@agentpassvault.local";
export const TEST_PASSWORD = "MockMasterPass!2026#LocalOnly";

export async function setupRequestCapture(page: Page) {
  await page.addInitScript(() => {
    const originalFetch = window.fetch.bind(window);
    (window as any).__capturedRequests = [];

    const normalizeHeaders = (headers: HeadersInit | undefined): Record<string, string> => {
      if (!headers) {
        return {};
      }

      if (headers instanceof Headers) {
        return Object.fromEntries(Array.from(headers.entries()));
      }

      if (Array.isArray(headers)) {
        return Object.fromEntries(headers);
      }

      return Object.fromEntries(
        Object.entries(headers).map(([key, value]) => [key, String(value)]),
      );
    };

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const method = init?.method ?? "GET";
      const body = init?.body;
      const headers = normalizeHeaders(init?.headers);

      (window as any).__capturedRequests.push({
        url,
        method,
        body: typeof body === "string" ? body : null,
        headers,
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

export async function openRequestByName(page: Page, requestName: string) {
  const row = page.locator("tr").filter({ hasText: requestName });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Open" }).click();
  await expect(page.getByRole("heading", { name: requestName })).toBeVisible();
}

export async function getCapturedRequests(
  page: Page,
): Promise<Array<{ url: string; method: string; body: string | null; headers: Record<string, string> }>> {
  return page.evaluate(() => (window as any).__capturedRequests ?? []);
}
