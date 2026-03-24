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

  it("parses hash request selection route", () => {
    expect(parseRoute("#/requests/req-123", "/")).toEqual({
      route: "requests",
      params: { request: "req-123" },
    });
  });

  it("parses hash secret selection route", () => {
    expect(parseRoute("#/secrets/sec-123", "/")).toEqual({
      route: "secrets",
      params: { secret: "sec-123" },
    });
  });

  it("parses pathname secret selection route when hash is empty", () => {
    expect(parseRoute("", "/secrets/sec-abc")).toEqual({
      route: "secrets",
      params: { secret: "sec-abc" },
    });
  });

  it("parses agents route", () => {
    expect(parseRoute("#/agents", "/")).toEqual({
      route: "agents",
      params: {},
    });
  });

  it("parses audit log route", () => {
    expect(parseRoute("#/audit-log", "/")).toEqual({
      route: "audit-log",
      params: {},
    });
  });

  it("parses agent selection query params", () => {
    expect(parseRoute("#/agents?agent=agent-ci-prod&agentName=ci-prod", "/")).toEqual({
      route: "agents",
      params: { agent: "agent-ci-prod", agentName: "ci-prod" },
    });
  });

  it("parses secret selection query params", () => {
    expect(parseRoute("#/secrets?secretName=AWS%20Deploy%20Key", "/")).toEqual({
      route: "secrets",
      params: { secretName: "AWS Deploy Key" },
    });
  });
});
