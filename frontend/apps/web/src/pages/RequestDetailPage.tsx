import { useEffect, useMemo, useState } from "react";
import type { MasterKeys, RequestResponse, SecretMetadataResponse } from "@agentpassvault/sdk";
import { appApiClient } from "../api/client";
import { ErrorState } from "../components/states/ErrorState";
import { Badge, Button, Card, Input, Select, Textarea, Toast } from "../components/ui";
import { SecretCryptoAdapter } from "../security";

interface RequestDetailPageProps {
  requestId: string;
  onBack: () => void;
  isVaultLocked: boolean;
  masterKeys: MasterKeys | null;
  onNotify: (message: string, tone?: "info" | "success" | "error") => void;
}

function stringifyMetadata(metadata: RequestResponse["requiredMetadata"]): string {
  if (!metadata) {
    return "{}";
  }

  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(metadata)) {
    const record = value as { value?: string };
    normalized[key] = record.value ?? "";
  }

  return JSON.stringify(normalized, null, 2);
}

function parseMetadataInput(raw: string): Record<string, string> {
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Metadata must be a JSON object.");
  }

  const output: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value !== "string") {
      throw new Error(`Metadata value for "${key}" must be a string.`);
    }
    output[key] = value;
  }

  return output;
}

function toApiMetadata(metadata: Record<string, string>): { [key: string]: object } {
  const output: { [key: string]: object } = {};
  for (const [key, value] of Object.entries(metadata)) {
    output[key] = { value };
  }
  return output;
}

