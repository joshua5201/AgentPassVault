interface AppEnv {
  apiUrl: string;
  apiMockingEnabled: boolean;
}

function parseBoolean(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  return value.toLowerCase() === "true";
}

export function readAppEnv(): AppEnv {
  return {
    apiUrl: import.meta.env.VITE_API_URL ?? "http://localhost:8080",
    apiMockingEnabled: parseBoolean(import.meta.env.VITE_API_MOCKING),
  };
}
