import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("integration backend smoke: login and load core pages", async ({ page }) => {
  test.skip(process.env.PW_API_MOCKING !== "false", "Integration smoke runs only when PW_API_MOCKING=false");

  await login(page);
  await expect(
    page
      .getByRole("heading", { name: "Pending Requests" })
      .or(page.getByRole("heading", { name: "No matching requests" })),
  ).toBeVisible();

  await page.getByRole("button", { name: "Secrets" }).click();
  await expect(page.getByRole("heading", { name: "Secrets" })).toBeVisible();
});
