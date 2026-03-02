import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LoginPage } from "./LoginPage";

describe("LoginPage component", () => {
  it("submits username/password", async () => {
    const onLogin = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<LoginPage onLogin={onLogin} />);

    await user.type(screen.getByLabelText("Username"), "vault-admin+mock@agentpassvault.local");
    await user.type(screen.getByLabelText("Password"), "MockMasterPass!2026#LocalOnly");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(onLogin).toHaveBeenCalledWith(
      "vault-admin+mock@agentpassvault.local",
      "MockMasterPass!2026#LocalOnly",
    );
  });
});
