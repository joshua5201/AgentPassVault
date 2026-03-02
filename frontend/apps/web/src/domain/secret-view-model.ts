import type { SecretDetailsResponse, SecretMetadataResponse } from "@agentpassvault/sdk";

export interface SecretListItemViewModel {
  id: string;
  name: string;
  updatedAt: string;
}

function toIsoDate(value: Date | string | undefined): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
  }

  return new Date().toISOString().slice(0, 10);
}

export function toSecretListItemViewModel(
  secret: SecretMetadataResponse | SecretDetailsResponse,
  index: number,
): SecretListItemViewModel {
  return {
    id: secret.secretId ?? `secret-unknown-${index}`,
    name: secret.name?.trim() ? secret.name : "Unnamed secret",
    updatedAt: toIsoDate(secret.updatedAt ?? secret.createdAt),
  };
}
