import { useEffect, useMemo, useState } from "react";
import type { MasterKeys } from "@agentpassvault/sdk";
import { CryptoService } from "@agentpassvault/sdk";
import { appApiClient } from "../api/client";
import { metadataByteLength, validateEncryptedValueSize } from "../domain/size-utils";
import { Button, Card, Input, Textarea, Toast } from "../components/ui";
import { SecretCryptoAdapter } from "../security";
import { createSecretSchema } from "../validation";
import { useSecretsCatalog } from "../hooks/use-secrets-catalog";
import { SecretsCatalogView, type SecretCatalogRow } from "../components/secrets/SecretsCatalogView";

interface FormErrors {
  name?: string;
  plaintextValue?: string;
  metadata?: string;
}

interface SecretsPageProps {
  isVaultLocked: boolean;
  masterKeys: MasterKeys | null;
  onOpenSecret: (secretId: string) => void;
}

function parseMetadataJson(raw: string): { parsed?: Record<string, string>; error?: string } {
  let parsedValue: unknown;

  try {
    parsedValue = JSON.parse(raw);
  } catch {
    return { error: "Metadata must be valid JSON object." };
  }

  if (!parsedValue || typeof parsedValue !== "object" || Array.isArray(parsedValue)) {
    return { error: "Metadata must be a JSON object with string values." };
  }

  const parsedObject = parsedValue as Record<string, unknown>;
  const normalized: Record<string, string> = {};

  for (const [key, value] of Object.entries(parsedObject)) {
    if (typeof value !== "string") {
      return { error: `Metadata value for \"${key}\" must be a string.` };
    }
    normalized[key] = value;
  }

  return { parsed: normalized };
}

function toApiMetadata(metadata: Record<string, string>): { [key: string]: object } {
  const output: { [key: string]: object } = {};
  for (const [key, value] of Object.entries(metadata)) {
    output[key] = { value };
  }

  return output;
}