export function RequestDetailPage({ requestId, onBack, isVaultLocked, masterKeys, onNotify }: RequestDetailPageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [request, setRequest] = useState<RequestResponse | null>(null);
  const [secrets, setSecrets] = useState<SecretMetadataResponse[]>([]);
  const [selectedSecretId, setSelectedSecretId] = useState("");
  const [newSecretName, setNewSecretName] = useState("");
  const [newSecretPlaintext, setNewSecretPlaintext] = useState("");
  const [newSecretMetadata, setNewSecretMetadata] = useState("{}");
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
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
      setNewSecretName(requestResult.data.name ?? "");
      setNewSecretMetadata(stringifyMetadata(requestResult.data.requiredMetadata));

      if (secretsResult.ok) {
        setSecrets(secretsResult.data);
      } else {
        onNotify(`Unable to load secrets list: ${secretsResult.error.message}`, "error");
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [onNotify, requestId]);

  const selectedSecret = useMemo(
    () => secrets.find((secret) => secret.secretId === selectedSecretId),
    [selectedSecretId, secrets],
  );

  const submitMapExisting = async () => {
    if (!request?.requestId || !request.agentId) {
      return;
    }
    if (!selectedSecretId) {
      onNotify("Select a secret to fulfill this request.", "error");
      return;
    }

    setSubmitting(true);
    const leaseResult = await appApiClient.createLease(selectedSecretId, {
      agentId: request.agentId,
      publicKey: "mock-agent-public-key",
      encryptedData: "mock-encrypted-lease-payload",
    });
    if (!leaseResult.ok) {
      setSubmitting(false);
      onNotify(`Lease creation failed: ${leaseResult.error.message}`, "error");
      return;
    }

    const updateResult = await appApiClient.updateRequest(request.requestId, {
      status: "fulfilled",
      secretId: selectedSecretId,
    });
    setSubmitting(false);
    if (!updateResult.ok) {
      onNotify(`Request update failed: ${updateResult.error.message}`, "error");
      return;
    }

    setRequest(updateResult.data);
    onNotify("Request fulfilled using existing secret.", "success");
  };

  const submitCreateAndFulfill = async () => {
    if (!request?.requestId || !request.agentId) {
      return;
    }
    if (isVaultLocked || !masterKeys) {
      onNotify("Vault is locked. Unlock before creating and fulfilling secrets.", "error");
      return;
    }

    let parsedMetadata: Record<string, string>;
    try {
      parsedMetadata = parseMetadataInput(newSecretMetadata);
    } catch (metadataError) {
      const message = metadataError instanceof Error ? metadataError.message : "Invalid metadata JSON.";
      onNotify(message, "error");
      return;
    }

    setSubmitting(true);
    const encrypted = await SecretCryptoAdapter.encryptPlaintextSecret(
      {
        name: newSecretName,
        plaintextValue: newSecretPlaintext,
        metadata: parsedMetadata,
      },
      masterKeys,
    );

    const createResult = await appApiClient.createSecret({
      name: encrypted.name,
      encryptedValue: encrypted.encryptedValue,
      metadata: toApiMetadata(encrypted.metadata),
    });

    if (!createResult.ok || !createResult.data.secretId) {
      setSubmitting(false);
      onNotify(
        createResult.ok ? "Create secret succeeded but no secret id was returned." : createResult.error.message,
        "error",
      );
      return;
    }

    const createdSecretId = createResult.data.secretId;
    const leaseResult = await appApiClient.createLease(createdSecretId, {
      agentId: request.agentId,
      publicKey: "mock-agent-public-key",
      encryptedData: "mock-encrypted-lease-payload",
    });
    if (!leaseResult.ok) {
      setSubmitting(false);
      onNotify(`Lease creation failed: ${leaseResult.error.message}`, "error");
      return;
    }

    const updateResult = await appApiClient.updateRequest(request.requestId, {
      status: "fulfilled",
      secretId: createdSecretId,
    });
    setSubmitting(false);
    if (!updateResult.ok) {
      onNotify(`Request update failed: ${updateResult.error.message}`, "error");
      return;
    }

    setRequest(updateResult.data);
    onNotify("Request fulfilled with new encrypted secret.", "success");
  };

  const submitReject = async () => {
    if (!request?.requestId) {
      return;
    }
    if (rejectionReason.trim().length < 3) {
      onNotify("Provide a rejection reason with at least 3 characters.", "error");
      return;
    }

    setSubmitting(true);
    const updateResult = await appApiClient.updateRequest(request.requestId, {
      status: "rejected",
      rejectionReason: rejectionReason.trim(),
    });
    setSubmitting(false);
    if (!updateResult.ok) {
      onNotify(`Request rejection failed: ${updateResult.error.message}`, "error");
      return;
    }

    setRequest(updateResult.data);
    onNotify("Request rejected.", "success");
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">{request.name ?? "Unnamed request"}</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{request.context ?? "No context provided."}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={request.status === "fulfilled" ? "success" : request.status === "rejected" ? "danger" : "warning"}>
            {request.status ?? "pending"}
          </Badge>
          <Button variant="secondary" onClick={onBack}>
            Back
          </Button>
        </div>
      </div>

      <Card title="Requirements" description="Fields and metadata required by the requesting agent.">
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

      <Card title="Fulfill With Existing Secret" description="Map a matching secret and issue a lease.">
        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <Select label="Select Secret" value={selectedSecretId} onChange={(event) => setSelectedSecretId(event.target.value)}>
            <option value="">Choose a secret</option>
            {secrets.map((secret) => (
              <option key={secret.secretId} value={secret.secretId}>
                {secret.name}
              </option>
            ))}
          </Select>
          <div className="flex items-end">
            <Button onClick={() => void submitMapExisting()} disabled={submitting || !selectedSecretId}>
              Fulfill With Existing
            </Button>
          </div>
        </div>
        {selectedSecret ? (
          <p className="mt-3 text-xs text-[var(--color-text-muted)]">Selected: {selectedSecret.name}</p>
        ) : null}
      </Card>

      <Card title="Create Secret Then Fulfill" description="Encrypt plaintext locally, create secret, then create lease.">
        <div className="space-y-4">
          <Input
            label="Secret Name"
            value={newSecretName}
            onChange={(event) => setNewSecretName(event.target.value)}
            placeholder="AWS Production Credentials"
          />
          <Textarea
            label="Secret Value (Plaintext)"
            value={newSecretPlaintext}
            onChange={(event) => setNewSecretPlaintext(event.target.value)}
            placeholder="my-super-secret-value"
          />
          <Textarea
            label="Metadata JSON"
            value={newSecretMetadata}
            onChange={(event) => setNewSecretMetadata(event.target.value)}
          />
          <div className="flex justify-end">
            <Button
              onClick={() => void submitCreateAndFulfill()}
              disabled={submitting || isVaultLocked || !newSecretName || !newSecretPlaintext}
            >
              Encrypt + Create + Fulfill
            </Button>
          </div>
        </div>
      </Card>

      <Card title="Reject Request" description="Reject with a reason when fulfillment is not possible.">
        <div className="space-y-4">
          <Textarea
            label="Rejection Reason"
            value={rejectionReason}
            onChange={(event) => setRejectionReason(event.target.value)}
            placeholder="Required secret values are unavailable."
          />
          <div className="flex justify-end">
            <Button variant="danger" onClick={() => void submitReject()} disabled={submitting}>
              Reject Request
            </Button>
          </div>
        </div>
      </Card>
    </section>
  );
}
