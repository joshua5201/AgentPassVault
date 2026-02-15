import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";
import { z } from "zod";

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

const homeDir = (os.platform() !== "win32" && process.env.HOME) || os.homedir();
const DEFAULT_CONFIG_DIR = path.join(homeDir, ".config", "agentpassvault");
const CONFIG_FILE = path.join(DEFAULT_CONFIG_DIR, "config.json");
export const KEYS_DIR = path.join(DEFAULT_CONFIG_DIR, "keys");

export async function ensureConfigDir() {
  await fs.mkdir(DEFAULT_CONFIG_DIR, { recursive: true });
  await fs.mkdir(KEYS_DIR, { recursive: true });

  // Check/Set permissions for keys directory (600 in octal is 0o600)
  // Note: on Windows chmod might behave differently, but for linux it's essential
  if (os.platform() !== "win32") {
    await fs.chmod(KEYS_DIR, 0o700); // Directory needs execute permission to be traversable
  }
}

export async function loadConfig(): Promise<Config | null> {
  let config: Partial<Config> = {};

  // 1. Load from config file first
  try {
    const content = await fs.readFile(CONFIG_FILE, "utf-8");
    config = JSON.parse(content);
  } catch (error) {
    // Ignore error if file doesn't exist
  }

  // 2. Override with environment variables
  if (process.env.AGENTPASSVAULT_API_URL)
    config.apiUrl = process.env.AGENTPASSVAULT_API_URL;
  if (process.env.AGENTPASSVAULT_TENANT_ID)
    config.tenantId = process.env.AGENTPASSVAULT_TENANT_ID;
  if (process.env.AGENTPASSVAULT_APP_TOKEN)
    config.appToken = process.env.AGENTPASSVAULT_APP_TOKEN;
  if (process.env.AGENTPASSVAULT_ADMIN_TOKEN)
    config.adminToken = process.env.AGENTPASSVAULT_ADMIN_TOKEN;
  if (process.env.AGENTPASSVAULT_ADMIN_USERNAME)
    config.adminUsername = process.env.AGENTPASSVAULT_ADMIN_USERNAME;
  if (process.env.AGENTPASSVAULT_ADMIN_TENANT_ID)
    config.adminTenantId = process.env.AGENTPASSVAULT_ADMIN_TENANT_ID;

  // 3. Validate final config
  try {
    return ConfigSchema.parse(config);
  } catch (error) {
    // If it's still invalid (e.g. no apiUrl), return null
    return null;
  }
}

export async function saveConfig(config: Config) {
  await ensureConfigDir();
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
  if (os.platform() !== "win32") {
    await fs.chmod(CONFIG_FILE, 0o600);
  }
}

export async function getPrivateKeyPath(): Promise<string> {
  return path.join(KEYS_DIR, "agent.priv");
}

export async function getPublicKeyPath(): Promise<string> {
  return path.join(KEYS_DIR, "agent.pub");
}
