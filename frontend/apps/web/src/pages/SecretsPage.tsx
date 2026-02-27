import { useMemo, useState } from "react";
import { appApiClient } from "../api/client";
import { readAppEnv } from "../config/env";
import { metadataByteLength } from "../domain/size-utils";
import { Badge, Button, Card, Input, Table, Textarea, Toast } from "../components/ui";
import { EmptyState } from "../components/states/EmptyState";
import { createSecretSchema } from "../validation";

const MOCK_SECRETS = [
  { id: "sec-001", name: "AWS Deploy Key", updatedAt: "2026-02-22" },
  { id: "sec-002", name: "GCP Billing Token", updatedAt: "2026-02-20" },
];

interface FormErrors {
  name?: string;
  encryptedValue?: string;
  metadata?: string;
}

function toApiMetadata(metadata: Record<string, unknown>): { [key: string]: object } {
  const normalized: { [key: string]: object } = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value === "object" && value !== null) {
      normalized[key] = value;
    }
  }

  return normalized;
}

export function SecretsPage() {
  const [name, setName] = useState("");
  const [encryptedValue, setEncryptedValue] = useState("");
  const [metadataJson, setMetadataJson] = useState('{\n  "service": "aws"\n}');
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const env = readAppEnv();

  const metadataPreviewBytes = useMemo(() => {
    try {
      const parsed = JSON.parse(metadataJson) as Record<string, unknown>;
      return metadataByteLength(parsed);
    } catch {
      return 0;
    }
  }, [metadataJson]);

  const onSubmit = async () => {
    setToastMessage(null);

    let parsedMetadata: Record<string, unknown>;
    try {
      parsedMetadata = JSON.parse(metadataJson) as Record<string, unknown>;
    } catch {
      setFormErrors({ metadata: "Metadata must be valid JSON object." });
      return;
    }

    const parsed = createSecretSchema.safeParse({
      name,
      encryptedValue,
      metadata: parsedMetadata,
    });

    if (!parsed.success) {
      const flattened = parsed.error.flatten();
      setFormErrors({
        name: flattened.fieldErrors.name?.[0],
        encryptedValue: flattened.fieldErrors.encryptedValue?.[0],
        metadata: flattened.fieldErrors.metadata?.[0],
      });
      return;
    }

    setFormErrors({});

    if (env.apiMockingEnabled) {
      setToastMessage("Mock mode enabled: secret payload validated locally.");
      return;
    }

    setSubmitting(true);
    const result = await appApiClient.createSecret({
      ...parsed.data,
      metadata: toApiMetadata(parsed.data.metadata),
    });
    setSubmitting(false);

    if (!result.ok) {
      setToastMessage(`Create secret failed (${result.error.status}): ${result.error.message}`);
      return;
    }

    setToastMessage("Secret create request sent with idempotency key handling.");
    setName("");
    setEncryptedValue("");
  };

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Secrets</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Manage encrypted records available for lease workflows.</p>
      </header>

      {toastMessage ? <Toast title="Secret Create">{toastMessage}</Toast> : null}

      <Card title="Create Secret" description="Phase 3 data-layer wiring with schema and size-limit validation.">
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
            <p>Mocking mode: {env.apiMockingEnabled ? "enabled" : "disabled"}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Textarea
            label="Encrypted Value"
            value={encryptedValue}
            onChange={(event) => setEncryptedValue(event.target.value)}
            error={formErrors.encryptedValue}
            placeholder="2.iv|ciphertext|mac"
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
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Validate & Submit"}
          </Button>
        </div>
      </Card>

      {MOCK_SECRETS.length === 0 ? (
        <EmptyState
          title="No secrets yet"
          message="Create your first encrypted secret to support request fulfillment."
          actionLabel="Create secret"
        />
      ) : (
        <Table
          headers={["Name", "Updated", "Status"]}
          rows={MOCK_SECRETS.map((secret) => [
            secret.name,
            secret.updatedAt,
            <Badge key={`${secret.id}-active`} tone="success">
              Active
            </Badge>,
          ])}
        />
      )}
    </section>
  );
}
