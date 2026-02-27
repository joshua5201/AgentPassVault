import { expect, test } from "@playwright/test";
import { getCapturedRequests, login, setupRequestCapture, TEST_PASSWORD } from "./helpers";

test("login sends derived hash, not raw password", async ({ page }) => {
  await setupRequestCapture(page);
  await login(page);

  const requests = await getCapturedRequests(page);
  const loginRequest = requests.find((entry) =>
    entry.url.includes("/api/v1/auth/login/user") && entry.method.toUpperCase() === "POST",
  );

  expect(loginRequest).toBeTruthy();
  expect(loginRequest?.body).toBeTruthy();

  const payload = JSON.parse(loginRequest!.body!);
  expect(payload.username).toBeDefined();
  expect(payload.password).toBeDefined();
  expect(payload.password).not.toBe(TEST_PASSWORD);
});
