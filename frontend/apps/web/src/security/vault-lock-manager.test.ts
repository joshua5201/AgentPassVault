import { describe, expect, it } from "vitest";
import { evaluateVaultLockReason } from "./vault-lock-manager";

describe("evaluateVaultLockReason", () => {
  it("returns inactivity lock when idle timeout exceeded", () => {
    const reason = evaluateVaultLockReason({
      isLocked: false,
      now: 20_000,
      lastActivityAt: 0,
      vaultUnlockedAt: 1,
      inactivityLockMs: 10_000,
      absoluteLockMs: 100_000,
    });

    expect(reason).toBe("inactivity");
  });

  it("returns absolute lock when session age exceeded", () => {
    const reason = evaluateVaultLockReason({
      isLocked: false,
      now: 20_000,
      lastActivityAt: 19_000,
      vaultUnlockedAt: 0,
      inactivityLockMs: 50_000,
      absoluteLockMs: 10_000,
    });

    expect(reason).toBe("absolute");
  });

  it("returns null when still valid", () => {
    const reason = evaluateVaultLockReason({
      isLocked: false,
      now: 5_000,
      lastActivityAt: 4_000,
      vaultUnlockedAt: 1_000,
      inactivityLockMs: 10_000,
      absoluteLockMs: 20_000,
    });

    expect(reason).toBeNull();
  });
});
