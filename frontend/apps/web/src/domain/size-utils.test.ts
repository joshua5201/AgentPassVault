import { describe, expect, it } from "vitest";
import {
  REQUEST_CONTEXT_MAX_BYTES,
  SECRET_ENCRYPTED_VALUE_MAX_BYTES,
  SECRET_METADATA_MAX_BYTES,
} from "./limits";
import {
  byteLength,
  metadataByteLength,
  validateEncryptedValueSize,
  validateMetadataSize,
  validateRequestContextSize,
} from "./size-utils";

describe("size-utils", () => {
  it("computes utf8 byte length", () => {
    expect(byteLength("abc")).toBe(3);
    expect(byteLength("😀")).toBe(4);
  });

  it("validates encrypted payload size limit", () => {
    const ok = "a".repeat(SECRET_ENCRYPTED_VALUE_MAX_BYTES);
    const tooLarge = "a".repeat(SECRET_ENCRYPTED_VALUE_MAX_BYTES + 1);

    expect(validateEncryptedValueSize(ok)).toBeNull();
    expect(validateEncryptedValueSize(tooLarge)).toContain(String(SECRET_ENCRYPTED_VALUE_MAX_BYTES));
  });

  it("validates metadata size limit", () => {
    const okMetadata = { k: "v" };
    const oversizedValue = "a".repeat(SECRET_METADATA_MAX_BYTES + 100);
    const oversizedMetadata = { key: oversizedValue };

    expect(metadataByteLength(okMetadata)).toBeGreaterThan(0);
    expect(validateMetadataSize(okMetadata)).toBeNull();
    expect(validateMetadataSize(oversizedMetadata)).toContain(String(SECRET_METADATA_MAX_BYTES));
  });

  it("validates request context size limit", () => {
    const ok = "a".repeat(REQUEST_CONTEXT_MAX_BYTES);
    const tooLarge = "a".repeat(REQUEST_CONTEXT_MAX_BYTES + 1);

    expect(validateRequestContextSize(undefined)).toBeNull();
    expect(validateRequestContextSize(ok)).toBeNull();
    expect(validateRequestContextSize(tooLarge)).toContain(String(REQUEST_CONTEXT_MAX_BYTES));
  });
});
