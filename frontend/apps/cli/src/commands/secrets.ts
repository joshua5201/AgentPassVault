import fs from 'node:fs/promises';
import { CryptoService, VaultClient, RequestType } from '@agentpassvault/sdk';
import { loadConfig, getPrivateKeyPath } from '../config';

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
  client.setAccessToken(loginResp.accessToken);
  return { client, config };
}

export async function getSecret(id: string) {
  try {
    const { client } = await getClient();
    
    // 1. Get secret (this might return the secret directly or we might need to check leases)
    // Actually, according to the plan, agents get secrets via leases.
    // The server returns SecretResponse which includes encryptedValue.
    // If it's for an agent, it's encrypted with agent's public key.
    
    console.log(`Fetching secret ${id}...`);
    const secret = await client.getSecret(id);
    
    // 2. Load private key
    const privPath = await getPrivateKeyPath();
    const privB64 = await fs.readFile(privPath, 'utf-8');
    const privateKey = await CryptoService.importPrivateKey(privB64);
    
    // 3. Decrypt
    console.log('Decrypting secret...');
    const decrypted = await CryptoService.decryptAsymmetric(secret.encryptedValue, privateKey);
    
    console.log('\nSecret Details:');
    console.log(`Name: ${secret.name}`);
    console.log(`Value: ${decrypted}`);
    if (secret.metadata && Object.keys(secret.metadata).length > 0) {
      console.log('Metadata:', JSON.stringify(secret.metadata, null, 2));
    }
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

export async function searchSecrets(metadataStr: string) {
  try {
    const { client } = await getClient();
    const metadata = JSON.parse(metadataStr);
    
    const results = await client.searchSecrets({ metadata });
    
    if (results.length === 0) {
      console.log('No secrets found.');
      return;
    }
    
    console.log(`Found ${results.length} secret(s):`);
    results.forEach((s: any) => {
      console.log(`- ${s.name} (ID: ${s.secretId})`);
      console.log(`  Metadata: ${JSON.stringify(s.metadata)}`);
    });
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

export async function requestSecret(name: string, options: { context?: string, metadata?: string }) {
  try {
    const { client } = await getClient();
    
    const requiredMetadata = options.metadata ? JSON.parse(options.metadata) : {};
    
    console.log(`Creating secret request for "${name}"...`);
    const request = await client.createRequest({
      name,
      type: RequestType.CREATE,
      context: options.context,
      requiredMetadata,
    });
    
    console.log('Request created successfully.');
    console.log(`ID: ${request.requestId}`);
    console.log(`Status: ${request.status}`);
    console.log(`Fulfillment URL: ${request.fulfillmentUrl}`);
    console.log('\nPlease share this URL with a human administrator.');
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

export async function getRequestStatus(id: string) {
  try {
    const { client } = await getClient();
    const request = await client.getRequest(id);
    
    console.log('Request Status:');
    console.log(`ID: ${request.requestId}`);
    console.log(`Name: ${request.name}`);
    console.log(`Status: ${request.status}`);
    if (request.mappedSecretId) {
      console.log(`Mapped Secret ID: ${request.mappedSecretId}`);
    }
    if (request.rejectionReason) {
      console.log(`Rejection Reason: ${request.rejectionReason}`);
    }
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}
