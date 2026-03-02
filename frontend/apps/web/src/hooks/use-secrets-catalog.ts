import { useCallback, useEffect, useState } from "react";
import type { SecretDetailsResponse, SecretMetadataResponse } from "@agentpassvault/sdk";
import { appApiClient } from "../api/client";
import { toSecretListItemViewModel, type SecretListItemViewModel } from "../domain/secret-view-model";
import { readAppEnv } from "../config/env";
import { useSessionStore } from "../state/session-store";

interface UseSecretsCatalogResult {
  loading: boolean;
  error: string | null;
  items: SecretListItemViewModel[];
  refresh: () => Promise<void>;
  prependCreatedSecret: (secret: SecretMetadataResponse | SecretDetailsResponse) => void;
}

export function useSecretsCatalog(): UseSecretsCatalogResult {
  const env = readAppEnv();
  const { accessToken } = useSessionStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<SecretListItemViewModel[]>([]);
  const canFetch = import.meta.env.MODE === "test" || env.apiMockingEnabled || Boolean(accessToken);

  const refresh = useCallback(async () => {
    if (!canFetch) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const result = await appApiClient.listSecrets();
    setLoading(false);

    if (!result.ok) {
      setError(`Load secrets failed (${result.error.status}): ${result.error.message}`);
      return;
    }

    try {
      setItems(result.data.map((secret, index) => toSecretListItemViewModel(secret, index)));
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "unexpected response parsing error";
      setError(`Load secrets failed: ${message}`);
    }
  }, [canFetch]);

  const prependCreatedSecret = useCallback((secret: SecretMetadataResponse | SecretDetailsResponse) => {
    const mapped = toSecretListItemViewModel(secret, Date.now());
    setItems((previous) => {
      const withoutDuplicate = previous.filter((item) => item.id !== mapped.id);
      return [mapped, ...withoutDuplicate];
    });
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    loading,
    error,
    items,
    refresh,
    prependCreatedSecret,
  };
}
