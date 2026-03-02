import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FulfillmentPage } from "./FulfillmentPage";

const { appApiClientMock } = vi.hoisted(() => ({
  appApiClientMock: {
    getRequest: vi.fn(),
    listSecrets: vi.fn(),
    createLease: vi.fn(),
    updateRequest: vi.fn(),
    createSecret: vi.fn(),
  },
}));

vi.mock("../api/client", () => ({
  appApiClient: appApiClientMock,
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
});
