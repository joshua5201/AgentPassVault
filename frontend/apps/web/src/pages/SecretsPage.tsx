import { useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import type { SecretDetailsResponse, MasterKeys } from "@agentpassvault/sdk";
import { appApiClient } from "../api/client";
import {
  Badge,
  Button,
  Card,
  DetailPanel,
  DetailPanelSection,
  EntityBadge,
  Input,
  Modal,
  Textarea,
  Toast,
} from "../components/ui";
import { readAppEnv } from "../config/env";
import { formatDateTime, formatRelativeLabel } from "../mockup/format";
import { type MockupSecret, mockupSecrets } from "../mockup/lofi-data";
import { SecretCryptoAdapter } from "../security";
import { useSessionStore } from "../state/session-store";
import { createSecretSchema } from "../validation";

interface SecretsPageProps {
  isVaultLocked: boolean;
  masterKeys: MasterKeys | null;
  initialSelectedSecretId?: string | null;
  initialSelectedSecretName?: string | null;
}

function normalizeMetadata(
  metadata: SecretDetailsResponse["metadata"],
): Record<string, string> {
  if (!metadata) {
    return {};
  }

  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value === "string") {
      normalized[key] = value;
      continue;
    }

    if (value && typeof value === "object" && "value" in value) {
      normalized[key] =
        typeof value.value === "string"
          ? value.value
          : JSON.stringify(value.value);
      continue;
    }

    normalized[key] = JSON.stringify(value);
  }

  return normalized;
}

function mapSecret(secret: SecretDetailsResponse): MockupSecret {
  const metadata = normalizeMetadata(secret.metadata);

  return {
    id: secret.secretId ?? `secret-${Math.random().toString(36).slice(2)}`,
    name: secret.name ?? "Unnamed secret",
    service: metadata.service ?? "unknown",
    environment: metadata.environment ?? "shared",
    owner: metadata.owner ?? "Unknown owner",
    updatedAt: secret.updatedAt
      ? new Date(secret.updatedAt).toISOString()
      : new Date().toISOString(),
    revealedValue: "Reveal is available in mocked mode for the lo-fi preview.",
    metadata,
    leaseCount: 0,
    activeAgents: [],
    note: "Live mode only exposes list metadata in the current mockup branch.",
  };
}

function parseMetadataJson(raw: string): Record<string, string> {
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Metadata must be a JSON object.");
  }

  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value !== "string") {
      throw new Error(`Metadata value for "${key}" must be a string.`);
    }
    normalized[key] = value;
  }

  return normalized;
}

function toApiMetadata(metadata: Record<string, string>): { [key: string]: object } {
  const output: { [key: string]: object } = {};
  for (const [key, value] of Object.entries(metadata)) {
    output[key] = { value };
  }

  return output;
}

