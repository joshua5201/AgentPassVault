import fs from 'node:fs/promises';
import { CryptoService } from '@agentpassvault/sdk';
import { VaultClient } from '@agentpassvault/sdk';
import { 
  ensureConfigDir, 
  getPrivateKeyPath, 
  getPublicKeyPath, 
  saveConfig, 
  loadConfig, 
  Config,
  KEYS_DIR
} from '../config';

export async function setup(options: { 
  apiUrl: string; 
  tenantId: string; 
  agentId: string; 
  appToken: string; 
}) {
  const config: Config = {
    apiUrl: options.apiUrl,
    tenantId: options.tenantId,
    agentId: options.agentId,
    appToken: options.appToken,
  };
  await saveConfig(config);
  console.log('Configuration saved successfully.');
}

export async function generateKey() {
  await ensureConfigDir();

  // Check permissions for keys directory (should be 700 or 600)
  if (process.platform !== 'win32') {
    const stats = await fs.stat(KEYS_DIR);
    const mode = stats.mode & 0o777;
    if (mode !== 0o700 && mode !== 0o600) {
      console.warn(`Warning: Keys directory has insecure permissions: ${mode.toString(8)}. Recommended: 700`);
    }
  }
  
  console.log('Generating 4096-bit RSA-OAEP key pair...');
  const keyPair = await CryptoService.generateAgentKeyPair();
  
  const privPath = await getPrivateKeyPath();
  const pubPath = await getPublicKeyPath();
  
  const privB64 = await CryptoService.exportPrivateKey(keyPair.privateKey);
  const pubB64 = await CryptoService.exportPublicKey(keyPair.publicKey);
  
  await fs.writeFile(privPath, privB64, 'utf-8');
  await fs.writeFile(pubPath, pubB64, 'utf-8');
  
  // Set permissions for private key
  await fs.chmod(privPath, 0o600);
  
  console.log(`Keys generated and saved to:`);
  console.log(`- Private: ${privPath}`);
  console.log(`- Public:  ${pubPath}`);
}

export async function registerAgent() {
  const config = await loadConfig();
  if (!config || !config.apiUrl || !config.tenantId || !config.agentId || !config.appToken) {
    console.error('Configuration missing. Please run "setup" first.');
    process.exit(1);
  }

  // 1. Generate keys if they don't exist
  const pubPath = await getPublicKeyPath();
  const privPath = await getPrivateKeyPath();
  
  try {
    await fs.access(pubPath);
    await fs.access(privPath);
    console.log('Existing keys found.');
  } catch {
    await generateKey();
  }

  // 2. Load public key
  const pubB64 = await fs.readFile(pubPath, 'utf-8');

  // 3. Register with server
  console.log('Registering public key with server...');
  const client = new VaultClient(config.apiUrl);
  
  try {
    const loginResp = await client.agentLogin({
      tenantId: config.tenantId,
      appToken: config.appToken,
    });
    
    client.setAccessToken(loginResp.accessToken);
    
    await client.registerAgentPublicKey(config.agentId, {
      publicKey: pubB64,
    });
    
    console.log('Agent registered successfully.');
  } catch (error: any) {
    console.error('Registration failed:', error.message);
    process.exit(1);
  }
}
