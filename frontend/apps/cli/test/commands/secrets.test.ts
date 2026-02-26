import fs from "node:fs/promises";
import { beforeEach, describe, expect, it, vi } from "vitest";

const searchSecretsMock = vi.fn();
const agentLoginMock = vi.fn().mockResolvedValue({ accessToken: "token" });
const setAccessTokenMock = vi.fn();

vi.mock("@agentpassvault/sdk", () => ({
  VaultClient: class {
    constructor(_apiUrl: string) {}
    agentLogin = agentLoginMock;
    setAccessToken = setAccessTokenMock;
    searchSecrets = searchSecretsMock;
  },
}));

const loadConfigMock = vi.fn().mockResolvedValue({
  apiUrl: "http://localhost:8080",
  tenantId: "tenant-1",
  appToken: "token-1",
});

vi.mock("../../src/config.js", () => ({
  loadConfig: loadConfigMock,
  getPrivateKeyPath: vi.fn(),
}));

const handleErrorMock = vi.fn();
vi.mock("../../src/utils/error-handler.js", () => ({
  handleError: handleErrorMock,
}));

vi.mock("../../src/utils/output.js", () => ({
  printOutput: vi.fn(),
  logMessage: vi.fn(),
}));

vi.mock("node:fs/promises", () => ({
  default: {
    readFile: vi.fn(),
  },
}));

async function loadSearchSecrets() {
  const mod = await import("../../src/commands/secrets.js");
  return mod.searchSecrets;
}

describe("searchSecrets", () => {
  beforeEach(() => {
    vi.resetModules();
    searchSecretsMock.mockReset();
    agentLoginMock.mockClear();
    setAccessTokenMock.mockClear();
    handleErrorMock.mockClear();
    loadConfigMock.mockClear();
    const readFileMock = fs.readFile as unknown as { mockReset: () => void };
    readFileMock.mockReset();
  });

  it("allows searching by name and metadata JSON together", async () => {
    const searchSecrets = await loadSearchSecrets();
    searchSecretsMock.mockResolvedValue([]);

    await searchSecrets({
      name: "S1",
      metadataJson: "{\"env\":\"prod\"}",
    });

    expect(searchSecretsMock).toHaveBeenCalledWith({
      name: "S1",
      metadata: { env: "prod" },
    });
    expect(handleErrorMock).not.toHaveBeenCalled();
  });

  it("allows searching by name and metadata from file", async () => {
    const searchSecrets = await loadSearchSecrets();
    searchSecretsMock.mockResolvedValue([]);
    const readFileMock = fs.readFile as unknown as {
      mockResolvedValue: (v: string) => void;
    };
    readFileMock.mockResolvedValue("{\"env\":\"prod\",\"app\":\"web\"}");

    await searchSecrets({
      name: "S2",
      fromFile: "metadata.json",
    });

    expect(searchSecretsMock).toHaveBeenCalledWith({
      name: "S2",
      metadata: { env: "prod", app: "web" },
    });
    expect(handleErrorMock).not.toHaveBeenCalled();
  });

  it("rejects using both metadata sources", async () => {
    const searchSecrets = await loadSearchSecrets();

    await searchSecrets({
      metadataJson: "{\"env\":\"prod\"}",
      fromFile: "metadata.json",
    });

    expect(handleErrorMock).toHaveBeenCalledTimes(1);
    expect(searchSecretsMock).not.toHaveBeenCalled();
  });

  it("errors when no criteria provided", async () => {
    const searchSecrets = await loadSearchSecrets();

    await searchSecrets({});

    expect(handleErrorMock).toHaveBeenCalledTimes(1);
    expect(searchSecretsMock).not.toHaveBeenCalled();
  });
});
