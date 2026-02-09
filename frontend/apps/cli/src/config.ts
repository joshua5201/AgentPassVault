import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { z } from 'zod';

const ConfigSchema = z.object({
  apiUrl: z.string().url(),
  tenantId: z.string().optional(),
  agentId: z.string().optional(),
  appToken: z.string().optional(),
  token: z.string().optional(),
  // Admin fields
  adminUsername: z.string().optional(),
  adminToken: z.string().optional(),
  adminTenantId: z.string().optional(),
});

export type Config = z.infer<typeof ConfigSchema>;

const DEFAULT_CONFIG_DIR = path.join(os.homedir(), '.config', 'agentpassvault');
const CONFIG_FILE = path.join(DEFAULT_CONFIG_DIR, 'config.json');
export const KEYS_DIR = path.join(DEFAULT_CONFIG_DIR, 'keys');

export async function ensureConfigDir() {
  await fs.mkdir(DEFAULT_CONFIG_DIR, { recursive: true });
  await fs.mkdir(KEYS_DIR, { recursive: true });
  
  // Check/Set permissions for keys directory (600 in octal is 0o600)
  // Note: on Windows chmod might behave differently, but for linux it's essential
  if (os.platform() !== 'win32') {
    await fs.chmod(KEYS_DIR, 0o700); // Directory needs execute permission to be traversable
  }
}

export async function loadConfig(): Promise<Config | null> {
  // 1. Try environment variables first
  const envConfig = {
    apiUrl: process.env.AGENTPASSVAULT_API_URL,
    tenantId: process.env.AGENTPASSVAULT_TENANT_ID,
    appToken: process.env.AGENTPASSVAULT_APP_TOKEN,
  };

  if (envConfig.apiUrl && envConfig.tenantId) {
    return ConfigSchema.partial().parse(envConfig) as Config;
  }

  // 2. Try config file
  try {
    const content = await fs.readFile(CONFIG_FILE, 'utf-8');
    const json = JSON.parse(content);
    return ConfigSchema.parse(json);
  } catch (error) {
    return null;
  }
}

export async function saveConfig(config: Config) {
  await ensureConfigDir();
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  if (os.platform() !== 'win32') {
    await fs.chmod(CONFIG_FILE, 0o600);
  }
}

export async function getPrivateKeyPath(): Promise<string> {
  return path.join(KEYS_DIR, 'agent.priv');
}

export async function getPublicKeyPath(): Promise<string> {
  return path.join(KEYS_DIR, 'agent.pub');
}
