import { beforeEach, describe, expect, it, vi } from "vitest";

const getRequestMock = vi.fn();
const getAgentMock = vi.fn();
const getSecretMock = vi.fn();
const createLeaseMock = vi.fn();
const updateRequestMock = vi.fn();
const setAccessTokenMock = vi.fn();

const deriveMasterKeysMock = vi.fn();
const decryptSecretMock = vi.fn();
const importPublicKeyMock = vi.fn();
const encryptAsymmetricMock = vi.fn();

vi.mock("@agentpassvault/sdk", () => ({
  VaultClient: class {
    constructor(_apiUrl: string) {}
    setAccessToken = setAccessTokenMock;
    getRequest = getRequestMock;
    getAgent = getAgentMock;
    getSecret = getSecretMock;
    createLease = createLeaseMock;
    updateRequest = updateRequestMock;
  },
  MasterKeyService: {
    deriveMasterKeys: deriveMasterKeysMock,
  },
  SecretService: {
    decryptSecret: decryptSecretMock,
  },
  LeaseService: {},
  CryptoService: {
    importPublicKey: importPublicKeyMock,
    encryptAsymmetric: encryptAsymmetricMock,
  },
}));

const loadConfigMock = vi.fn().mockResolvedValue({
  apiUrl: "http://localhost:8080",
  adminToken: "admin-token",
  adminUsername: "admin@example.com",
});

vi.mock("../../src/config.js", () => ({
  loadConfig: loadConfigMock,
  saveConfig: vi.fn(),
  ensureConfigDir: vi.fn(),
}));

const handleErrorMock = vi.fn();
vi.mock("../../src/utils/error-handler.js", () => ({
  handleError: handleErrorMock,
}));

vi.mock("../../src/utils/output.js", () => ({
  printOutput: vi.fn(),
  logMessage: vi.fn(),
}));

async function loadAdminFulfillRequest() {
  const mod = await import("../../src/commands/admin.js");
  return mod.adminFulfillRequest;
}

describe("adminFulfillRequest", () => {
  beforeEach(() => {
    vi.resetModules();
    getRequestMock.mockReset();
    getAgentMock.mockReset();
    getSecretMock.mockReset();
    createLeaseMock.mockReset();
    updateRequestMock.mockReset();
    setAccessTokenMock.mockReset();
    deriveMasterKeysMock.mockReset();
    decryptSecretMock.mockReset();
    importPublicKeyMock.mockReset();
    encryptAsymmetricMock.mockReset();
    loadConfigMock.mockClear();
    handleErrorMock.mockReset();

    deriveMasterKeysMock.mockResolvedValue({ encKey: "enc", macKey: "mac" });
    getAgentMock.mockResolvedValue({ agentId: "agent-1", publicKey: "pub-key" });
    importPublicKeyMock.mockResolvedValue("imported-pub");
    encryptAsymmetricMock.mockResolvedValue("encrypted-for-agent");
  });

  it("uses request.secretId when --secret-id is omitted", async () => {
    const adminFulfillRequest = await loadAdminFulfillRequest();

    getRequestMock.mockResolvedValue({
      requestId: "req-1",
      agentId: "agent-1",
      name: "GitHub PAT",
      secretId: "secret-42",
      requiredMetadata: { service: "github" },
    });
    getSecretMock.mockResolvedValue({ encryptedValue: "enc-secret" });
    decryptSecretMock.mockResolvedValue("plaintext-secret");

    await adminFulfillRequest("req-1", { password: "master-pass" });

    expect(getSecretMock).toHaveBeenCalledWith("secret-42");
    expect(createLeaseMock).toHaveBeenCalledWith("secret-42", {
      agentId: "agent-1",
      publicKey: "pub-key",
      encryptedData: "encrypted-for-agent",
    });
    expect(updateRequestMock).toHaveBeenCalledWith("req-1", {
      status: "fulfilled",
      secretId: "secret-42",
    });
    expect(handleErrorMock).not.toHaveBeenCalled();
  });

  it("errors when neither request.secretId nor --value/--secret-id is available", async () => {
    const adminFulfillRequest = await loadAdminFulfillRequest();

    getRequestMock.mockResolvedValue({
      requestId: "req-2",
      agentId: "agent-1",
      name: "Something",
      secretId: undefined,
    });

    await adminFulfillRequest("req-2", { password: "master-pass" });

    expect(handleErrorMock).toHaveBeenCalledTimes(1);
    const [errorArg] = handleErrorMock.mock.calls[0] as [Error];
    expect(errorArg.message).toContain("No source secret found");
  });
});
