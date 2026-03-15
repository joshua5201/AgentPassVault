import { expect, test } from "@playwright/test";
import { login, openFulfillmentByName } from "./helpers";

test("fulfills request by mapping an existing secret and creating lease", async ({ page }) => {
  await login(page);
  await openFulfillmentByName(page, "AWS Production Credentials");

  await page.getByRole("button", { name: "Choose a secret" }).click();
  await page.getByLabel("Select Existing Secret Search").fill("AWS Deploy Key");
  await page.getByRole("button", { name: "AWS Deploy Key" }).click();
  await page.getByRole("button", { name: "Fulfill With Existing Secret" }).click();

  await expect(page.getByText("Request fulfilled using existing secret.")).toBeVisible();
  await expect(page.getByText("fulfilled", { exact: true })).toBeVisible();
});
