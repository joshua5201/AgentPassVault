import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FulfillmentPage } from "./FulfillmentPage";

const { appApiClientMock, secretCryptoAdapterMock } = vi.hoisted(() => ({
  appApiClientMock: {
    getRequest: vi.fn(),
    listSecrets: vi.fn(),
    getAgent: vi.fn(),
    getSecret: vi.fn(),
    createLease: vi.fn(),
    updateRequest: vi.fn(),
    createSecret: vi.fn(),
  },
  secretCryptoAdapterMock: {
    encryptPlaintextSecret: vi.fn(),
    decryptSecret: vi.fn(),
    encryptForAgent: vi.fn(),
  },
}));

vi.mock("../api/client", () => ({
  appApiClient: appApiClientMock,
}));

vi.mock("../security", () => ({
  SecretCryptoAdapter: secretCryptoAdapterMock,
}));

describe("FulfillmentPage component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows login when no authenticated session exists", () => {
    render(
      <FulfillmentPage
        requestId="req-lease"
        isAuthenticated={false}
        adminName="Admin"
        isVaultLocked={true}
        masterKeys={null}
        onLogin={vi.fn()}
        onUnlock={vi.fn()}
        onLogout={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "Admin Login" })).toBeInTheDocument();
  });

  it("shows unlock prompt for authenticated lease request when master key is missing", async () => {
    appApiClientMock.getRequest.mockResolvedValue({
      ok: true,
      data: {
        requestId: "req-lease",
        agentId: "agent-1",
        status: "pending",
        type: "LEASE",
        name: "Lease Approval",
        secretId: "sec-001",
      },
    });

    render(
      <FulfillmentPage
        requestId="req-lease"
        isAuthenticated={true}
        adminName="Admin"
        isVaultLocked={true}
        masterKeys={null}
        onLogin={vi.fn()}
        onUnlock={vi.fn()}
        onLogout={vi.fn()}
      />,
    );

    await screen.findByRole("heading", { name: "Lease Approval" });
    expect(screen.getByRole("heading", { name: "Vault Locked" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Approve Lease" })).toBeDisabled();
  });

  it("creates lease and then updates request when approving a lease request", async () => {
    appApiClientMock.getRequest.mockResolvedValue({
      ok: true,
      data: {
        requestId: "req-lease",
        agentId: "agent-1",
        status: "pending",
        type: "LEASE",
        name: "Lease Approval",
        secretId: "sec-001",
      },
    });
    appApiClientMock.getSecret.mockResolvedValue({
      ok: true,
      data: {
        encryptedValue: "ciphertext-secret",
      },
    });
    appApiClientMock.getAgent.mockResolvedValue({
      ok: true,
      data: {
        agentId: "agent-1",
        publicKey: "agent-public-key",
      },
    });
    secretCryptoAdapterMock.decryptSecret.mockResolvedValue("plaintext-secret");
    secretCryptoAdapterMock.encryptForAgent.mockResolvedValue("agent-ciphertext");
    appApiClientMock.createLease.mockResolvedValue({ ok: true, data: undefined });
    appApiClientMock.updateRequest.mockResolvedValue({
      ok: true,
      data: {
        requestId: "req-lease",
        status: "fulfilled",
      },
    });

    render(
      <FulfillmentPage
        requestId="req-lease"
        isAuthenticated={true}
        adminName="Admin"
        isVaultLocked={false}
        masterKeys={{} as never}
        onLogin={vi.fn()}
        onUnlock={vi.fn()}
        onLogout={vi.fn()}
      />,
    );

    await screen.findByRole("heading", { name: "Lease Approval" });
    screen.getByRole("button", { name: "Approve Lease" }).click();

    await waitFor(() => {
      expect(appApiClientMock.createLease).toHaveBeenCalledWith(
        "sec-001",
        expect.objectContaining({
          agentId: "agent-1",
          publicKey: "agent-public-key",
          encryptedData: "agent-ciphertext",
        }),
      );
      expect(appApiClientMock.updateRequest).toHaveBeenCalledWith("req-lease", {
        status: "fulfilled",
        secretId: "sec-001",
      });
    });

    const createLeaseOrder = appApiClientMock.createLease.mock.invocationCallOrder[0];
    const updateRequestOrder = appApiClientMock.updateRequest.mock.invocationCallOrder[0];
    expect(createLeaseOrder).toBeLessThan(updateRequestOrder);
  });

  it("does not update request when lease creation fails", async () => {
    appApiClientMock.getRequest.mockResolvedValue({
      ok: true,
      data: {
        requestId: "req-lease",
        agentId: "agent-1",
        status: "pending",
        type: "LEASE",
        name: "Lease Approval",
        secretId: "sec-001",
      },
    });
    appApiClientMock.getSecret.mockResolvedValue({
      ok: true,
      data: {
        encryptedValue: "ciphertext-secret",
      },
    });
    appApiClientMock.getAgent.mockResolvedValue({
      ok: true,
      data: {
        agentId: "agent-1",
        publicKey: "agent-public-key",
      },
    });
    secretCryptoAdapterMock.decryptSecret.mockResolvedValue("plaintext-secret");
    secretCryptoAdapterMock.encryptForAgent.mockResolvedValue("agent-ciphertext");
    appApiClientMock.createLease.mockResolvedValue({
      ok: false,
      error: { message: "lease-failed" },
    });

    render(
      <FulfillmentPage
        requestId="req-lease"
        isAuthenticated={true}
        adminName="Admin"
        isVaultLocked={false}
        masterKeys={{} as never}
        onLogin={vi.fn()}
        onUnlock={vi.fn()}
        onLogout={vi.fn()}
      />,
    );

    await screen.findByRole("heading", { name: "Lease Approval" });
    screen.getByRole("button", { name: "Approve Lease" }).click();

    await screen.findByText("Lease creation failed: lease-failed");
    expect(appApiClientMock.updateRequest).not.toHaveBeenCalled();
  });
});
