import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { SecretsPage } from "./SecretsPage";

vi.mock("../config/env", () => ({
  readAppEnv: () => ({
    apiUrl: "https://localhost:5173",
    configuredApiUrl: null,
    apiMockingEnabled: true,
    apiClientFallbackEnabled: false,
    apiProxyEnabled: false,
    erudaEnabled: false,
  }),
}));

describe("SecretsPage component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the lo-fi secret catalog and detail panel", async () => {
    render(
      <SecretsPage
        isVaultLocked={false}
        masterKeys={{} as never}
      />,
    );

    expect(screen.getByText("Secrets")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create Secret" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("AWS Deploy Key")).toHaveLength(2);
    expect(screen.getByText("Value preview")).toBeInTheDocument();
  });

  it("blocks quick reveal when the vault is locked", async () => {
    render(
      <SecretsPage
        isVaultLocked={true}
        masterKeys={null}
      />,
    );

    await userEvent.click(screen.getAllByRole("button", { name: "Reveal" })[0]);

    expect(
      screen.getByText(
        "Vault is locked. Unlock before revealing secret values.",
      ),
    ).toBeInTheDocument();
  });

  it("reveals the secret value inline when unlocked", async () => {
    render(
      <SecretsPage
        isVaultLocked={false}
        masterKeys={{} as never}
      />,
    );

    await userEvent.click(screen.getAllByRole("button", { name: "Reveal" })[0]);

    expect(screen.getAllByText(/AKIA\.\.\.F5M0/)).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: "Hide value" }),
    ).toBeInTheDocument();
  });

  it("creates a secret in mocked mode", async () => {
    render(
      <SecretsPage
        isVaultLocked={false}
        masterKeys={{} as never}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Create Secret" }),
    );
    await userEvent.type(screen.getByLabelText("Secret name"), "Manual Secret");
    await userEvent.type(
      screen.getByLabelText("Plaintext secret value"),
      "super-secret-value",
    );
    const metadataField = screen.getAllByRole("textbox")[3];
    fireEvent.change(metadataField, {
      target: {
        value: '{"service":"manual","environment":"prod","owner":"Ops"}',
      },
    });

    await userEvent.click(
      screen.getAllByRole("button", { name: "Create Secret" })[1],
    );

    expect(screen.getAllByText("Manual Secret")).toHaveLength(2);
    expect(screen.getByText("Secret created.")).toBeInTheDocument();
  });
});