export function SecretsPage({
  isVaultLocked,
  masterKeys,
  initialSelectedSecretId = null,
  initialSelectedSecretName = null,
}: SecretsPageProps) {
  const env = readAppEnv();
  const { accessToken } = useSessionStore();
  const [secrets, setSecrets] = useState<MockupSecret[]>(
    env.apiMockingEnabled ? mockupSecrets : [],
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    mockupSecrets[0]?.id ?? null,
  );
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(!env.apiMockingEnabled);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [newSecretName, setNewSecretName] = useState("");
  const [newSecretPlaintext, setNewSecretPlaintext] = useState("");
  const [newSecretMetadata, setNewSecretMetadata] = useState(
    '{\n  "service": "",\n  "environment": "",\n  "owner": ""\n}',
  );
  const [createErrors, setCreateErrors] = useState<{
    name?: string;
    plaintextValue?: string;
    metadata?: string;
  }>({});
  const lastAppliedSelectionRef = useRef<string | null>(null);

  useEffect(() => {
    if (env.apiMockingEnabled) {
      setSecrets(mockupSecrets);
      setSelectedId(mockupSecrets[0]?.id ?? null);
      setLoading(false);
      return;
    }

    let active = true;
    if (!accessToken) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      const result = await appApiClient.listSecrets();
      if (!active) {
        return;
      }

      if (!result.ok) {
        setLoading(false);
        setError(result.error.message);
        return;
      }

      const mapped = result.data.map((secret) => mapSecret(secret));
      setSecrets(mapped);
      setSelectedId(mapped[0]?.id ?? null);
      setLoading(false);
    };

    void load();
    return () => {
      active = false;
    };
  }, [accessToken, env.apiMockingEnabled]);

  useEffect(() => {
    if (isVaultLocked) {
      setRevealedIds({});
    }
  }, [isVaultLocked]);

  const filteredSecrets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return secrets.filter((secret) => {
      if (!normalizedQuery) {
        return true;
      }

      return (
        secret.name.toLowerCase().includes(normalizedQuery) ||
        secret.service.toLowerCase().includes(normalizedQuery) ||
        secret.environment.toLowerCase().includes(normalizedQuery) ||
        secret.owner.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [query, secrets]);

  useEffect(() => {
    if (!filteredSecrets.some((secret) => secret.id === selectedId)) {
      setSelectedId(filteredSecrets[0]?.id ?? null);
    }
  }, [filteredSecrets, selectedId]);

  useEffect(() => {
    if (!initialSelectedSecretId && !initialSelectedSecretName) {
      return;
    }

    const selectionKey = `${initialSelectedSecretId ?? ""}|${initialSelectedSecretName ?? ""}`;
    if (lastAppliedSelectionRef.current === selectionKey) {
      return;
    }

    const matchedSecret = secrets.find((secret) => {
      if (initialSelectedSecretId && secret.id === initialSelectedSecretId) {
        return true;
      }

      return Boolean(
        initialSelectedSecretName &&
          secret.name.toLowerCase() === initialSelectedSecretName.toLowerCase(),
      );
    });

    lastAppliedSelectionRef.current = selectionKey;
    if (matchedSecret && matchedSecret.id !== selectedId) {
      setSelectedId(matchedSecret.id);
    }
  }, [
    secrets,
    initialSelectedSecretId,
    initialSelectedSecretName,
    selectedId,
  ]);

  const selectedSecret =
    filteredSecrets.find((secret) => secret.id === selectedId) ??
    filteredSecrets[0] ??
    null;

  const toggleReveal = (secretId: string) => {
    if (isVaultLocked || !masterKeys) {
      setNotice("Vault is locked. Unlock before revealing secret values.");
      return;
    }

    setNotice(null);
    setRevealedIds((current) => ({
      ...current,
      [secretId]: !current[secretId],
    }));
  };

  const resetCreateForm = () => {
    setNewSecretName("");
    setNewSecretPlaintext("");
    setNewSecretMetadata(
      '{\n  "service": "",\n  "environment": "",\n  "owner": ""\n}',
    );
    setCreateErrors({});
    setCreateSubmitting(false);
  };

  const handleCreateSecret = async () => {
    if (isVaultLocked || !masterKeys) {
      setNotice("Vault is locked. Unlock before creating secrets.");
      return;
    }

    let metadata: Record<string, string>;
    try {
      metadata = parseMetadataJson(newSecretMetadata);
    } catch (metadataError) {
      setCreateErrors({
        metadata:
          metadataError instanceof Error
            ? metadataError.message
            : "Metadata must be valid JSON.",
      });
      return;
    }

    const parsed = createSecretSchema.safeParse({
      name: newSecretName,
      plaintextValue: newSecretPlaintext,
      metadata,
    });

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setCreateErrors({
        name: fieldErrors.name?.[0],
        plaintextValue: fieldErrors.plaintextValue?.[0],
        metadata: fieldErrors.metadata?.[0],
      });
      return;
    }

    setCreateSubmitting(true);
    setCreateErrors({});
    const createdAt = new Date().toISOString();

    if (env.apiMockingEnabled) {
      const createdSecret: MockupSecret = {
        id: `sec-manual-${Date.now()}`,
        name: parsed.data.name,
        service: metadata.service || "manual",
        environment: metadata.environment || "shared",
        owner: metadata.owner || "Unassigned",
        updatedAt: createdAt,
        revealedValue: parsed.data.plaintextValue,
        metadata,
        leaseCount: 0,
        activeAgents: [],
        note: "Created manually by an operator.",
      };

      setSecrets((current) => [createdSecret, ...current]);
      setSelectedId(createdSecret.id);
      setNotice("Secret created.");
      setCreateOpen(false);
      resetCreateForm();
      return;
    }

    try {
      const encrypted = await SecretCryptoAdapter.encryptPlaintextSecret(
        parsed.data,
        masterKeys,
      );
      const result = await appApiClient.createSecret({
        ...encrypted,
        metadata: toApiMetadata(encrypted.metadata),
      });
      if (!result.ok || !result.data.secretId) {
        setCreateErrors({
          metadata: result.ok
            ? "Secret was created without a secret id."
            : result.error.message,
        });
        setCreateSubmitting(false);
        return;
      }

      const createdSecret: MockupSecret = {
        id: result.data.secretId,
        name: encrypted.name,
        service: metadata.service || "manual",
        environment: metadata.environment || "shared",
        owner: metadata.owner || "Unassigned",
        updatedAt: createdAt,
        revealedValue: parsed.data.plaintextValue,
        metadata,
        leaseCount: 0,
        activeAgents: [],
        note: "Created manually by an operator.",
      };

      setSecrets((current) => [createdSecret, ...current]);
      setSelectedId(createdSecret.id);
      setNotice("Secret created.");
      setCreateOpen(false);
      resetCreateForm();
    } catch (createError) {
      setCreateErrors({
        metadata:
          createError instanceof Error
            ? createError.message
            : "Secret creation failed.",
      });
      setCreateSubmitting(false);
    }
  };

  if (loading) {
    return <Toast title="Secrets">Loading secrets...</Toast>;
  }

  return (
    <section className="flex flex-col gap-4 xl:h-full xl:min-h-0">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent-text)]">
              Secrets
            </p>
            <span className="inline-flex items-center rounded-full border border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--color-accent-text)]">
              Stored {secrets.length}
            </span>
          </div>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Inspect values quickly while ownership, metadata, and lease exposure
            remain visible.
          </p>
        </div>
      </header>

      {notice ? (
        <Toast title="Secrets" onDismiss={() => setNotice(null)}>
          {notice}
        </Toast>
      ) : null}
      {error ? (
        <Toast tone="error" title="Secrets">
          {error}
        </Toast>
      ) : null}

      <div className="grid gap-4 xl:min-h-0 xl:flex-1 xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)] xl:overflow-hidden">
        <Card className="flex min-h-[720px] flex-col overflow-hidden xl:h-full xl:min-h-0">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-xs text-[var(--color-text-muted)]">
              Quick reveal is available directly in the list.
            </p>
            <Button
              variant="secondary"
              size="sm"
              startIcon={<Plus className="h-4 w-4" />}
              onClick={() => setCreateOpen(true)}
            >
              Create Secret
            </Button>
          </div>

          <div className="mb-4">
            <Input
              label="Search secrets"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by secret, service, owner, or environment"
            />
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {filteredSecrets.map((secret) => {
              const isSelected = secret.id === selectedSecret?.id;
              const isRevealed = Boolean(revealedIds[secret.id]);

              return (
                <div
                  key={secret.id}
                  className={`rounded-[var(--radius-card)] border p-4 transition ${
                    isSelected
                      ? "border-[var(--color-accent-strong)] border-l-4 border-l-[var(--color-accent-strong)] bg-[var(--color-surface)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => setSelectedId(secret.id)}
                    >
                      <div className="flex items-center gap-2">
                        <Badge tone="neutral">{secret.service}</Badge>
                        <span className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-text-subtle)]">
                          {secret.environment}
                        </span>
                      </div>
                      <h2 className="mt-2 truncate text-sm font-semibold text-[var(--color-text)]">
                        {secret.name}
                      </h2>
                      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        {secret.note}
                      </p>
                    </button>
                    <div className="text-right text-xs text-[var(--color-text-subtle)]">
                      <p>{formatRelativeLabel(secret.updatedAt)}</p>
                      <p className="mt-1">{formatDateTime(secret.updatedAt)}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="truncate text-xs text-[var(--color-text-muted)]">
                      Owner: {secret.owner}
                    </p>
                    <button
                      type="button"
                      onClick={() => toggleReveal(secret.id)}
                      className="text-xs font-semibold text-[var(--color-primary)]"
                    >
                      {isRevealed ? "Hide" : "Reveal"}
                    </button>
                  </div>

                  {isRevealed ? (
                    <pre className="mt-3 overflow-x-auto rounded-[var(--radius-panel)] bg-[var(--color-surface-subtle)] p-3 text-xs leading-6 text-[var(--color-text)]">
                      {secret.revealedValue}
                    </pre>
                  ) : null}
                </div>
              );
            })}

            {filteredSecrets.length === 0 ? (
              <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-4 py-10 text-center text-sm text-[var(--color-text-muted)]">
                No secrets match the current query.
              </div>
            ) : null}
          </div>
        </Card>

        <div className="xl:min-h-0 xl:pl-2">
          {selectedSecret ? (
            <DetailPanel
              tone="secrets"
              eyebrow="Selected secret"
              heading={
                <h2 className="text-xl font-semibold tracking-[-0.02em]">
                  {selectedSecret.name}
                </h2>
              }
              description={selectedSecret.note}
              actions={
                <Badge tone="neutral">{selectedSecret.environment}</Badge>
              }
              copyLink={`#/secrets?secret=${encodeURIComponent(selectedSecret.id)}`}
              className="min-h-[720px] xl:h-full xl:min-h-0"
            >
              <DetailPanelSection heading="Overview">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-subtle)]">
                      Service
                    </p>
                    <p className="mt-1 text-sm text-[var(--color-text)]">
                      {selectedSecret.service}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-subtle)]">
                      Owner
                    </p>
                    <p className="mt-1 text-sm text-[var(--color-text)]">
                      {selectedSecret.owner}
                    </p>
                  </div>
                </div>
              </DetailPanelSection>

              <DetailPanelSection heading="Value preview">
                <pre className="overflow-x-auto rounded-[var(--radius-panel)] bg-[var(--color-surface-subtle)] p-4 text-xs leading-6 text-[var(--color-text)]">
                  {revealedIds[selectedSecret.id]
                    ? selectedSecret.revealedValue
                    : "••••••••••••••••••••••••••••"}
                </pre>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => toggleReveal(selectedSecret.id)}
                  >
                    {revealedIds[selectedSecret.id]
                      ? "Hide value"
                      : "Reveal value"}
                  </Button>
                </div>
              </DetailPanelSection>

              <DetailPanelSection heading="Exposure and metadata">
                <div className="grid gap-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-subtle)]">
                      Lease exposure
                    </p>
                    <dl className="mt-2 grid gap-3 text-sm text-[var(--color-text)]">
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-[var(--color-text-muted)]">
                          Active leases
                        </dt>
                        <dd>{selectedSecret.leaseCount}</dd>
                      </div>
                      <div>
                        <dt className="text-[var(--color-text-muted)]">
                          Active agents
                        </dt>
                        <dd className="mt-2 flex flex-wrap gap-2">
                          {selectedSecret.activeAgents.map((agent) => (
                            <EntityBadge
                              key={agent}
                              kind="agent"
                              href={`#/agents?agentName=${encodeURIComponent(agent)}`}
                            >
                              {agent}
                            </EntityBadge>
                          ))}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-subtle)]">
                      Metadata
                    </p>
                    <pre className="mt-2 overflow-x-auto rounded-[var(--radius-panel)] bg-[var(--color-surface-subtle)] p-4 text-xs leading-6 text-[var(--color-text)]">
                      {JSON.stringify(selectedSecret.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              </DetailPanelSection>
            </DetailPanel>
          ) : (
            <DetailPanel
              tone="secrets"
              eyebrow="Selected secret"
              heading={
                <h2 className="text-lg font-semibold">No secret selected</h2>
              }
              description="The detail pane will remain empty until a visible secret is selected."
              className="min-h-[720px] xl:h-full xl:min-h-0"
            />
          )}
        </div>
      </div>

      <Modal
        open={createOpen}
        title="Create Secret"
        confirmLabel={createSubmitting ? "Creating..." : "Create Secret"}
        onClose={() => {
          setCreateOpen(false);
          resetCreateForm();
        }}
        onConfirm={createSubmitting ? undefined : handleCreateSecret}
      >
        <div className="space-y-4">
          <Input
            label="Secret name"
            value={newSecretName}
            onChange={(event) => setNewSecretName(event.target.value)}
            error={createErrors.name}
            placeholder="GitHub Release Token"
          />
          <Textarea
            label="Plaintext secret value"
            value={newSecretPlaintext}
            onChange={(event) => setNewSecretPlaintext(event.target.value)}
            error={createErrors.plaintextValue}
            placeholder="Paste the secret value"
          />
          <Textarea
            label="Metadata JSON"
            value={newSecretMetadata}
            onChange={(event) => setNewSecretMetadata(event.target.value)}
            error={createErrors.metadata}
            hint='Example: {"service":"github","environment":"prod","owner":"Release Engineering"}'
            className="min-h-32 font-mono text-xs"
          />
        </div>
      </Modal>
    </section>
  );
}
