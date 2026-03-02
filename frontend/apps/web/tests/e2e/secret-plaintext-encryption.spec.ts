import { expect, test } from "@playwright/test";
import { getCapturedRequests, login, setupRequestCapture } from "./helpers";

test("plaintext secret is encrypted before submit and hidden by default", async ({ page }) => {
  const plaintext = "super-plaintext-secret";

  await setupRequestCapture(page);
  await login(page);

  await page.getByRole("button", { name: "Secrets" }).click();
  await expect(page.getByRole("heading", { name: "Secrets" })).toBeVisible();

  await page.getByLabel("Name").fill("E2E Secret");
  await page.getByLabel("Secret Value (Plaintext)").fill(plaintext);
  await page.getByRole("button", { name: "Encrypt & Submit" }).click();

  await expect(page.getByText("Secret encrypted locally and submitted in mock mode.")).toBeVisible();

  const requests = await getCapturedRequests(page);
  const createSecretRequest = requests.find((entry) =>
    entry.url.includes("/api/v1/secrets") &&
    !entry.url.includes("/api/v1/secrets/") &&
    entry.method.toUpperCase() === "POST",
  );

  expect(createSecretRequest).toBeTruthy();
  const payload = JSON.parse(createSecretRequest!.body!);
  expect(payload.encryptedValue).toBeTruthy();
  expect(payload.encryptedValue.startsWith("2.")).toBe(true);
  expect(payload.encryptedValue.includes(plaintext)).toBe(false);

  const row = page.locator("tr").filter({ hasText: "E2E Secret" });
  await expect(row.getByText("••••••••••••")).toBeVisible();

  await row.getByRole("button", { name: "Show" }).click();
  await expect(row.getByText(plaintext)).toBeVisible();

  await row.getByRole("button", { name: "Hide" }).click();
  await expect(row.getByText("••••••••••••")).toBeVisible();
});
