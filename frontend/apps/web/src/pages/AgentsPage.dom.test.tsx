import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { AgentsPage } from "./AgentsPage";

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

describe("AgentsPage component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders agent inventory and detail panel", () => {
    render(<AgentsPage />);

    expect(screen.getByText("Agents")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create Agent" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Identity state, key posture, and lease exposure stay available in one operational view.",
      ),
    ).toBeInTheDocument();
  });

  it("creates an agent in mocked mode and shows credentials", async () => {
    render(<AgentsPage />);

    await userEvent.click(screen.getByRole("button", { name: "Create Agent" }));
    await userEvent.type(screen.getByLabelText("Agent name"), "manual-bot");
    await userEvent.click(
      screen.getAllByRole("button", { name: "Create Agent" })[1],
    );

    expect(screen.getByText("Agent credentials")).toBeInTheDocument();
    expect(screen.getAllByText("manual-bot").length).toBeGreaterThan(0);
    expect(screen.getByText(/mock-app-token-/)).toBeInTheDocument();
  });
});
