import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RequestDetailPage } from "./RequestDetailPage";

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

describe("RequestDetailPage component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appApiClientMock.getRequest.mockResolvedValue({
      ok: true,
      data: {
        requestId: "req-aws-prod",
        agentId: "agent-ci-prod",
        status: "pending",
        name: "AWS Production Credentials",
        context: "Deployment pipeline needs updated credentials.",
        requiredMetadata: { service: { value: "aws" } },
        requiredFieldsInSecretValue: ["access_key", "secret_key"],
      },
    });
    appApiClientMock.listSecrets.mockResolvedValue({
      ok: true,
      data: [{ secretId: "sec-001", name: "AWS Deploy Key", metadata: {} }],
    });
    appApiClientMock.createLease.mockResolvedValue({ ok: true, data: undefined });
    appApiClientMock.updateRequest.mockResolvedValue({
      ok: true,
      data: { requestId: "req-aws-prod", status: "fulfilled", name: "AWS Production Credentials" },
    });
  });

  it("fulfills with existing secret and emits success notification", async () => {
    const onNotify = vi.fn();
    const user = userEvent.setup();

    render(
      <RequestDetailPage
        requestId="req-aws-prod"
        onBack={vi.fn()}
        isVaultLocked={false}
        masterKeys={null}
        onNotify={onNotify}
      />,
    );

    await screen.findByRole("heading", { name: "AWS Production Credentials" });
    await user.selectOptions(screen.getByLabelText("Select Secret"), "sec-001");
    await user.click(screen.getByRole("button", { name: "Fulfill With Existing" }));

    await waitFor(() => {
      expect(appApiClientMock.createLease).toHaveBeenCalledTimes(1);
      expect(appApiClientMock.updateRequest).toHaveBeenCalledTimes(1);
    });
    expect(onNotify).toHaveBeenCalledWith("Request fulfilled using existing secret.", "success");
  });

  it("validates rejection reason length", async () => {
    const onNotify = vi.fn();
    const user = userEvent.setup();

    render(
      <RequestDetailPage
        requestId="req-aws-prod"
        onBack={vi.fn()}
        isVaultLocked={false}
        masterKeys={null}
        onNotify={onNotify}
      />,
    );

    await screen.findByRole("heading", { name: "AWS Production Credentials" });
    await user.type(screen.getAllByLabelText("Rejection Reason")[0], "no");
    await user.click(screen.getByRole("button", { name: "Reject Request" }));

    expect(onNotify).toHaveBeenCalledWith("Provide a rejection reason with at least 3 characters.", "error");
  });
});
