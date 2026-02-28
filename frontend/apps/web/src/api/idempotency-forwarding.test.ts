import { afterEach, describe, expect, it, vi } from "vitest";
import { AppApiClient } from "./client";

describe("AppApiClient idempotency forwarding", () => {
  const fetchMock = vi.fn();

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("forwards explicit idempotency key for repeated POST/PATCH calls", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            secretId: "sec-test",
            name: "secret",
            metadata: {},
            createdAt: "2026-02-28T00:00:00.000Z",
            updatedAt: "2026-02-28T00:00:00.000Z",
          }),
          { status: 201, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            requestId: "req-test",
            status: "fulfilled",
            updatedAt: "2026-02-28T00:00:00.000Z",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            requestId: "req-test",
            status: "fulfilled",
            updatedAt: "2026-02-28T00:00:01.000Z",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

    vi.stubGlobal("fetch", fetchMock);

    const client = new AppApiClient("http://example.test");
    const fixedKey = "fixed-idempotency-key";

    const createResult = await client.createSecret(
      {
        name: "secret",
        encryptedValue: "2.mock",
      },
      fixedKey,
    );
    const firstPatch = await client.updateRequest("req-test", { status: "fulfilled" }, fixedKey);
    const secondPatch = await client.updateRequest("req-test", { status: "fulfilled" }, fixedKey);

    expect(createResult.ok).toBe(true);
    expect(firstPatch.ok).toBe(true);
    expect(secondPatch.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(3);

    for (const call of fetchMock.mock.calls) {
      const requestInit = call[1] as RequestInit | undefined;
      const headers = (requestInit?.headers ?? {}) as Record<string, string>;
      expect(headers["Idempotency-Key"]).toBe(fixedKey);
    }
  });
});
