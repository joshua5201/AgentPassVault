import readline from 'node:readline/promises';
import { 
  VaultClient, 
  MasterKeyService, 
  SecretService, 
  LeaseService, 
  CryptoService 
} from '@agentpassvault/sdk';
import { loadConfig, saveConfig, Config, ensureConfigDir } from '../config.js';

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

export async function adminLogin(options: { apiUrl?: string, username?: string, password?: string }) {
  await ensureConfigDir();
  const config = await loadConfig() || { apiUrl: options.apiUrl || 'http://localhost:8080' };
  
  if (options.apiUrl) {
    config.apiUrl = options.apiUrl;
  }

  const username = options.username || await prompt('Username: ');
  const password = options.password || await prompt('Master Password: ', true);

  console.log('Deriving login credentials...');
  const masterKeys = await MasterKeyService.deriveMasterKeys(password, username);
  const loginHash = await MasterKeyService.deriveLoginHash(masterKeys, password);

  console.log('Logging in...');
  const client = new VaultClient(config.apiUrl);
  
  try {
    const loginResp = await client.userLogin({
      username,
      password: loginHash,
    });

    const newConfig: Config = {
      ...config,
      apiUrl: config.apiUrl,
      adminUsername: username,
      adminToken: loginResp.accessToken,
    };

    await saveConfig(newConfig);
    console.log('Login successful.');
  } catch (error: any) {
    console.error('Login failed:', error.message);
    process.exit(1);
  }
}

export async function adminRegister(options: { apiUrl?: string, username?: string, password?: string, displayName?: string }) {
  await ensureConfigDir();
  const apiUrl = options.apiUrl || (await loadConfig())?.apiUrl || 'http://localhost:8080';
  
  const username = options.username || await prompt('Email: ');
  
  let password = options.password;
  if (!password) {
    const p1 = await prompt('Master Password: ', true);
    const p2 = await prompt('Confirm Master Password: ', true);
    if (p1 !== p2) {
      console.error('Passwords do not match.');
      process.exit(1);
    }
    password = p1;
  }

  const displayName = options.displayName || await prompt('Display Name: ');

  console.log('Deriving credentials...');
  const masterKeys = await MasterKeyService.deriveMasterKeys(password, username);
  const loginHash = await MasterKeyService.deriveLoginHash(masterKeys, password);

  console.log('Registering...');
  const client = new VaultClient(apiUrl);
  
  try {
    const resp = await client.register({
      username,
      password: loginHash,
      displayName
    });

    console.log('Registration successful.');
    console.log(`Tenant ID: ${resp.tenantId}`);
    console.log(`User ID: ${resp.userId}`);
    console.log('\nPlease login using "admin login"');
  } catch (error: any) {
    console.error('Registration failed:', error.message);
    process.exit(1);
  }
}

export async function adminDeleteTenant(id: string) {
  try {
    const { client } = await getAdminClient();
    console.log(`Deleting tenant ${id} and all associated data...`);
    await client.deleteTenant(id);
    console.log('Tenant deleted.');
  } catch (error: any) {
    console.error('Error:', error.message);
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

export async function adminViewSecret(id: string, options: { password?: string }) {
  try {
    const { client, config } = await getAdminClient();
    
    const password = options.password || await prompt('Confirm Master Password: ', true);
    
    console.log('Fetching secret...');
    const secret = await client.getSecret(id);
    
    console.log('Deriving Master Key...');
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

export async function adminCreateSecret(name: string, options: { value?: string, metadata?: string, password?: string }) {
  try {
    const { client, config } = await getAdminClient();
    
    const value = options.value || await prompt('Secret Value: ', true);
    const password = options.password || await prompt('Confirm Master Password: ', true);
    const metadata = options.metadata ? JSON.parse(options.metadata) : {};

    console.log('Deriving Master Key...');
    const masterKeys = await MasterKeyService.deriveMasterKeys(password, config.adminUsername!);
    
    console.log('Encrypting...');
    const secretData = await SecretService.createSecret(name, value, metadata, masterKeys);
    
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

export async function adminUpdateSecret(id: string, options: { name?: string, value?: string, metadata?: string, password?: string }) {
  try {
    const { client, config } = await getAdminClient();
    
    let encryptedValue: string | undefined;
    if (options.value) {
      const password = options.password || await prompt('Confirm Master Password to re-encrypt: ', true);
      const masterKeys = await MasterKeyService.deriveMasterKeys(password, config.adminUsername!);
      encryptedValue = await CryptoService.encryptSymmetric(options.value, masterKeys.encKey, masterKeys.macKey);
    }

    const metadata = options.metadata ? JSON.parse(options.metadata) : undefined;

    console.log(`Updating secret ${id}...`);
    await client.updateSecret(id, {
      name: options.name,
      encryptedValue,
      metadata
    });
    console.log('Secret updated.');
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
    const secretRequestResponses = await client.listRequests();
    
    if (secretRequestResponses.length === 0) {
      console.log('No requests found.');
      return;
    }

    console.log(`Found ${secretRequestResponses.length} request(s):`);
    secretRequestResponses.forEach((r: any) => {
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

export async function adminFulfillRequest(requestId: string, options: { secretId?: string, value?: string, password?: string }) {
  try {
    const { client, config } = await getAdminClient();
    
    if (!options.secretId && !options.value) {
      throw new Error('Either --secret-id or --value must be provided to fulfill a request.');
    }

    console.log('Fetching request details...');
    const secretRequestResponse = await client.getRequest(requestId);
    
    console.log('Fetching agent details...');
    const agent = await client.getAgent(secretRequestResponse.agentId!);
    if (!agent.publicKey) {
      throw new Error('Agent has not registered a public key yet.');
    }

    const password = options.password || await prompt('Confirm Master Password to decrypt/encrypt: ', true);
    console.log('Deriving Master Key...');
    const masterKeys = await MasterKeyService.deriveMasterKeys(password, config.adminUsername!);

    let secretId = options.secretId;
    let plaintext = options.value;

    if (plaintext && !secretId) {
      // Create a new secret first
      console.log('Creating new secret...');
      const secretData = await SecretService.createSecret(
        secretRequestResponse.name || 'Fulfilling Request',
        plaintext,
        secretRequestResponse.requiredMetadata as any || {},
        masterKeys
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
      agentId: agent.agentId!,
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
