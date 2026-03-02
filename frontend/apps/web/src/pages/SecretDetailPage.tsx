import { useEffect, useState } from "react";
import { CryptoService, type MasterKeys, type SecretResponse } from "@agentpassvault/sdk";
import { appApiClient } from "../api/client";
import { ErrorState } from "../components/states/ErrorState";
import { Button, Card, Toast } from "../components/ui";
import { readAppEnv } from "../config/env";
import { useSessionStore } from "../state/session-store";

interface SecretDetailPageProps {
  secretId: string;
  isVaultLocked: boolean;
  masterKeys: MasterKeys | null;
  onBack: () => void;
}

function toDisplayDate(value: Date | string | undefined): string {
  if (!value) {
    return "-";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString();
}

export function SecretDetailPage({ secretId, isVaultLocked, masterKeys, onBack }: SecretDetailPageProps) {
  const env = readAppEnv();
  const { accessToken } = useSessionStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [secret, setSecret] = useState<SecretResponse | null>(null);
  const [revealedValue, setRevealedValue] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const canFetch = import.meta.env.MODE === "test" || env.apiMockingEnabled || Boolean(accessToken);

  useEffect(() => {
    if (isVaultLocked) {
      setRevealedValue(null);
    }
  }, [isVaultLocked]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!canFetch) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setNotice(null);

      const result = await appApiClient.getSecret(secretId);
      if (!active) {
        return;
      }

      setLoading(false);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }

      setSecret(result.data);
    };

    void load();
    return () => {
      active = false;
    };
  }, [canFetch, secretId]);

  const toggleReveal = async () => {
    setNotice(null);

    if (revealedValue) {
      setRevealedValue(null);
      return;
    }

    if (isVaultLocked || !masterKeys) {
      setNotice("Vault is locked. Unlock before revealing values.");
      return;
    }

    if (!secret?.encryptedValue) {
      setNotice("Secret value is unavailable.");
      return;
    }

    try {
      const decrypted = await CryptoService.decryptSymmetric(secret.encryptedValue, masterKeys.encKey, masterKeys.macKey);
      setRevealedValue(decrypted);
    } catch {
      setNotice("Failed to decrypt secret value.");
    }
  };

  if (loading) {
    return <Toast title="Secret Detail">Loading secret...</Toast>;
  }

  if (error || !secret) {
    return (
      <ErrorState
        title="Secret not found"
        message={error ?? "The selected secret could not be loaded."}
        actionLabel="Back to secrets"
        onAction={onBack}
      />
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">{secret.name ?? "Unnamed secret"}</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">Secret ID: {secret.secretId ?? "-"}</p>
        </div>
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
      </div>

      {notice ? (
        <Toast title="Secret Detail" onDismiss={() => setNotice(null)}>
          {notice}
        </Toast>
      ) : null}

      <Card title="Secret Value" description="The decrypted value remains hidden by default.">
        <div className="flex flex-wrap items-center gap-3">
          <code className="rounded bg-[var(--color-surface-muted)] px-2 py-1 text-xs">
            {revealedValue ?? "••••••••••••••••"}
          </code>
          <Button size="sm" variant="ghost" onClick={() => void toggleReveal()}>
            {revealedValue ? "Hide" : "Show"}
          </Button>
        </div>
      </Card>

      <Card title="Metadata">
        <pre className="max-h-72 overflow-auto rounded-md bg-[var(--color-surface-muted)] p-3 text-xs text-[var(--color-text)]">
          {JSON.stringify(secret.metadata ?? {}, null, 2)}
        </pre>
      </Card>

      <Card title="Timeline">
        <dl className="grid gap-2 text-sm text-[var(--color-text)] sm:grid-cols-2">
          <div>
            <dt className="text-[var(--color-text-muted)]">Created</dt>
            <dd className="font-medium">{toDisplayDate(secret.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-[var(--color-text-muted)]">Updated</dt>
            <dd className="font-medium">{toDisplayDate(secret.updatedAt)}</dd>
          </div>
        </dl>
      </Card>
    </section>
  );
}
