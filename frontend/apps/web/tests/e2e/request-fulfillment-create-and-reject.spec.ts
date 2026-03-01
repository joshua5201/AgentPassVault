import { expect, test } from "@playwright/test";
import { login, openRequestByName } from "./helpers";

test("creates encrypted secret then fulfills request", async ({ page }) => {
  await login(page);
  await openRequestByName(page, "GCP Billing Service Account");

  await page.getByLabel("Secret Value (Plaintext)").fill("gcp-service-account-json");
  await page.getByRole("button", { name: "Encrypt + Create + Fulfill" }).click();

  await expect(page.getByText("Request fulfilled with new encrypted secret.")).toBeVisible();
  await expect(page.getByText("fulfilled", { exact: true })).toBeVisible();
});

test("rejects request with a reason", async ({ page }) => {
  await login(page);
  await openRequestByName(page, "AWS Production Credentials");

  await page.getByLabel("Rejection Reason").fill("Secret lifecycle policy blocks this request.");
  await page.getByRole("button", { name: "Reject Request" }).click();

  await expect(page.getByText("Request rejected.")).toBeVisible();
  await expect(page.getByText("rejected", { exact: true })).toBeVisible();
});
