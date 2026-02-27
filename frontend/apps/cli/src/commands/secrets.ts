import fs from "node:fs/promises";
import { CryptoService, VaultClient, RequestType } from "@agentpassvault/sdk";
import { loadConfig, getPrivateKeyPath } from "../config.js";
import { handleError } from "../utils/error-handler.js";
import { printOutput, logMessage } from "../utils/output.js";

async function getClient() {
  const config = await loadConfig();
  if (!config || !config.apiUrl || !config.tenantId || !config.appToken) {
    throw new Error('Configuration missing. Please run "setup" first.');
  }

  const client = new VaultClient(config.apiUrl);
  const loginResp = await client.agentLogin({
    tenantId: config.tenantId,
    appToken: config.appToken,
  });
  client.setAccessToken(loginResp.accessToken || null);
  return { client, config };
}

export async function getSecret(id: string) {
  try {
    const { client } = await getClient();

    logMessage(`Fetching secret ${id}...`);
    const secret = await client.getSecret(id);

    // 2. Load private key
    const privPath = await getPrivateKeyPath();
    const privB64 = await fs.readFile(privPath, "utf-8");
    const privateKey = await CryptoService.importPrivateKey(privB64);

    // 3. Decrypt
    logMessage("Decrypting secret...");
    const decrypted = await CryptoService.decryptAsymmetric(
      secret.encryptedValue!,
      privateKey,
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

export async function searchSecrets(options: {
  name?: string;
  metadataJson?: string;
  fromFile?: string;
}) {
  try {
    const { client } = await getClient();
    let metadata;
    const hasName = !!options.name;
    const metadataJson = options.metadataJson;
    const metadataFile = options.fromFile;
    const hasMetadataJson = !!metadataJson;
    const hasMetadataFile = !!metadataFile;
    const hasMetadata = hasMetadataJson || hasMetadataFile;

    if (hasMetadataJson && hasMetadataFile) {
      handleError(
        new Error(
          "Provide either --metadata-json or --from-file (not both).",
        ),
      );
      return;
    }

    if (metadataFile) {
      logMessage(`Reading metadata from file: ${metadataFile}`);
      const fileContent = await fs.readFile(metadataFile, "utf-8");
      metadata = JSON.parse(fileContent);
    } else if (metadataJson) {
      metadata = JSON.parse(metadataJson);
    }

    if (!options.name && !metadata) {
      handleError(
        new Error(
          "Either --name, --metadata-json, or --from-file must be provided.",
        ),
      );
      return; // Ensure the function exits after handling the error
    }

    const results = await client.searchSecrets({
      name: options.name,
      metadata,
    });

    printOutput(results);
  } catch (error: any) {
    handleError(error);
  }
}

type RequestSecretOptions = {
  context?: string;
  metadata?: string;
  type?: string;
  secretId?: string;
};

function normalizeRequestType(raw?: string): RequestType {
  if (!raw) return RequestType.CREATE;
  const normalized = raw.trim().toUpperCase();
  if (normalized === 'LEASE') return RequestType.LEASE;
  if (normalized === 'CREATE') return RequestType.CREATE;
  throw new Error('Invalid request type. Use "create" or "lease".');
}

export async function requestSecret(
  name: string,
  options: RequestSecretOptions,
) {
  try {
    const { client } = await getClient();

    const requiredMetadata = options.metadata
      ? JSON.parse(options.metadata)
      : {};

    const requestType = normalizeRequestType(options.type);
    const secretId = options.secretId;
    if (requestType === RequestType.LEASE && !secretId) {
      throw new Error(
        'Request type "lease" requires --secret-id <id> (existing secret).',
      );
    }

    logMessage(`Creating secret request for "${name}"...`);
    const secretRequestResponse = await client.createRequest({
      name,
      type: requestType,
      context: options.context,
      requiredMetadata,
      secretId,
    });

    printOutput({
      message: "Request created successfully.",
      requestId: secretRequestResponse.requestId,
      status: secretRequestResponse.status,
      fulfillmentUrl: secretRequestResponse.fulfillmentUrl,
    });
  } catch (error: any) {
    handleError(error);
  }
}

export async function getRequestStatus(id: string) {
  try {
    const { client } = await getClient();
    const secretRequestResponse = await client.getRequest(id);

    printOutput(secretRequestResponse);
  } catch (error: any) {
    handleError(error);
  }
}
