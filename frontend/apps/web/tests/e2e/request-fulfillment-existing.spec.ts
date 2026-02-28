import { expect, test } from "@playwright/test";
import { login, openRequestByName } from "./helpers";

test("fulfills request by mapping an existing secret and creating lease", async ({ page }) => {
  await login(page);
  await openRequestByName(page, "AWS Production Credentials");

  await page.getByLabel("Select Secret").selectOption({ label: "AWS Deploy Key" });
  await page.getByRole("button", { name: "Fulfill With Existing" }).click();

  await expect(page.getByText("Request fulfilled using existing secret.")).toBeVisible();
  await expect(page.getByText("fulfilled", { exact: true })).toBeVisible();
});
