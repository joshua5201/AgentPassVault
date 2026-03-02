import { useEffect, useMemo, useState } from "react";
import type { MasterKeys, RequestResponse, SecretDetailsResponse } from "@agentpassvault/sdk";
import { appApiClient } from "../api/client";
import { ErrorState } from "../components/states/ErrorState";
import { Badge, Button, Card, Toast } from "../components/ui";
import { useSessionStore } from "../state/session-store";
import { readAppEnv } from "../config/env";

interface RequestDetailPageProps {
  requestId: string;
  onBack: () => void;
  isVaultLocked: boolean;
  masterKeys: MasterKeys | null;
  onNotify: (message: string, tone?: "info" | "success" | "error") => void;
}

function toneForStatus(status: RequestResponse["status"]) {
  if (status === "fulfilled") {
    return "success" as const;
  }
  if (status === "rejected" || status === "abandoned") {
    return "danger" as const;
  }
  return "warning" as const;
}

export function RequestDetailPage({ requestId, onBack }: RequestDetailPageProps) {
  const env = readAppEnv();
  const { accessToken } = useSessionStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [request, setRequest] = useState<RequestResponse | null>(null);
  const [secrets, setSecrets] = useState<SecretDetailsResponse[]>([]);
  const canFetch = import.meta.env.MODE === "test" || env.apiMockingEnabled || Boolean(accessToken);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!canFetch) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const [requestResult, secretsResult] = await Promise.all([
        appApiClient.getRequest(requestId),
        appApiClient.listSecrets(),
      ]);

      if (!active) {
        return;
      }

      setLoading(false);
      if (!requestResult.ok) {
        setError(requestResult.error.message);
        return;
      }

      setRequest(requestResult.data);

      if (secretsResult.ok) {
        setSecrets(secretsResult.data);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [canFetch, requestId]);

  const linkedSecret = useMemo(
    () => secrets.find((secret) => secret.secretId === (request?.secretId ?? request?.mappedSecretId)),
    [request?.mappedSecretId, request?.secretId, secrets],
  );

  if (loading) {
    return <Toast title="Request Detail">Loading request detail...</Toast>;
  }

  if (error || !request) {
    return (
      <ErrorState
        title="Request not found"
        message={error ?? "The selected request could not be loaded."}
        actionLabel="Back to requests"
        onAction={onBack}
      />
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">{request.name ?? "Unnamed request"}</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{request.context ?? "No context provided."}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={toneForStatus(request.status)}>{request.status ?? "pending"}</Badge>
          <Button variant="secondary" onClick={onBack}>
            Back
          </Button>
        </div>
      </div>

      <Card title="Type" description="Request classification and current mapping state.">
        <dl className="grid gap-2 text-sm text-[var(--color-text)] sm:grid-cols-2">
          <div>
            <dt className="text-[var(--color-text-muted)]">Type</dt>
            <dd className="font-medium">{request.type ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-[var(--color-text-muted)]">Agent ID</dt>
            <dd className="font-medium">{request.agentId ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-[var(--color-text-muted)]">Linked Secret</dt>
            <dd className="font-medium">{linkedSecret?.name ?? request.secretName ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-[var(--color-text-muted)]">Request ID</dt>
            <dd className="font-medium">{request.requestId ?? "-"}</dd>
          </div>
        </dl>
      </Card>

      <Card title="Requirements" description="Required fields and metadata from requesting agent.">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium text-[var(--color-text)]">Required Secret Fields</p>
            <ul className="space-y-2 text-sm text-[var(--color-text)]">
              {(request.requiredFieldsInSecretValue ?? []).map((field) => (
                <li key={field} className="rounded-md bg-[var(--color-surface-muted)] px-3 py-2">
                  {field}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-[var(--color-text)]">Required Metadata</p>
            <pre className="max-h-48 overflow-auto rounded-md bg-[var(--color-surface-muted)] p-3 text-xs text-[var(--color-text)]">
              {JSON.stringify(request.requiredMetadata ?? {}, null, 2)}
            </pre>
          </div>
        </div>
      </Card>

      <Card title="Fulfillment" description="Fulfillment actions are completed in the standalone page.">
        <div className="flex flex-wrap gap-2">
          {request.requestId && request.status === "pending" ? (
            <a
              href={`#/fulfill/${request.requestId}`}
              className="rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)]"
            >
              Open Fulfillment Page
            </a>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">This request is no longer actionable.</p>
          )}
        </div>
      </Card>
    </section>
  );
}
