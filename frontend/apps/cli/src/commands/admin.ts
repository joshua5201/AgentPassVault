import readline from 'node:readline/promises';
import { 
  VaultClient, 
  MasterKeyService, 
  SecretService, 
  LeaseService, 
  CryptoService 
} from '@agentpassvault/sdk';
import { loadConfig, saveConfig, Config } from '../config';

async function prompt(question: string, silent: boolean = false): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: silent ? undefined : process.stdout,
  });
  
  // If silent, we need to handle the output manually to not show password
  if (silent) {
    process.stdout.write(question);
  }

  const answer = await rl.question(silent ? '' : question);
  rl.close();
  
  if (silent) {
    process.stdout.write('\n');
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

export async function adminLogin(options: { apiUrl?: string }) {
  const config = await loadConfig() || { apiUrl: options.apiUrl || 'http://localhost:8080' };
  
  if (options.apiUrl) {
    config.apiUrl = options.apiUrl;
  }

  const username = await prompt('Username: ');
  const password = await prompt('Master Password: ', true);

  console.log('Logging in...');
  const client = new VaultClient(config.apiUrl);
  
  try {
    const loginResp = await client.userLogin({
      username,
      password, // In a real zero-knowledge system, this would be a login hash derived from MK
    });

    const newConfig: Config = {
      ...config,
      apiUrl: config.apiUrl,
      adminUsername: username,
      adminToken: loginResp.accessToken,
      adminTenantId: (loginResp as any).tenantId || config.tenantId, // Assuming tenantId is in response
    };

    await saveConfig(newConfig);
    console.log('Login successful.');
  } catch (error: any) {
    console.error('Login failed:', error.message);
    process.exit(1);
  }
}

export async function adminListSecrets() {
  try {
    const { client } = await getAdminClient();
    console.log('Fetching secrets...');
    const secrets = await client.searchSecrets({ metadata: {} });
    
    if (secrets.length === 0) {
      console.log('No secrets found.');
      return;
    }

    console.log(`Found ${secrets.length} secret(s):`);
    secrets.forEach((s: any) => {
      console.log(`- ${s.name} (ID: ${s.secretId})`);
    });
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

export async function adminViewSecret(id: string) {
  try {
    const { client, config } = await getAdminClient();
    
    const password = await prompt('Confirm Master Password: ', true);
    
    console.log('Fetching secret...');
    const secret = await client.getSecret(id);
    
    console.log('Deriving Master Key...');
    // We use username as salt for now, as defined in our simplified Bitwarden model
    const masterKeys = await MasterKeyService.deriveMasterKeys(password, config.adminUsername!);
    
    console.log('Decrypting...');
    const decrypted = await SecretService.decryptSecret(secret as any, masterKeys);
    
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

export async function adminCreateSecret(name: string, options: { value?: string, metadata?: string }) {
  try {
    const { client, config } = await getAdminClient();
    
    const value = options.value || await prompt('Secret Value: ', true);
    const password = await prompt('Confirm Master Password: ', true);
    const metadata = options.metadata ? JSON.parse(options.metadata) : {};

    console.log('Deriving Master Key...');
    const masterKeys = await MasterKeyService.deriveMasterKeys(password, config.adminUsername!);
    
    console.log('Encrypting...');
    const secretData = await SecretService.createSecret(name, value, metadata, masterKeys, config.adminTenantId!);
    
    console.log('Uploading...');
    await client.createSecret(secretData as any);
    
    console.log('Secret created successfully.');
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

export async function adminDeleteSecret(id: string) {
  try {
    const { client } = await getAdminClient();
    console.log(`Deleting secret ${id}...`);
    await client.deleteSecret(id);
    console.log('Secret deleted.');
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Agent Management
export async function adminListAgents() {
  try {
    const { client } = await getAdminClient();
    const agents = await client.listAgents();
    
    if (agents.length === 0) {
      console.log('No agents found.');
      return;
    }

    console.log(`Found ${agents.length} agent(s):`);
    agents.forEach(a => {
      console.log(`- ${a.displayName} (${a.name}) ID: ${a.agentId}`);
      console.log(`  Public Key: ${a.publicKey ? 'Registered' : 'Pending'}`);
    });
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

export async function adminCreateAgent(name: string) {
  try {
    const { client } = await getAdminClient();
    console.log(`Creating agent "${name}"...`);
    const resp = await client.createAgent({ name });
    console.log('Agent created successfully.');
    console.log(`Agent ID: ${resp.agentId}`);
    console.log(`App Token: ${resp.appToken}`);
    console.log('\nIMPORTANT: Store the App Token safely. It will not be shown again.');
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

export async function adminRotateAgentToken(id: string) {
  try {
    const { client } = await getAdminClient();
    console.log(`Rotating token for agent ${id}...`);
    const resp = await client.rotateAgentToken(id);
    console.log('Token rotated successfully.');
    console.log(`New App Token: ${resp.appToken}`);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

export async function adminDeleteAgent(id: string) {
  try {
    const { client } = await getAdminClient();
    console.log(`Deleting agent ${id}...`);
    await client.deleteAgent(id);
    console.log('Agent deleted.');
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Request Management
export async function adminListRequests() {
  try {
    const { client } = await getAdminClient();
    console.log('Fetching requests...');
    const requests = await client.listRequests();
    
    if (requests.length === 0) {
      console.log('No requests found.');
      return;
    }

    console.log(`Found ${requests.length} request(s):`);
    requests.forEach((r: any) => {
      console.log(`- ${r.name} (ID: ${r.requestId})`);
      console.log(`  Status: ${r.status}, Type: ${r.type}`);
      if (r.context) console.log(`  Context: ${r.context}`);
    });
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

export async function adminRejectRequest(id: string, reason: string) {
  try {
    const { client } = await getAdminClient();
    await client.updateRequest(id, {
      status: 'rejected' as any,
      rejectionReason: reason
    });
    console.log('Request rejected.');
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

export async function adminFulfillRequest(requestId: string, options: { secretId?: string, value?: string }) {
  try {
    const { client, config } = await getAdminClient();
    
    if (!options.secretId && !options.value) {
      throw new Error('Either --secret-id or --value must be provided to fulfill a request.');
    }

    console.log('Fetching request details...');
    const request = await client.getRequest(requestId);
    
    console.log('Fetching agent details...');
    const agent = await client.getAgent(request.agentId);
    if (!agent.publicKey) {
      throw new Error('Agent has not registered a public key yet.');
    }

    const password = await prompt('Confirm Master Password to decrypt/encrypt: ', true);
    console.log('Deriving Master Key...');
    const masterKeys = await MasterKeyService.deriveMasterKeys(password, config.adminUsername!);

    let secretId = options.secretId;
    let plaintext = options.value;

    if (plaintext && !secretId) {
      // Create a new secret first
      console.log('Creating new secret...');
      const secretData = await SecretService.createSecret(
        request.name || 'Fulfilling Request',
        plaintext,
        request.requiredMetadata as any || {},
        masterKeys,
        config.adminTenantId!
      );
      const newSecret = await client.createSecret(secretData as any);
      secretId = newSecret.secretId;
    } else if (secretId && !plaintext) {
      // Fetch and decrypt existing secret
      console.log('Fetching existing secret...');
      const secret = await client.getSecret(secretId);
      plaintext = await SecretService.decryptSecret(secret as any, masterKeys);
    }

    if (!secretId || !plaintext) {
      throw new Error('Failed to obtain secret data.');
    }

    // Create Lease
    console.log('Creating lease for agent...');
    const agentPublicKey = await CryptoService.importPublicKey(agent.publicKey);
    const encryptedForAgent = await CryptoService.encryptAsymmetric(plaintext, agentPublicKey);

    await client.createLease(secretId, {
      agentId: agent.agentId,
      publicKey: agent.publicKey,
      encryptedData: encryptedForAgent
    });

    // Update Request Status
    console.log('Marking request as fulfilled...');
    await client.updateRequest(requestId, {
      status: 'fulfilled' as any,
      secretId: secretId
    });

    console.log('Request fulfilled successfully.');
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}
