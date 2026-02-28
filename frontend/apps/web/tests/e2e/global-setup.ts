import { MasterKeyService, VaultClient, VaultError } from "@agentpassvault/sdk";

async function ensureIntegrationUser(): Promise<void> {
  const integrationMode = process.env.PW_API_MOCKING === "false";
  if (!integrationMode) {
    return;
  }

  const apiUrl = process.env.PW_API_URL ?? "http://localhost:58080";
  const username = process.env.PW_TEST_USERNAME ?? "web-e2e-integration@agentpassvault.local";
  const password = process.env.PW_TEST_PASSWORD ?? "WebE2EIntegrationPass#2026";

  const masterKeys = await MasterKeyService.deriveMasterKeys(password, username);
  const loginHash = await MasterKeyService.deriveLoginHash(masterKeys, password);

  const client = new VaultClient(apiUrl);
  try {
    await client.register({
      username,
      password: loginHash,
      displayName: "Web E2E Integration User",
    });
  } catch (error) {
    if (error instanceof VaultError && (error.status === 409 || error.status === 422)) {
      return;
    }

    if (
      error instanceof VaultError &&
      typeof error.message === "string" &&
      error.message.toLowerCase().includes("duplicate entry") &&
      error.message.toLowerCase().includes("users.username")
    ) {
      return;
    }
    throw error;
  }
}

export default async function globalSetup() {
  await ensureIntegrationUser();
}
