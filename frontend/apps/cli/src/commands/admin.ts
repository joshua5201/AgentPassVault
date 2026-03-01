import readline from "node:readline/promises";
import {
  VaultClient,
  MasterKeyService,
  SecretService,
  LeaseService,
  CryptoService,
  AgentResponse,
} from "@agentpassvault/sdk";
import { loadConfig, saveConfig, Config, ensureConfigDir } from "../config.js";
import { handleError } from "../utils/error-handler.js";
import { printOutput, logMessage } from "../utils/output.js";

import { Writable } from "node:stream";

async function prompt(
  question: string,
  silent: boolean = false,
): Promise<string> {
  const mutableStdout = new Writable({
    write: (chunk, encoding, callback) => {
      if (!silent) {
        process.stderr.write(chunk, encoding);
      }
      callback();
    },
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: mutableStdout,
    terminal: true,
  });

  if (silent) {
    process.stderr.write(question);
  }

  const answer = await rl.question(silent ? "" : question);
  rl.close();

  if (silent) {
    process.stderr.write("\n");
  }

  return answer;
}

async function getAdminClient() {
  const config = await loadConfig();
  if (!config || !config.apiUrl || !config.adminToken) {
    throw new Error('Admin not logged in. Please run "admin login" first.');
  }

  const client = new VaultClient(config.apiUrl);
  client.setAccessToken(config.adminToken);
  return { client, config };
}

export async function adminLogin(options: {
  apiUrl?: string;
  username?: string;
  password?: string;
}) {
  await ensureConfigDir();
  const config = (await loadConfig()) || {
    apiUrl: options.apiUrl || "http://localhost:8080",
  };

  if (options.apiUrl) {
    config.apiUrl = options.apiUrl;
  }

  const username = options.username || (await prompt("Username (Email): "));
  const password =
    options.password || (await prompt("Master Password: ", true));

  logMessage("Deriving login credentials...");
  const masterKeys = await MasterKeyService.deriveMasterKeys(
    password,
    username,
  );
  const loginHash = await MasterKeyService.deriveLoginHash(
    masterKeys,
    password,
  );

  logMessage("Logging in...");
  const client = new VaultClient(config.apiUrl);

  try {
    const loginResp = await client.userLogin({
      username,
      password: loginHash,
    });

    const newConfig: Config = {
      ...config,
      apiUrl: config.apiUrl,
      tenantId: loginResp.accessToken
        ? JSON.parse(
            Buffer.from(
              loginResp.accessToken.split(".")[1],
              "base64",
            ).toString(),
          ).tenant_id
        : undefined,
      adminUsername: username,
      adminToken: loginResp.accessToken,
    };

    await saveConfig(newConfig);
    printOutput({ message: "Login successful.", tenantId: newConfig.tenantId });
  } catch (error: any) {
    handleError(error, "Login failed");
  }
}

export async function adminRegister(options: {
  apiUrl?: string;
  username?: string;
  password?: string;
  displayName?: string;
}) {
  await ensureConfigDir();
  const apiUrl =
    options.apiUrl || (await loadConfig())?.apiUrl || "http://localhost:8080";

  const username = options.username || (await prompt("Username (Email): "));

  let password = options.password;
  if (!password) {
    const p1 = await prompt("Master Password: ", true);
    const p2 = await prompt("Confirm Master Password: ", true);
    if (p1 !== p2) {
      handleError(new Error("Passwords do not match."));
    }
    password = p1;
  }

  const displayName = options.displayName || (await prompt("Display Name: "));

  logMessage("Deriving credentials...");
  const masterKeys = await MasterKeyService.deriveMasterKeys(
    password,
    username,
  );
  const loginHash = await MasterKeyService.deriveLoginHash(
    masterKeys,
    password,
  );

  logMessage("Registering...");
  const client = new VaultClient(apiUrl);

  try {
    const resp = await client.register({
      username,
      password: loginHash,
      displayName,
    });

    logMessage("\nLogging in automatically...");
    const loginResp = await client.userLogin({
      username,
      password: loginHash,
    });

    const newConfig: Config = {
      apiUrl,
      tenantId: loginResp.accessToken
        ? JSON.parse(
            Buffer.from(
              loginResp.accessToken.split(".")[1],
              "base64",
            ).toString(),
          ).tenant_id
        : resp.tenantId,
      adminUsername: username,
      adminToken: loginResp.accessToken,
    };

    await saveConfig(newConfig);
    printOutput({
      message: "Registration and login successful.",
      tenantId: newConfig.tenantId,
      userId: resp.userId,
    });
  } catch (error: any) {
    handleError(error, "Registration failed");
  }
}

