import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import os from "os";

const CLI_PATH = path.resolve(__dirname, "../../dist/index.js");
const API_URL = process.env.TEST_API_URL || "http://localhost:58080";
const TEST_CONFIG_DIR = path.join(
  os.tmpdir(),
  `agentpassvault-test-config-${Date.now()}`,
);

function runCli(args: string[], input?: string) {
  const cmd = `node ${CLI_PATH} ${args.join(" ")}`;
  return execSync(cmd, {
    env: {
      ...process.env,
      HOME: TEST_CONFIG_DIR,
    },
    input: input,
    encoding: "utf-8",
  });
}

describe("AgentPassVault CLI E2E Scenarios", () => {
  const adminUsername = `test-admin-${Date.now()}@example.com`;
  const adminPassword = "password123";
  let tenantId: string;
  let agentId: string;
  let appToken: string;

  beforeAll(() => {
    if (fs.existsSync(TEST_CONFIG_DIR)) {
      fs.rmSync(TEST_CONFIG_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_CONFIG_DIR, { recursive: true });

    // 1. Admin Register
    console.log("Registering new tenant...");
    const registerOut = runCli([
      "admin",
      "register",
      "--api-url",
      API_URL,
      "--username",
      adminUsername,
      "--password",
      adminPassword,
      "--display-name",
      "Test Admin",
    ]);
    const registerJson = JSON.parse(registerOut);
    tenantId = registerJson.tenantId;

    // 3. Create Agent
    console.log("Creating agent...");
    const createAgentOut = runCli(["admin", "agent", "create", "test-agent"]);
    const createAgentJson = JSON.parse(createAgentOut);
    appToken = createAgentJson.appToken;
    agentId = createAgentJson.agentId;

    // 4. Agent Init (using new one-shot command)
    console.log("Initializing agent...");
    const initOut = runCli([
      "identity",
      "init",
      "-v",
      "--api-url",
      API_URL,
      "--tenant-id",
      tenantId,
      "--agent-id",
      agentId,
      "--app-token",
      appToken,
    ]);
    const initJson = JSON.parse(initOut);
    expect(initJson.message).toContain("Agent initialization complete");
  });

  afterAll(() => {
    console.log("Cleaning up tenant...");
    try {
      if (tenantId) {
        runCli(["admin", "delete-tenant", tenantId]);
      }
    } catch (e) {
      console.error("Cleanup failed (maybe already deleted):", e);
    }
    if (fs.existsSync(TEST_CONFIG_DIR)) {
      fs.rmSync(TEST_CONFIG_DIR, { recursive: true, force: true });
    }
  });

  it("Scenario 1: Full Missing Secret Flow (Create and Lease)", async () => {
    console.log("[Scenario 1] Requesting new secret...");
    const requestOut = runCli([
      "request-secret",
      "S1-Secret",
      "--context",
      "Scenario 1 context",
    ]);
    const requestJson = JSON.parse(requestOut);
    const requestId = requestJson.requestId;

    console.log("[Scenario 1] Fulfilling request with new value...");
    runCli([
      "admin",
      "request",
      "fulfill",
      requestId,
      "--value",
      "s1-plain-value",
      "--password",
      adminPassword,
    ]);

    const statusOut = runCli(["get-request", requestId]);
    const statusJson = JSON.parse(statusOut);
    const secretId = statusJson.mappedSecretId;

    console.log("[Scenario 1] Verifying agent can retrieve secret...");
    const finalSecretOut = runCli(["get-secret", secretId]);
    const finalSecretJson = JSON.parse(finalSecretOut);
    expect(finalSecretJson.value).toBe("s1-plain-value");
    expect(finalSecretJson.name).toBe("S1-Secret");
  });

  it("Scenario 2: Update secret value should invalidate existing leases", async () => {
    console.log("[Scenario 2] Admin creates a secret and leases it...");
    // Non-interactive creation
    runCli([
      "admin",
      "secret",
      "create",
      "--name",
      "S2-Secret",
      "--username",
      "user2",
      "--secret-password",
      "pass2",
      "--password",
      adminPassword,
    ]);

    const listOut = runCli(["admin", "secret", "list"]);
    const secrets = JSON.parse(listOut);
    const secret = secrets.find((s: any) => s.name === "S2-Secret");
    const secretId = secret.secretId;

    // Manually lease it to agent
    console.log("[Scenario 2] Manually leasing to agent...");
    const requestOut = runCli(["request-secret", "S2-Secret-Req"]);
    const requestJson = JSON.parse(requestOut);
    const requestId = requestJson.requestId;
    runCli([
      "admin",
      "request",
      "fulfill",
      requestId,
      "--secret-id",
      secretId,
      "--password",
      adminPassword,
    ]);

    // Verify retrieval works

    console.log("[Scenario 2] Verifying initial retrieval...");

    const retrievalOut = runCli(["get-secret", secretId]);
    const retrievalJson = JSON.parse(retrievalOut);
    const secretValue = JSON.parse(retrievalJson.value);

    expect(secretValue.username).toBe("user2");

    expect(secretValue.password).toBe("pass2");

    // Admin updates secret value

    console.log(
      "[Scenario 2] Admin updates secret value (should invalidate lease)...",
    );

    runCli(
      ["admin", "secret", "update", secretId, "--value", "s2-updated-value"],
      `${adminPassword}\n`,
    );

    // Verify retrieval FAILS now because lease was deleted on server when value changed

    console.log("[Scenario 2] Verifying retrieval fails after update...");

    try {
      runCli(["get-secret", secretId]);

      expect.fail(
        "Should have failed to retrieve secret after update because lease was invalidated",
      );
    } catch (error: any) {
      const errorJson = JSON.parse(error.stderr);
      expect(errorJson.message).toContain("No valid lease found");
    }
  });

  it("Scenario 3: Map request to another existing secret", async () => {
    console.log("[Scenario 3] Admin creates an independent secret...");

    runCli([
      "admin",
      "secret",
      "create",
      "--name",
      "S3-Existing-Secret",
      "--username",
      "user3",
      "--secret-password",
      "pass3",
      "--password",
      adminPassword,
    ]);

    const listOut = runCli(["admin", "secret", "list"]);
    const secrets = JSON.parse(listOut);
    const secret = secrets.find((s: any) => s.name === "S3-Existing-Secret");
    const secretId = secret.secretId;

    console.log("[Scenario 3] Agent requests a DIFFERENT secret...");

    const requestOut = runCli(["request-secret", "S3-New-Request"]);
    const requestJson = JSON.parse(requestOut);
    const requestId = requestJson.requestId;

    console.log(
      "[Scenario 3] Admin fulfills request by mapping to pre-existing secret...",
    );

    runCli(
      ["admin", "request", "fulfill", requestId, "--secret-id", secretId],
      `${adminPassword}\n`,
    );

    console.log(
      "[Scenario 3] Verifying agent can retrieve the mapped secret...",
    );

    const finalSecretOut = runCli(["get-secret", secretId]);
    const finalSecretJson = JSON.parse(finalSecretOut);
    const secretValue = JSON.parse(finalSecretJson.value);

    expect(secretValue.username).toBe("user3");

    expect(secretValue.password).toBe("pass3");
  });
});
