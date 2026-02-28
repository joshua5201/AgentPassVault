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

function resolveConfigDir(): string {
  const customPath = process.env.AGENTPASSVAULT_CONFIG_PATH?.trim();
  if (!customPath) return DEFAULT_CONFIG_DIR;

  // Support both absolute and relative paths.
  return path.isAbsolute(customPath)
    ? customPath
    : path.resolve(process.cwd(), customPath);
}

function getConfigFilePath(): string {
  return path.join(resolveConfigDir(), "config.json");
}

export function getKeysDirPath(): string {
  return path.join(resolveConfigDir(), "keys");
}

export async function ensureConfigDir() {
  const configDir = resolveConfigDir();
  const keysDir = getKeysDirPath();

  await fs.mkdir(configDir, { recursive: true });
  await fs.mkdir(keysDir, { recursive: true });

  // Check/Set permissions for keys directory (600 in octal is 0o600)
  // Note: on Windows chmod might behave differently, but for linux it's essential
  if (os.platform() !== "win32") {
    await fs.chmod(keysDir, 0o700); // Directory needs execute permission to be traversable
  }
}

export async function loadConfig(): Promise<Config | null> {
  let config: Partial<Config> = {};

  // 1. Load from config file first
  try {
    const content = await fs.readFile(getConfigFilePath(), "utf-8");
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
  const configFilePath = getConfigFilePath();
  await fs.writeFile(configFilePath, JSON.stringify(config, null, 2), "utf-8");
  if (os.platform() !== "win32") {
    await fs.chmod(configFilePath, 0o600);
  }
}

export async function getPrivateKeyPath(): Promise<string> {
  return path.join(getKeysDirPath(), "agent.priv");
}

export async function getPublicKeyPath(): Promise<string> {
  return path.join(getKeysDirPath(), "agent.pub");
}
