export const VAULT_INACTIVITY_LOCK_MS = 15 * 60 * 1000;
export const VAULT_ABSOLUTE_LOCK_MS = 8 * 60 * 60 * 1000;

export type LockReason = "inactivity" | "absolute";

export function evaluateVaultLockReason(input: {
  isLocked: boolean;
  now: number;
  lastActivityAt: number | null;
  vaultUnlockedAt: number | null;
  inactivityLockMs?: number;
  absoluteLockMs?: number;
}): LockReason | null {
  if (input.isLocked) {
    return null;
  }

  const inactivityLockMs = input.inactivityLockMs ?? VAULT_INACTIVITY_LOCK_MS;
  const absoluteLockMs = input.absoluteLockMs ?? VAULT_ABSOLUTE_LOCK_MS;

  if (input.vaultUnlockedAt !== null && input.now - input.vaultUnlockedAt >= absoluteLockMs) {
    return "absolute";
  }

  if (input.lastActivityAt !== null && input.now - input.lastActivityAt >= inactivityLockMs) {
    return "inactivity";
  }

  return null;
}
