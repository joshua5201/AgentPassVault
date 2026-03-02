import type { SecretDetailsResponse } from "@agentpassvault/sdk";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toSecretDetailsArray(value: unknown): SecretDetailsResponse[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  return value as SecretDetailsResponse[];
}

export function normalizeSecretsPayload(payload: unknown): SecretDetailsResponse[] {
  const directArray = toSecretDetailsArray(payload);
  if (directArray) {
    return directArray;
  }

  if (!isRecord(payload)) {
    return [];
  }

  const wrappedCandidates = [
    payload.content,
    payload.items,
    payload.secrets,
    payload.data,
  ];

  for (const candidate of wrappedCandidates) {
    const secrets = toSecretDetailsArray(candidate);
    if (secrets) {
      return secrets;
    }
  }

  return [];
}
