import { useEffect } from "react";
import { evaluateVaultLockReason } from "../security/vault-lock-manager";

interface UseVaultLockManagerOptions {
  enabled: boolean;
  isLocked: boolean;
  lastActivityAt: number | null;
  vaultUnlockedAt: number | null;
  markActivity: () => void;
  lockVault: () => void;
}

export function useVaultLockManager({
  enabled,
  isLocked,
  lastActivityAt,
  vaultUnlockedAt,
  markActivity,
  lockVault,
}: UseVaultLockManagerOptions) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const onActivity = () => markActivity();
    const activityEvents: Array<keyof WindowEventMap> = ["mousemove", "keydown", "click", "focus"];

    for (const eventName of activityEvents) {
      window.addEventListener(eventName, onActivity);
    }

    const onBeforeUnload = () => {
      lockVault();
    };

    window.addEventListener("beforeunload", onBeforeUnload);

    const timerId = window.setInterval(() => {
      const reason = evaluateVaultLockReason({
        isLocked,
        now: Date.now(),
        lastActivityAt,
        vaultUnlockedAt,
      });

      if (reason) {
        lockVault();
      }
    }, 10000);

    return () => {
      for (const eventName of activityEvents) {
        window.removeEventListener(eventName, onActivity);
      }

      window.removeEventListener("beforeunload", onBeforeUnload);
      window.clearInterval(timerId);
    };
  }, [enabled, isLocked, lastActivityAt, vaultUnlockedAt, markActivity, lockVault]);
}
