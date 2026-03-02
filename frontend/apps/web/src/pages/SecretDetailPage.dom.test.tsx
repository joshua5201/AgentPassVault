import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SecretDetailPage } from "./SecretDetailPage";

const { appApiClientMock, decryptSymmetricMock } = vi.hoisted(() => ({
  appApiClientMock: {
    getSecret: vi.fn(),
  },
  decryptSymmetricMock: vi.fn(),
}));

vi.mock("@agentpassvault/sdk", async () => {
  const actual = await vi.importActual<typeof import("@agentpassvault/sdk")>("@agentpassvault/sdk");
  return {
    ...actual,
    CryptoService: {
      ...actual.CryptoService,
      decryptSymmetric: decryptSymmetricMock,
    },
  };
});

vi.mock("../api/client", () => ({
  appApiClient: appApiClientMock,
}));

describe("SecretDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps value hidden by default and reveals on click", async () => {
    appApiClientMock.getSecret.mockResolvedValueOnce({
      ok: true,
      data: {
        secretId: "sec-001",
        name: "AWS Deploy Key",
        encryptedValue: "encrypted-value",
        metadata: {},
      },
    });
    decryptSymmetricMock.mockResolvedValueOnce("decrypted-secret");

    render(
      <SecretDetailPage
        secretId="sec-001"
        isVaultLocked={false}
        masterKeys={{ encKey: {} as CryptoKey, macKey: {} as CryptoKey }}
        onBack={vi.fn()}
      />,
    );

    await screen.findByText("AWS Deploy Key");
    expect(screen.getByText("••••••••••••••••")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Show" }));
    expect(await screen.findByText("decrypted-secret")).toBeInTheDocument();
  });
});
