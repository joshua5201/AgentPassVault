import {
  REQUEST_CONTEXT_MAX_BYTES,
  SECRET_ENCRYPTED_VALUE_MAX_BYTES,
  SECRET_METADATA_MAX_BYTES,
} from "./limits";

const encoder = new TextEncoder();

export function byteLength(value: string): number {
  return encoder.encode(value).length;
}

export function metadataByteLength(metadata: Record<string, unknown>): number {
  let total = 0;

  for (const [key, value] of Object.entries(metadata)) {
    total += byteLength(key);
    total += byteLength(JSON.stringify(value));
  }

  return total;
}

export function validateEncryptedValueSize(encryptedValue: string): string | null {
  const bytes = byteLength(encryptedValue);
  if (bytes > SECRET_ENCRYPTED_VALUE_MAX_BYTES) {
    return `Encrypted value exceeds ${SECRET_ENCRYPTED_VALUE_MAX_BYTES} bytes`;
  }

  return null;
}

export function validateMetadataSize(metadata: Record<string, unknown>): string | null {
  const bytes = metadataByteLength(metadata);
  if (bytes > SECRET_METADATA_MAX_BYTES) {
    return `Metadata exceeds ${SECRET_METADATA_MAX_BYTES} bytes`;
  }

  return null;
}

export function validateRequestContextSize(context: string | undefined): string | null {
  if (!context) {
    return null;
  }

  const bytes = byteLength(context);
  if (bytes > REQUEST_CONTEXT_MAX_BYTES) {
    return `Request context exceeds ${REQUEST_CONTEXT_MAX_BYTES} bytes`;
  }

  return null;
}
