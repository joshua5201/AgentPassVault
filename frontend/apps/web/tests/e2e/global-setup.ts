import { MasterKeyService, VaultClient, VaultError } from "@agentpassvault/sdk";

async function canLogin(client: VaultClient, username: string, loginHash: string): Promise<boolean> {
  try {
    await client.userLogin({ username, password: loginHash });
    return true;
  } catch {
    return false;
  }
}

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
  if (await canLogin(client, username, loginHash)) {
    return;
  }

  try {
    await client.register({
      username,
      password: loginHash,
      displayName: "Web E2E Integration User",
    });
    if (await canLogin(client, username, loginHash)) {
      return;
    }
  } catch (error) {
    if (error instanceof VaultError && (error.status === 409 || error.status === 422)) {
      // The user can already exist with a stale password hash from previous runs.
      // Continue with password reset flow below.
    } else if (
      error instanceof VaultError &&
      typeof error.message === "string" &&
      error.message.toLowerCase().includes("duplicate entry") &&
      error.message.toLowerCase().includes("users.username")
    ) {
      // Continue with password reset flow below.
    } else {
      throw error;
    }
  }

  const resetTokenResult = await client.forgotPassword({ username });
  await client.resetPassword({ token: resetTokenResult.resetToken, newPassword: loginHash });

  if (!(await canLogin(client, username, loginHash))) {
    throw new Error("Unable to bootstrap integration E2E user credentials.");
  }
}

export default async function globalSetup() {
  await ensureIntegrationUser();
}
