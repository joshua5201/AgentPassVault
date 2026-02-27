import { VaultError } from "@agentpassvault/sdk";

export interface AppApiError {
  status: number;
  code?: string;
  message: string;
  serverStackTrace?: string;
}

export function normalizeApiError(error: unknown): AppApiError {
  if (error instanceof VaultError) {
    return {
      status: error.status,
      code: error.code,
      message: error.message,
      serverStackTrace: error.serverStackTrace,
    };
  }

  if (error instanceof Error) {
    return {
      status: 500,
      message: error.message,
    };
  }

  return {
    status: 500,
    message: "Unexpected API error",
  };
}
