import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RequestDetailPage } from "./RequestDetailPage";

const { appApiClientMock } = vi.hoisted(() => ({
  appApiClientMock: {
    getRequest: vi.fn(),
    listSecrets: vi.fn(),
  },
}));

vi.mock("../api/client", () => ({
  appApiClient: appApiClientMock,
}));

describe("RequestDetailPage component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appApiClientMock.listSecrets.mockResolvedValue({
      ok: true,
      data: [{ secretId: "sec-001", name: "AWS Deploy Key", metadata: {} }],
    });
  });

  it("renders request details with fulfillment link for pending requests", async () => {
    appApiClientMock.getRequest.mockResolvedValue({
      ok: true,
      data: {
        requestId: "req-aws-prod",
        agentId: "agent-ci-prod",
        status: "pending",
        type: "CREATE",
        name: "AWS Production Credentials",
        context: "Deployment pipeline needs updated credentials.",
        requiredMetadata: { service: { value: "aws" } },
        requiredFieldsInSecretValue: ["access_key", "secret_key"],
      },
    });

    render(
      <RequestDetailPage
        requestId="req-aws-prod"
        onBack={vi.fn()}
        isVaultLocked={false}
        masterKeys={null}
        onNotify={vi.fn()}
      />,
    );

    await screen.findByRole("heading", { name: "AWS Production Credentials" });
    const fulfillLink = screen.getByRole("link", { name: "Open Fulfillment Page" });
    expect(fulfillLink).toHaveAttribute("href", "#/fulfill/req-aws-prod");
  });

  it("shows closed message for fulfilled requests", async () => {
    appApiClientMock.getRequest.mockResolvedValue({
      ok: true,
      data: {
        requestId: "req-aws-prod",
        agentId: "agent-ci-prod",
        status: "fulfilled",
        type: "CREATE",
        name: "AWS Production Credentials",
        requiredMetadata: {},
        requiredFieldsInSecretValue: [],
      },
    });

    render(
      <RequestDetailPage
        requestId="req-aws-prod"
        onBack={vi.fn()}
        isVaultLocked={false}
        masterKeys={null}
        onNotify={vi.fn()}
      />,
    );

    await screen.findByRole("heading", { name: "AWS Production Credentials" });
    expect(screen.queryByRole("link", { name: "Open Fulfillment Page" })).not.toBeInTheDocument();
    expect(screen.getByText("This request is no longer actionable.")).toBeInTheDocument();
  });
});
