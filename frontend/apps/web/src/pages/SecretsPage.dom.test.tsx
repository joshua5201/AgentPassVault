import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SecretsPage } from "./SecretsPage";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

const { appApiClientMock } = vi.hoisted(() => ({
  appApiClientMock: {
    listSecrets: vi.fn(),
    createSecret: vi.fn(),
  },
}));

vi.mock("../api/client", () => ({
  appApiClient: appApiClientMock,
}));

describe("SecretsPage component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates the UI when secrets query resolves", async () => {
    const pending = deferred<{ ok: true; data: Array<{ secretId: string; name: string; createdAt: string }> }>();
    appApiClientMock.listSecrets.mockReturnValueOnce(pending.promise);

    render(<SecretsPage isVaultLocked={true} masterKeys={null} />);

    expect(screen.getByText("Loading secrets...")).toBeInTheDocument();

    pending.resolve({
      ok: true,
      data: [
        {
          secretId: "sec-prod-db",
          name: "Production DB Credentials",
          createdAt: "2026-03-02T11:12:13.000Z",
        },
      ],
    });

    await waitFor(() => {
      expect(screen.getByText("Production DB Credentials")).toBeInTheDocument();
    });

    expect(screen.queryByText("Loading secrets...")).not.toBeInTheDocument();
  });

  it("shows an error toast when response mapping throws unexpectedly", async () => {
    const invalidSecret = {
      secretId: "sec-bad",
      get name() {
        throw new Error("boom");
      },
      createdAt: "2026-03-02T11:12:13.000Z",
    };

    appApiClientMock.listSecrets.mockResolvedValueOnce({
      ok: true,
      data: [invalidSecret],
    });

    render(<SecretsPage isVaultLocked={true} masterKeys={null} />);

    await waitFor(() => {
      expect(screen.getByText("Load secrets failed: boom")).toBeInTheDocument();
    });
  });
});