export async function adminDeleteTenant(id: string) {
  try {
    const { client } = await getAdminClient();
    logMessage(`Deleting tenant ${id} and all associated data...`);
    await client.deleteTenant(id);
    printOutput({ message: "Tenant deleted." });
  } catch (error: any) {
    handleError(error);
  }
}

export async function adminListSecrets() {
  try {
    const { client } = await getAdminClient();
    logMessage("Fetching secrets...");
    const secrets = await client.listSecrets();

    printOutput(secrets);
  } catch (error: any) {
    handleError(error);
  }
}

export async function adminViewSecret(
  id: string,
  options: { password?: string },
) {
  try {
    const { client, config } = await getAdminClient();

    const password =
      options.password || (await prompt("Confirm Master Password: ", true));

    logMessage("Fetching secret...");
    const secret = await client.getSecret(id);

    logMessage("Deriving Master Key...");
    const masterKeys = await MasterKeyService.deriveMasterKeys(
      password,
      config.adminUsername!,
    );

    logMessage("Decrypting...");
    const decrypted = await SecretService.decryptSecret(
      secret as any,
      masterKeys,
    );

    printOutput({
      name: secret.name,
      value: decrypted,
      metadata: secret.metadata,
    });
  } catch (error: any) {
    handleError(error);
  }
}

export async function adminCreateSecret(options: {
  name?: string;
  username?: string;
  secretPassword?: string;
  password?: string;
}) {
  try {
    const { client, config } = await getAdminClient();

    const name =
      options.name || (await prompt("Secret Name (e.g. AWS Prod): "));
    const username = options.username || (await prompt("Username (Email): "));
    const valuePassword =
      options.secretPassword || (await prompt("Password: ", true));

    const password =
      options.password || (await prompt("Confirm Master Password: ", true));

    const secretValueObj = {
      username,
      password: valuePassword,
    };
    const value = JSON.stringify(secretValueObj);
    const metadata = { name };

    logMessage("Deriving Master Key...");
    const masterKeys = await MasterKeyService.deriveMasterKeys(
      password,
      config.adminUsername!,
    );

    logMessage("Encrypting...");
    const secretData = await SecretService.createSecret(
      name,
      value,
      metadata,
      masterKeys,
    );

    logMessage("Uploading...");
    const newSecret = await client.createSecret(secretData as any);

    printOutput({
      message: "Secret created successfully.",
      secretId: newSecret.secretId,
    });
  } catch (error: any) {
    handleError(error);
  }
}

export async function adminDeleteSecret(id: string) {
  try {
    const { client } = await getAdminClient();
    logMessage(`Deleting secret ${id}...`);
    await client.deleteSecret(id);
    printOutput({ message: "Secret deleted." });
  } catch (error: any) {
    handleError(error);
  }
}

export async function adminUpdateSecret(
  id: string,
  options: {
    name?: string;
    value?: string;
    metadata?: string;
    password?: string;
  },
) {
  try {
    const { client, config } = await getAdminClient();

    let encryptedValue: string | undefined;
    if (options.value) {
      const password =
        options.password ||
        (await prompt("Confirm Master Password to re-encrypt: ", true));
      const masterKeys = await MasterKeyService.deriveMasterKeys(
        password,
        config.adminUsername!,
      );
      encryptedValue = await CryptoService.encryptSymmetric(
        options.value,
        masterKeys.encKey,
        masterKeys.macKey,
      );
    }

    const metadata = options.metadata
      ? JSON.parse(options.metadata)
      : undefined;

    logMessage(`Updating secret ${id}...`);
    await client.updateSecret(id, {
      name: options.name,
      encryptedValue,
      metadata,
    });
    printOutput({ message: "Secret updated." });
  } catch (error: any) {
    handleError(error);
  }
}

// Agent Management
export async function adminListAgents() {
  try {
    const { client, config } = await getAdminClient();
    const agents = await client.listAgents();

    printOutput({
      tenantId: config.tenantId,
      agents,
    });
  } catch (error: any) {
    handleError(error);
  }
}

export async function adminShowAgent(id: string) {
  try {
    const { client, config } = await getAdminClient();
    const agent = await client.getAgent(id);

    printOutput({
      tenantId: config.tenantId,
      agent,
    });
  } catch (error: any) {
    handleError(error);
  }
}

