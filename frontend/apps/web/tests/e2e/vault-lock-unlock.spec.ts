import { expect, test } from "@playwright/test";
import { login, TEST_PASSWORD } from "./helpers";

test("manual lock requires unlock password and restores session", async ({ page }) => {
  await login(page);

  await page.getByRole("button", { name: "Lock Vault" }).click();
  await expect(page.getByRole("heading", { name: "Vault Locked" })).toBeVisible();

  await page.getByLabel("Master Password").fill("wrong-password");
  await page.getByRole("button", { name: "Unlock Vault" }).click();
  await expect(page.getByText("Invalid master password.")).toBeVisible();

  await page.getByLabel("Master Password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Unlock Vault" }).click();

  await expect(page.getByRole("heading", { name: "Pending Requests" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Vault Locked" })).not.toBeVisible();
});
