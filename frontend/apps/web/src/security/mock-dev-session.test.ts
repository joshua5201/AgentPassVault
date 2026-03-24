import { describe, expect, it } from "vitest";
import { MOCK_DEV_PASSWORD, MOCK_DEV_USERNAME, createMockDevSession } from "./mock-dev-session";

describe("mock dev session", () => {
  it("derives a stable mock auth session", async () => {
    const session = await createMockDevSession();

    expect(session.username).toBe(MOCK_DEV_USERNAME);
    expect(session.loginResponse.accessToken).toBe("mock-access-token");
    expect(session.loginResponse.refreshToken).toBe("mock-refresh-token");
    expect(session.loginHash).not.toBe(MOCK_DEV_PASSWORD);
    expect(session.masterKeys).toBeDefined();
  });
});
