import { expect, test } from "@playwright/test";
import { getCapturedRequests, login, openFulfillmentByName, setupRequestCapture } from "./helpers";

function readIdempotencyHeader(headers: Record<string, string>): string | undefined {
  return (
    headers["Idempotency-Key"] ??
    headers["idempotency-key"] ??
    headers["IDEMPOTENCY-KEY"]
  );
}

test("POST/PATCH include idempotency key and fulfillment posts lease before request update", async ({ page }) => {
  await setupRequestCapture(page);
  await login(page);

  await page.getByRole("button", { name: "Secrets" }).click();
  await page.getByLabel("Name").fill("Idempotency Secret");
  await page.getByLabel("Secret Value (Plaintext)").fill("idempotency-secret-value");
  await page.getByRole("button", { name: "Encrypt & Submit" }).click();
  await expect(page.getByText("Secret encrypted locally and submitted successfully.")).toBeVisible();

  await page.getByRole("button", { name: "Requests" }).click();
  await openFulfillmentByName(page, "AWS Production Credentials");
  await page.getByRole("button", { name: "Choose a secret" }).click();
  await page.getByLabel("Select Existing Secret Search").fill("AWS Deploy Key");
  await page.getByRole("button", { name: "AWS Deploy Key" }).click();
  await page.getByRole("button", { name: "Fulfill With Existing Secret" }).click();
  await expect(page.getByText("Request fulfilled using existing secret.")).toBeVisible();

  const requests = await getCapturedRequests(page);
  const postSecrets = requests.find(
    (entry) =>
      entry.url.includes("/api/v1/secrets") &&
      entry.method.toUpperCase() === "POST" &&
      !entry.url.includes("/api/v1/secrets/"),
  );
  const patchRequest = requests.find(
    (entry) =>
      entry.url.includes("/api/v1/requests/") &&
      entry.method.toUpperCase() === "PATCH",
  );
  const leaseRequest = requests.find(
    (entry) =>
      entry.url.includes("/api/v1/secrets/") &&
      entry.url.includes("/leases") &&
      entry.method.toUpperCase() === "POST",
  );
  const leaseRequestIndex = requests.findIndex(
    (entry) =>
      entry.url.includes("/api/v1/secrets/") &&
      entry.url.includes("/leases") &&
      entry.method.toUpperCase() === "POST",
  );
  const patchRequestIndex = requests.findIndex(
    (entry) =>
      entry.url.includes("/api/v1/requests/") &&
      entry.method.toUpperCase() === "PATCH",
  );

  expect(postSecrets).toBeTruthy();
  expect(patchRequest).toBeTruthy();
  expect(leaseRequest).toBeTruthy();
  expect(readIdempotencyHeader(postSecrets!.headers)).toBeTruthy();
  expect(readIdempotencyHeader(patchRequest!.headers)).toBeTruthy();
  expect(readIdempotencyHeader(leaseRequest!.headers)).toBeTruthy();
  expect(leaseRequestIndex).toBeGreaterThanOrEqual(0);
  expect(patchRequestIndex).toBeGreaterThanOrEqual(0);
  expect(leaseRequestIndex).toBeLessThan(patchRequestIndex);

  const leasePayload = JSON.parse(leaseRequest!.body ?? "{}");
  expect(leasePayload.agentId).toBeTruthy();
  expect(leasePayload.publicKey).toBeTruthy();
  expect(leasePayload.publicKey).not.toBe("mock-agent-public-key");
  expect(leasePayload.encryptedData).toBeTruthy();
  expect(leasePayload.encryptedData).not.toBe("mock-encrypted-lease-payload");
});
