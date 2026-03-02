import { describe, expect, it } from "vitest";
import { normalizeSecretsPayload } from "./secrets-payload";

describe("normalizeSecretsPayload", () => {
  const sample = [{ secretId: "sec-1", name: "Prod DB" }];

  it("returns direct arrays", () => {
    expect(normalizeSecretsPayload(sample)).toEqual(sample);
  });

  it("supports content wrappers", () => {
    expect(normalizeSecretsPayload({ content: sample })).toEqual(sample);
  });

  it("supports items wrappers", () => {
    expect(normalizeSecretsPayload({ items: sample })).toEqual(sample);
  });

  it("supports secrets wrappers", () => {
    expect(normalizeSecretsPayload({ secrets: sample })).toEqual(sample);
  });

  it("supports data wrappers", () => {
    expect(normalizeSecretsPayload({ data: sample })).toEqual(sample);
  });

  it("returns empty array for unsupported payloads", () => {
    expect(normalizeSecretsPayload({ unknown: [] })).toEqual([]);
    expect(normalizeSecretsPayload(null)).toEqual([]);
    expect(normalizeSecretsPayload("nope")).toEqual([]);
  });
});
