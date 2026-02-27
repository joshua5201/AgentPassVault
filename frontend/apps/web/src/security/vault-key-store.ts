import { create } from "zustand";
import type { MasterKeys } from "@agentpassvault/sdk";

interface VaultKeyState {
  masterKeys: MasterKeys | null;
  loginHash: string | null;
  lastActivityAt: number | null;
  vaultUnlockedAt: number | null;
  isLocked: boolean;
  setVaultSession: (masterKeys: MasterKeys, loginHash: string) => void;
  clearVaultSession: () => void;
  markActivity: () => void;
}

export const useVaultKeyStore = create<VaultKeyState>((set) => ({
  masterKeys: null,
  loginHash: null,
  lastActivityAt: null,
  vaultUnlockedAt: null,
  isLocked: true,
  setVaultSession: (masterKeys, loginHash) => {
    const now = Date.now();
    set({
      masterKeys,
      loginHash,
      isLocked: false,
      lastActivityAt: now,
      vaultUnlockedAt: now,
    });
  },
  clearVaultSession: () =>
    set({
      masterKeys: null,
      loginHash: null,
      isLocked: true,
      lastActivityAt: null,
      vaultUnlockedAt: null,
    }),
  markActivity: () => set({ lastActivityAt: Date.now() }),
}));