export function SecretsPage({ isVaultLocked, masterKeys, onOpenSecret }: SecretsPageProps) {
  const [name, setName] = useState("");
  const [plaintextValue, setPlaintextValue] = useState("");
  const [metadataJson, setMetadataJson] = useState('{\n  "service": "aws"\n}');
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dismissedCatalogError, setDismissedCatalogError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [localSecrets, setLocalSecrets] = useState<SecretCatalogRow[]>([]);
  const [revealedSecret, setRevealedSecret] = useState<Record<string, string>>({});
  const secretsCatalog = useSecretsCatalog();

  useEffect(() => {
    if (isVaultLocked) {
      setRevealedSecret({});
    }
  }, [isVaultLocked]);

  const metadataPreviewBytes = useMemo(() => {
    const parsedResult = parseMetadataJson(metadataJson);
    if (!parsedResult.parsed) {
      return 0;
    }

    return metadataByteLength(parsedResult.parsed);
  }, [metadataJson]);

  const onSubmit = async () => {
    setToastMessage(null);

    if (isVaultLocked || !masterKeys) {
      setToastMessage("Vault is locked. Unlock before creating secrets.");
      return;
    }

    const metadataResult = parseMetadataJson(metadataJson);
    if (!metadataResult.parsed) {
      setFormErrors({ metadata: metadataResult.error });
      return;
    }

    const parsed = createSecretSchema.safeParse({
      name,
      plaintextValue,
      metadata: metadataResult.parsed,
    });

    if (!parsed.success) {
      const flattened = parsed.error.flatten();
      setFormErrors({
        name: flattened.fieldErrors.name?.[0],
        plaintextValue: flattened.fieldErrors.plaintextValue?.[0],
        metadata: flattened.fieldErrors.metadata?.[0],
      });
      return;
    }

    const encrypted = await SecretCryptoAdapter.encryptPlaintextSecret(parsed.data, masterKeys);
    const encryptedSizeError = validateEncryptedValueSize(encrypted.encryptedValue);
    if (encryptedSizeError) {
      setFormErrors({ plaintextValue: encryptedSizeError });
      return;
    }

    setFormErrors({});

    const localSecret: SecretCatalogRow = {
      id: `local-${Date.now()}`,
      name: encrypted.name,
      encryptedValue: encrypted.encryptedValue,
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    setLocalSecrets((prev) => [localSecret, ...prev]);

    setSubmitting(true);
    const result = await appApiClient.createSecret({
      name: encrypted.name,
      encryptedValue: encrypted.encryptedValue,
      metadata: toApiMetadata(encrypted.metadata),
    });
    setSubmitting(false);

    if (!result.ok) {
      setToastMessage(`Create secret failed (${result.error.status}): ${result.error.message}`);
      return;
    }

    secretsCatalog.prependCreatedSecret(result.data);

    setToastMessage("Secret encrypted locally and submitted successfully.");

    setName("");
    setPlaintextValue("");
  };

  const handleToggleReveal = async (secret: SecretCatalogRow) => {
    if (isVaultLocked || !masterKeys) {
      setToastMessage("Vault is locked. Unlock before revealing values.");
      return;
    }

    const isVisible = Boolean(revealedSecret[secret.id]);
    if (isVisible) {
      setRevealedSecret((prev) => {
        const next = { ...prev };
        delete next[secret.id];
        return next;
      });
      return;
    }

    const decrypted = await CryptoService.decryptSymmetric(
      secret.encryptedValue,
      masterKeys.encKey,
      masterKeys.macKey,
    );

    setRevealedSecret((prev) => ({ ...prev, [secret.id]: decrypted }));
  };

  const tableRows = [
    ...localSecrets,
    ...secretsCatalog.items
      .filter((persisted) => !localSecrets.some((local) => local.id === persisted.id))
      .map((item) => ({ ...item, encryptedValue: "" })),
  ];

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Secrets</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Plaintext input is encrypted locally before API submission.
        </p>
      </header>

      {toastMessage ? (
        <Toast title="Secret Create" onDismiss={() => setToastMessage(null)}>
          {toastMessage}
        </Toast>
      ) : null}
      {secretsCatalog.error && secretsCatalog.error !== dismissedCatalogError ? (
        <Toast
          tone="error"
          title="Secrets"
          onDismiss={() => {
            setDismissedCatalogError(secretsCatalog.error ?? null);
          }}
        >
          {secretsCatalog.error}
        </Toast>
      ) : null}

      <Card title="Create Secret" description="MVP accepts plaintext string and encrypts before send.">
        <div className="grid gap-4 lg:grid-cols-2">
          <Input
            label="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            error={formErrors.name}
            placeholder="AWS Production Credentials"
          />
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-xs text-[var(--color-text-muted)]">
            <p>Metadata bytes (estimated): {metadataPreviewBytes}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Textarea
            label="Secret Value (Plaintext)"
            value={plaintextValue}
            onChange={(event) => setPlaintextValue(event.target.value)}
            error={formErrors.plaintextValue}
            placeholder="my-super-secret-value"
          />
          <Textarea
            label="Metadata JSON"
            value={metadataJson}
            onChange={(event) => setMetadataJson(event.target.value)}
            error={formErrors.metadata}
            placeholder='{"service":"aws"}'
          />
        </div>

        <div className="mt-4 flex justify-end">
          <Button onClick={onSubmit} disabled={submitting || isVaultLocked}>
            {submitting ? "Submitting..." : "Encrypt & Submit"}
          </Button>
        </div>
      </Card>

      <SecretsCatalogView
        loading={secretsCatalog.loading}
        rows={tableRows}
        revealedValues={revealedSecret}
        onToggleReveal={(secret) => {
          void handleToggleReveal(secret);
        }}
        onView={(secret) => {
          onOpenSecret(secret.id);
        }}
      />
    </section>
  );
}
