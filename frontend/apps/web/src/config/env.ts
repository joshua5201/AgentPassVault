interface AppEnv {
  apiUrl: string;
  apiMockingEnabled: boolean;
  apiClientFallbackEnabled: boolean;
}

function parseBoolean(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  return value.toLowerCase() === "true";
}

function resolveDevApiUrl(configuredApiUrl: string): string {
  if (!import.meta.env.DEV || typeof window === "undefined") {
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

export function readAppEnv(): AppEnv {
  const apiMockingEnabled = parseBoolean(import.meta.env.VITE_API_MOCKING);
  const apiClientFallbackEnabled =
    import.meta.env.DEV && apiMockingEnabled && parseBoolean(import.meta.env.VITE_API_CLIENT_FALLBACK);
  const configuredApiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
  const sameOriginUrl = typeof window !== "undefined" ? window.location.origin : configuredApiUrl;
  const resolvedApiUrl = resolveDevApiUrl(configuredApiUrl);

  return {
    apiUrl: apiMockingEnabled ? sameOriginUrl : resolvedApiUrl,
    apiMockingEnabled,
    apiClientFallbackEnabled,
  };
}
