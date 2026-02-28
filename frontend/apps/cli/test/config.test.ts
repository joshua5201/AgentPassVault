import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalEnv = process.env.AGENTPASSVAULT_CONFIG_PATH;

async function loadConfigModule() {
  return import("../src/config.js");
}

describe("config path override", () => {
  let tmpDir: string;

  beforeEach(async () => {
    vi.resetModules();
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "apv-cli-config-"));
    process.env.AGENTPASSVAULT_CONFIG_PATH = tmpDir;
  });

  afterEach(async () => {
    if (originalEnv === undefined) {
      delete process.env.AGENTPASSVAULT_CONFIG_PATH;
    } else {
      process.env.AGENTPASSVAULT_CONFIG_PATH = originalEnv;
    }
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("loads config.json from AGENTPASSVAULT_CONFIG_PATH directory", async () => {
    const { saveConfig, loadConfig } = await loadConfigModule();

    await saveConfig({
      apiUrl: "http://localhost:8080",
      tenantId: "tenant-1",
      appToken: "token-1",
    });

    const loaded = await loadConfig();

    expect(loaded?.apiUrl).toBe("http://localhost:8080");
    expect(loaded?.tenantId).toBe("tenant-1");
    expect(loaded?.appToken).toBe("token-1");

    const configPath = path.join(tmpDir, "config.json");
    const content = await fs.readFile(configPath, "utf-8");
    expect(content).toContain("tenant-1");
  });

  it("writes keys under AGENTPASSVAULT_CONFIG_PATH/keys", async () => {
    const { ensureConfigDir, getPrivateKeyPath, getPublicKeyPath } =
      await loadConfigModule();

    await ensureConfigDir();

    expect(await getPrivateKeyPath()).toBe(path.join(tmpDir, "keys", "agent.priv"));
    expect(await getPublicKeyPath()).toBe(path.join(tmpDir, "keys", "agent.pub"));
  });
});
