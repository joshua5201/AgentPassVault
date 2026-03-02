import { describe, expect, it } from "vitest";
import { parseRoute } from "./routes";

describe("parseRoute", () => {
  it("parses hash fulfillment route", () => {
    expect(parseRoute("#/fulfill/req-123", "/")).toEqual({
      route: "fulfillment",
      params: { requestId: "req-123" },
    });
  });

  it("parses pathname fulfillment route when hash is empty", () => {
    expect(parseRoute("", "/fulfill/req-xyz")).toEqual({
      route: "fulfillment",
      params: { requestId: "req-xyz" },
    });
  });

  it("parses hash secret detail route", () => {
    expect(parseRoute("#/secrets/sec-123", "/")).toEqual({
      route: "secret-detail",
      params: { secretId: "sec-123" },
    });
  });

  it("parses pathname secret detail route when hash is empty", () => {
    expect(parseRoute("", "/secrets/sec-abc")).toEqual({
      route: "secret-detail",
      params: { secretId: "sec-abc" },
    });
  });
});
