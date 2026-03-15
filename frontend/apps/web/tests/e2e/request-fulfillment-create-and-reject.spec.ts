import { expect, test } from "@playwright/test";
import { login, openFulfillmentByName } from "./helpers";

test("creates encrypted secret then fulfills request", async ({ page }) => {
  await login(page);
  await openFulfillmentByName(page, "AWS Production Credentials");

  await page.getByRole("button", { name: "Create New" }).click();
  await page.getByLabel("Secret Value (Plaintext)").fill("gcp-service-account-json");
  await page.getByRole("button", { name: "Create Secret & Fulfill" }).click();

  await expect(page.getByText("Request fulfilled with new encrypted secret.")).toBeVisible();
  await expect(page.getByText("fulfilled", { exact: true })).toBeVisible();
});

test("approves lease request", async ({ page }) => {
  await login(page);
  await openFulfillmentByName(page, "GCP Billing Service Account");

  await page.getByRole("button", { name: "Approve Lease" }).click();

  await expect(page.getByText("Lease request approved.")).toBeVisible();
  await expect(page.getByText("fulfilled", { exact: true })).toBeVisible();
});
