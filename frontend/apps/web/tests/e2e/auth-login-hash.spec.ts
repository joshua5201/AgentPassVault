import { expect, test } from "@playwright/test";
import { getCapturedRequests, login, setupRequestCapture } from "./helpers";

test("mocked dev mode bypasses the login request", async ({ page }) => {
  await setupRequestCapture(page);
  await login(page);

  const requests = await getCapturedRequests(page);
  const loginRequest = requests.find((entry) =>
    entry.url.includes("/api/v1/auth/login/user") && entry.method.toUpperCase() === "POST",
  );

  expect(loginRequest).toBeUndefined();
});
