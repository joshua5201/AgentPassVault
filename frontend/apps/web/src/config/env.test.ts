import { describe, expect, it } from "vitest";
import { readAppEnv, readStartupConfigError } from "./env";

describe("env config", () => {
  it("uses AGENTPASSVAULT_API_URL as canonical API URL source", () => {
    const env = readAppEnv({
      DEV: false,
      AGENTPASSVAULT_API_URL: "https://api-staging.agentpassvault.com",
      VITE_API_URL: "https://api-should-not-win.example.com",
    });

    expect(env.configuredApiUrl).toBe("https://api-staging.agentpassvault.com");
    expect(env.apiUrl).toBe("https://api-staging.agentpassvault.com");
  });

  it("fails fast when production startup is missing API URL", () => {
    const error = readStartupConfigError({
      DEV: false,
      VITE_API_MOCKING: "false",
      VITE_API_PROXY: "false",
      VITE_API_CLIENT_FALLBACK: "false",
    });

    expect(error).toContain("Missing API endpoint configuration");
    expect(error).toContain("AGENTPASSVAULT_API_URL");
  });

  it("fails fast when production startup URL is invalid", () => {
    const error = readStartupConfigError({
      DEV: false,
      AGENTPASSVAULT_API_URL: "not-a-url",
      VITE_API_MOCKING: "false",
      VITE_API_PROXY: "false",
    });

    expect(error).toContain("Invalid API endpoint configuration");
  });

  it("does not fail when dev mocking is enabled without API URL", () => {
    const error = readStartupConfigError({
      DEV: true,
      VITE_API_MOCKING: "true",
      VITE_API_PROXY: "false",
    });

    expect(error).toBeNull();
  });
});
