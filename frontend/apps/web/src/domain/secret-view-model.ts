import type { SecretDetailsResponse, SecretMetadataResponse } from "@agentpassvault/sdk";

export interface SecretListItemViewModel {
  id: string;
  name: string;
  updatedAt: string;
}

function toIsoDate(value: Date | undefined): string {
  return (value ?? new Date()).toISOString().slice(0, 10);
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
