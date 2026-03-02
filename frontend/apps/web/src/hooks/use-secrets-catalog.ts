import { useCallback, useEffect, useState } from "react";
import type { SecretDetailsResponse, SecretMetadataResponse } from "@agentpassvault/sdk";
import { appApiClient } from "../api/client";
import { toSecretListItemViewModel, type SecretListItemViewModel } from "../domain/secret-view-model";

interface UseSecretsCatalogResult {
  loading: boolean;
  error: string | null;
  items: SecretListItemViewModel[];
  refresh: () => Promise<void>;
  prependCreatedSecret: (secret: SecretMetadataResponse | SecretDetailsResponse) => void;
}

export function useSecretsCatalog(): UseSecretsCatalogResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<SecretListItemViewModel[]>([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await appApiClient.listSecrets();
    setLoading(false);

    if (!result.ok) {
      setError(`Load secrets failed (${result.error.status}): ${result.error.message}`);
      return;
    }

    setItems(result.data.map((secret, index) => toSecretListItemViewModel(secret, index)));
  }, []);

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
