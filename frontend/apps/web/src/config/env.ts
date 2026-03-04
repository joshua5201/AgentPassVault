interface AppEnv {
  apiUrl: string;
  configuredApiUrl: string | null;
  apiMockingEnabled: boolean;
  apiClientFallbackEnabled: boolean;
  apiProxyEnabled: boolean;
}

type AppRuntimeEnv = {
  DEV: boolean;
  VITE_API_MOCKING?: string;
  VITE_API_PROXY?: string;
  VITE_API_CLIENT_FALLBACK?: string;
  VITE_API_URL?: string;
  AGENTPASSVAULT_API_URL?: string;
};

function readRuntimeEnv(): AppRuntimeEnv {
  return import.meta.env as unknown as AppRuntimeEnv;
}

function parseBoolean(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  return value.toLowerCase() === "true";
}

function resolveDevApiUrl(configuredApiUrl: string, isDev: boolean): string {
  if (!isDev || typeof window === "undefined") {
    return configuredApiUrl;
  }

  try {
    const parsed = new URL(configuredApiUrl);
    const isLocalHost = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    if (!isLocalHost) {
      return configuredApiUrl;
    }

    parsed.hostname = window.location.hostname;
    return parsed.toString();
  } catch {
    return configuredApiUrl;
  }
}

function firstNonEmpty(...values: Array<string | undefined>): string | null {
  for (const value of values) {
    if (!value) {
      continue;
    }

    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }

  return null;
}

function resolveConfiguredApiUrl(runtimeEnv: AppRuntimeEnv): string | null {
  const explicit = firstNonEmpty(
    runtimeEnv.AGENTPASSVAULT_API_URL,
    runtimeEnv.VITE_API_URL,
  );
  if (explicit) {
    return explicit;
  }

  if (runtimeEnv.DEV) {
    return "http://localhost:8080";
  }

  return null;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function readAppEnv(runtimeEnv: AppRuntimeEnv = readRuntimeEnv()): AppEnv {
  const apiMockingEnabled = parseBoolean(runtimeEnv.VITE_API_MOCKING);
  const apiProxyEnabled = runtimeEnv.DEV && parseBoolean(runtimeEnv.VITE_API_PROXY);
  const apiClientFallbackEnabled =
    runtimeEnv.DEV && apiMockingEnabled && parseBoolean(runtimeEnv.VITE_API_CLIENT_FALLBACK);
  const configuredApiUrl = resolveConfiguredApiUrl(runtimeEnv);
  const sameOriginUrl = typeof window !== "undefined" ? window.location.origin : configuredApiUrl ?? "";
  const resolvedApiUrl = configuredApiUrl ? resolveDevApiUrl(configuredApiUrl, runtimeEnv.DEV) : "";

  return {
    apiUrl: apiMockingEnabled || apiProxyEnabled ? sameOriginUrl : resolvedApiUrl,
    configuredApiUrl,
    apiMockingEnabled,
    apiClientFallbackEnabled,
    apiProxyEnabled,
  };
}

export function readStartupConfigError(runtimeEnv: AppRuntimeEnv = readRuntimeEnv()): string | null {
  const env = readAppEnv(runtimeEnv);

  if (env.apiMockingEnabled || env.apiProxyEnabled) {
    return null;
  }

  if (!env.configuredApiUrl) {
    return "Missing API endpoint configuration. Set AGENTPASSVAULT_API_URL (preferred) or VITE_API_URL during build/runtime startup.";
  }

  if (!isValidHttpUrl(env.configuredApiUrl)) {
    return `Invalid API endpoint configuration: ${env.configuredApiUrl}. Use an absolute http(s) URL.`;
  }

  return null;
}
