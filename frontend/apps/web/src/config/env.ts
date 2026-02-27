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

export function readAppEnv(): AppEnv {
  const apiMockingEnabled = parseBoolean(import.meta.env.VITE_API_MOCKING);
  const apiClientFallbackEnabled =
    import.meta.env.DEV && apiMockingEnabled && parseBoolean(import.meta.env.VITE_API_CLIENT_FALLBACK);
  const configuredApiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
  const sameOriginUrl = typeof window !== "undefined" ? window.location.origin : configuredApiUrl;

  return {
    apiUrl: apiMockingEnabled ? sameOriginUrl : configuredApiUrl,
    apiMockingEnabled,
    apiClientFallbackEnabled,
  };
}