export async function adminCreateAgent(name: string) {
  try {
    const { client, config } = await getAdminClient();
    logMessage(`Creating agent "${name}"...`);
    const resp = await client.createAgent({ name });

    const agentConfig = {
      apiUrl: config.apiUrl,
      tenantId: config.tenantId,
      agentId: resp.agentId,
      appToken: resp.appToken,
    };

    printOutput({
      message: "Agent created successfully.",
      tenantId: config.tenantId,
      agentId: resp.agentId,
      appToken: resp.appToken,
      warning: "IMPORTANT: Store the App Token safely. It will not be shown again.",
      agentConfig,
      hint:
        "You can copy agentConfig to your persistent config file, e.g. /home/node/.openclaw/workspace/.config/agentpassvault/config.json, and set AGENTPASSVAULT_CONFIG_PATH to that directory.",
    });
  } catch (error: any) {
    handleError(error);
  }
}

export async function adminRotateAgentToken(id: string) {
  try {
    const { client } = await getAdminClient();
    logMessage(`Rotating token for agent ${id}...`);
    const resp = await client.rotateAgentToken(id);
    printOutput({
      message: "Token rotated successfully.",
      appToken: resp.appToken,
    });
  } catch (error: any) {
    handleError(error);
  }
}

export async function adminDeleteAgent(id: string) {
  try {
    const { client } = await getAdminClient();
    logMessage(`Deleting agent ${id}...`);
    await client.deleteAgent(id);
    printOutput({ message: "Agent deleted." });
  } catch (error: any) {
    handleError(error);
  }
}

// Request Management
export async function adminListRequests(options: { all?: boolean }) {
  try {
    const { client, config } = await getAdminClient();
    logMessage("Fetching requests...");
    let requests = await client.listRequests();

    if (!options.all) {
      requests = requests.filter((r: any) => r.status === "pending");
    }

    printOutput({
      tenantId: config.tenantId,
      requests,
    });
  } catch (error: any) {
    handleError(error);
  }
}

export async function adminRejectRequest(id: string, reason: string) {
  try {
    const { client } = await getAdminClient();
    await client.updateRequest(id, {
      status: "rejected" as any,
      rejectionReason: reason,
    });
    printOutput({ message: "Request rejected." });
  } catch (error: any) {
    handleError(error);
  }
}

export async function adminFulfillRequest(
  requestId: string,
  options: { secretId?: string; value?: string; password?: string },
) {
  try {
    const { client, config } = await getAdminClient();

    logMessage("Fetching request details...");
    const secretRequestResponse = await client.getRequest(requestId);

    logMessage("Fetching agent details...");
    const agent = await client.getAgent(secretRequestResponse.agentId!);
    if (!agent.publicKey) {
      throw new Error("Agent has not registered a public key yet.");
    }

    const password =
      options.password ||
      (await prompt("Confirm Master Password to decrypt/encrypt: ", true));
    logMessage("Deriving Master Key...");
    const masterKeys = await MasterKeyService.deriveMasterKeys(
      password,
      config.adminUsername!,
    );

    let secretId = options.secretId || secretRequestResponse.secretId;
    let plaintext = options.value;

    if (!secretId && !plaintext) {
      throw new Error(
        "No source secret found. Provide --secret-id, --value, or ensure request has secretId.",
      );
    }

    if (plaintext && !secretId) {
      // Create a new secret first
      logMessage("Creating new secret...");
      const secretData = await SecretService.createSecret(
        secretRequestResponse.name || "Fulfilling Request",
        plaintext,
        (secretRequestResponse.requiredMetadata as any) || {},
        masterKeys,
      );
      const newSecret = await client.createSecret(secretData as any);
      secretId = newSecret.secretId;
    } else if (secretId && !plaintext) {
      // Fetch and decrypt existing secret
      logMessage("Fetching existing secret...");
      const secret = await client.getSecret(secretId);
      plaintext = await SecretService.decryptSecret(secret as any, masterKeys);
    }

    if (!secretId || !plaintext) {
      throw new Error("Failed to obtain secret data.");
    }

    // Create Lease
    logMessage("Creating lease for agent...");
    const agentPublicKey = await CryptoService.importPublicKey(agent.publicKey);
    const encryptedForAgent = await CryptoService.encryptAsymmetric(
      plaintext,
      agentPublicKey,
    );

    await client.createLease(secretId, {
      agentId: agent.agentId!,
      publicKey: agent.publicKey,
      encryptedData: encryptedForAgent,
    });

    // Update Request Status
    logMessage("Marking request as fulfilled...");
    await client.updateRequest(requestId, {
      status: "fulfilled" as any,
      secretId: secretId,
    });

    printOutput({ message: "Request fulfilled successfully." });
  } catch (error: any) {
    handleError(error);
  }
}
