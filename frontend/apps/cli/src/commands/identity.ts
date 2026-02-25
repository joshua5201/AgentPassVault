import fs from "node:fs/promises";
import { CryptoService } from "@agentpassvault/sdk";
import { VaultClient } from "@agentpassvault/sdk";
import {
  ensureConfigDir,
  getPrivateKeyPath,
  getPublicKeyPath,
  saveConfig,
  loadConfig,
  Config,
  KEYS_DIR,
} from "../config.js";
import { handleError } from "../utils/error-handler.js";
import { printOutput, logMessage } from "../utils/output.js";

export async function setup(options: {
  apiUrl: string;
  tenantId: string;
  agentId: string;
  appToken: string;
}) {
  const existingConfig = (await loadConfig()) || {};
  const config: Config = {
    ...existingConfig,
    apiUrl: options.apiUrl,
    tenantId: options.tenantId,
    agentId: options.agentId,
    appToken: options.appToken,
  };
  await saveConfig(config);
  printOutput({ message: "Configuration saved successfully.", config });
}

export async function generateKey() {
  await ensureConfigDir();

  // Check permissions for keys directory (should be 700 or 600)
  if (process.platform !== "win32") {
    const stats = await fs.stat(KEYS_DIR);
    const mode = stats.mode & 0o777;
    if (mode !== 0o700 && mode !== 0o600) {
      logMessage(
        `Warning: Keys directory has insecure permissions: ${mode.toString(8)}. Recommended: 700`,
      );
    }
  }

  logMessage("Generating 4096-bit RSA-OAEP key pair...");
  const keyPair = await CryptoService.generateAgentKeyPair();

  const privPath = await getPrivateKeyPath();
  const pubPath = await getPublicKeyPath();

  const privB64 = await CryptoService.exportPrivateKey(keyPair.privateKey);
  const pubB64 = await CryptoService.exportPublicKey(keyPair.publicKey);

  await fs.writeFile(privPath, privB64, "utf-8");
  await fs.writeFile(pubPath, pubB64, "utf-8");

  // Set permissions for private key
  await fs.chmod(privPath, 0o600);

  printOutput({
    message: "Keys generated and saved successfully.",
    paths: {
      private: privPath,
      public: pubPath,
    },
  });
}

export async function registerAgent() {
  const config = await loadConfig();
  if (
    !config ||
    !config.apiUrl ||
    !config.tenantId ||
    !config.agentId ||
    !config.appToken
  ) {
    handleError(new Error('Configuration missing. Please run "setup" first.'));
  }

  // 1. Generate keys if they don't exist
  const pubPath = await getPublicKeyPath();
  const privPath = await getPrivateKeyPath();

  try {
    await fs.access(pubPath);
    await fs.access(privPath);
    logMessage("Existing keys found.");
  } catch {
    await generateKey();
  }

  // 2. Load public key
  const pubB64 = await fs.readFile(pubPath, "utf-8");

  // 3. Register with server
  logMessage("Registering public key with server...");
  if (!config || !config.apiUrl || !config.tenantId || !config.agentId || !config.appToken) {
    handleError(new Error('Configuration missing or incomplete.'));
    return; // Should be unreachable due to process.exit in handleError
  }
  
  const client = new VaultClient(config.apiUrl);

  try {
    const loginResp = await client.agentLogin({
      tenantId: config.tenantId,
      appToken: config.appToken,
    });

    client.setAccessToken(loginResp.accessToken || null);

    await client.registerAgentPublicKey(config.agentId, {
      publicKey: pubB64,
    });

    printOutput({ message: "Agent registered successfully." });
  } catch (error: any) {
    handleError(error, "Registration failed");
  }
}

export async function init(options: {
  apiUrl: string;
  tenantId: string;
  agentId: string;
  appToken: string;
}) {
  try {
    logMessage("Starting agent initialization...");
    
    // 1. Setup
    logMessage("Saving configuration...");
    const existingConfig = (await loadConfig()) || {};
    const config: Config = {
      ...existingConfig,
      apiUrl: options.apiUrl,
      tenantId: options.tenantId,
      agentId: options.agentId,
      appToken: options.appToken,
    };
    await saveConfig(config);

    // 2. Generate Keys
    logMessage("Generating keys...");
    await ensureConfigDir();
    const keyPair = await CryptoService.generateAgentKeyPair();
    const privPath = await getPrivateKeyPath();
    const pubPath = await getPublicKeyPath();
    const privB64 = await CryptoService.exportPrivateKey(keyPair.privateKey);
    const pubB64 = await CryptoService.exportPublicKey(keyPair.publicKey);
    await fs.writeFile(privPath, privB64, "utf-8");
    await fs.writeFile(pubPath, pubB64, "utf-8");
    if (process.platform !== "win32") {
      await fs.chmod(privPath, 0o600);
    }

    // 3. Register
    logMessage("Registering with server...");
    const client = new VaultClient(options.apiUrl);
    const loginResp = await client.agentLogin({
      tenantId: options.tenantId,
      appToken: options.appToken,
    });
    client.setAccessToken(loginResp.accessToken || null);
    await client.registerAgentPublicKey(options.agentId, {
      publicKey: pubB64,
    });

    printOutput({
      message: "Agent initialization complete.",
      config,
      paths: {
        private: privPath,
        public: pubPath,
      },
    });
  } catch (error: any) {
    handleError(error, "Initialization failed");
  }
}
