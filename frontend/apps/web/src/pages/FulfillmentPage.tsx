import { useEffect, useState } from "react";
import type { MasterKeys, RequestResponse, RequestResponseTypeEnum, SecretDetailsResponse } from "@agentpassvault/sdk";
import {
  Badge,
  Button,
  Card,
  Input,
  SearchableSelect,
  Tabs,
  Textarea,
  Toast,
  type TabItem,
} from "../components/ui";
import { ErrorState } from "../components/states/ErrorState";
import { appApiClient } from "../api/client";
import { LoginPage } from "./LoginPage";
import { VaultUnlockPage } from "./VaultUnlockPage";
import { SecretCryptoAdapter } from "../security";
import { readAppEnv } from "../config/env";

interface FulfillmentPageProps {
  requestId: string;
  isAuthenticated: boolean;
  adminName: string;
  isVaultLocked: boolean;
  masterKeys: MasterKeys | null;
  onLogin: (username: string, password: string) => Promise<void>;
  onUnlock: (password: string) => Promise<void>;
  onLogout: () => void;
}

type CreateMode = "map-existing" | "create-new";

const CREATE_MODE_TABS: TabItem[] = [
  { id: "map-existing", label: "Map Existing" },
  { id: "create-new", label: "Create New" },
];

function toneForStatus(status: RequestResponse["status"]) {
  if (status === "fulfilled") {
    return "success" as const;
  }
  if (status === "rejected" || status === "abandoned") {
    return "danger" as const;
  }
  return "warning" as const;
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

function isCreateRequest(type: RequestResponseTypeEnum | undefined): boolean {
  return type === "CREATE";
}

function isLeaseRequest(type: RequestResponseTypeEnum | undefined): boolean {
  return type === "LEASE";
}

export function FulfillmentPage({
  requestId,
  isAuthenticated,
  adminName,
  isVaultLocked,
  masterKeys,
  onLogin,
  onUnlock,
  onLogout,
}: FulfillmentPageProps) {
  const env = readAppEnv();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "info" | "success" | "error"; message: string } | null>(null);
  const [request, setRequest] = useState<RequestResponse | null>(null);
  const [secrets, setSecrets] = useState<SecretDetailsResponse[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [createMode, setCreateMode] = useState<CreateMode>("map-existing");
  const [selectedSecretId, setSelectedSecretId] = useState("");
  const [newSecretName, setNewSecretName] = useState("");
  const [newSecretPlaintext, setNewSecretPlaintext] = useState("");
  const [newSecretMetadata, setNewSecretMetadata] = useState("{}");

  const [isPermanentLease, setIsPermanentLease] = useState(false);
  const [leaseExpiry, setLeaseExpiry] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      setNotice(null);

      const requestResult = await appApiClient.getRequest(requestId);
      if (!active) {
        return;
      }

      if (!requestResult.ok) {
        setLoading(false);
        setError(`Load request failed: ${requestResult.error.message}`);
        return;
      }

      setRequest(requestResult.data);
      setNewSecretName(requestResult.data.name ?? "");
      setNewSecretMetadata(stringifyMetadata(requestResult.data.requiredMetadata));

      if (isCreateRequest(requestResult.data.type)) {
        const secretsResult = await appApiClient.listSecrets();
        if (!active) {
          return;
        }

        if (!secretsResult.ok) {
          setError(`Load secrets failed: ${secretsResult.error.message}`);
          setLoading(false);
          return;
        }

        setSecrets(secretsResult.data);
      }

      setLoading(false);
    };

    void load();
    return () => {
      active = false;
    };
  }, [isAuthenticated, requestId]);

  const requireUnlockedVault = () => {
    if (isVaultLocked || !masterKeys) {
      setNotice({ tone: "error", message: "Vault is locked. Confirm master password to continue." });
      return false;
    }
    return true;
  };

  const getLeaseAgentKey = async (agentId: string): Promise<string> => {
    const agentResult = await appApiClient.getAgent(agentId);
    if (!agentResult.ok) {
      throw new Error(`Failed to load agent: ${agentResult.error.message}`);
    }

    if (!agentResult.data.publicKey) {
      throw new Error("Agent has not registered a public key.");
    }

    return agentResult.data.publicKey;
  };

  const createLeaseForPlaintext = async (
    secretId: string,
    agentId: string,
    plaintext: string,
    expiry?: Date,
  ) => {
    const agentPublicKey = await getLeaseAgentKey(agentId);
    const encryptedData = await SecretCryptoAdapter.encryptForAgent(plaintext, agentPublicKey);

    return appApiClient.createLease(secretId, {
      agentId,
      publicKey: agentPublicKey,
      encryptedData,
      expiry,
    });
  };

  const createLeaseForExistingSecret = async (
    secretId: string,
    agentId: string,
    masterKeysForLease: MasterKeys,
    expiry?: Date,
  ) => {
    const secretResult = await appApiClient.getSecret(secretId);
    if (!secretResult.ok) {
      throw new Error(`Failed to load source secret: ${secretResult.error.message}`);
    }

    if (!secretResult.data.encryptedValue) {
      throw new Error("Source secret does not contain encrypted value.");
    }

    let plaintext: string;
    try {
      plaintext = await SecretCryptoAdapter.decryptSecret(secretResult.data.encryptedValue, masterKeysForLease);
    } catch (error) {
      if (!env.apiMockingEnabled) {
        throw new Error(
          error instanceof Error ? `Failed to decrypt source secret: ${error.message}` : "Failed to decrypt source secret.",
        );
      }

      plaintext = secretResult.data.encryptedValue;
    }

    return createLeaseForPlaintext(secretId, agentId, plaintext, expiry);
  };

  const resolveLeaseExpiry = () => {
    if (isPermanentLease || !leaseExpiry) {
      return undefined;
    }

    const parsed = new Date(leaseExpiry);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error("Lease expiry must be a valid date/time.");
    }

    return parsed;
  };

  const submitLeaseApproval = async () => {
    if (!request?.requestId || !request.agentId || !masterKeys) {
      return;
    }

    if (!requireUnlockedVault()) {
      return;
    }

    const leaseSecretId = request.secretId ?? request.mappedSecretId;
    if (!leaseSecretId) {
      setNotice({ tone: "error", message: "This lease request does not contain a secret id." });
      return;
    }

    setSubmitting(true);
    setNotice(null);

    let expiry: Date | undefined;
    try {
      expiry = resolveLeaseExpiry();
    } catch (leaseError) {
      setSubmitting(false);
      setNotice({
        tone: "error",
        message: leaseError instanceof Error ? leaseError.message : "Invalid lease expiry.",
      });
      return;
    }

    let leaseResult;
    try {
      leaseResult = await createLeaseForExistingSecret(leaseSecretId, request.agentId, masterKeys, expiry);
    } catch (leaseError) {
      setSubmitting(false);
      setNotice({
        tone: "error",
        message: leaseError instanceof Error ? leaseError.message : "Lease creation failed.",
      });
      return;
    }
    if (!leaseResult.ok) {
      setSubmitting(false);
      setNotice({ tone: "error", message: `Lease creation failed: ${leaseResult.error.message}` });
      return;
    }

    const updateResult = await appApiClient.updateRequest(request.requestId, {
      status: "fulfilled",
      secretId: leaseSecretId,
    });
    setSubmitting(false);
    if (!updateResult.ok) {
      setNotice({ tone: "error", message: `Request update failed: ${updateResult.error.message}` });
      return;
    }

    setRequest(updateResult.data);
    setNotice({ tone: "success", message: "Lease request approved." });
  };

  const submitMapExisting = async () => {
    if (!request?.requestId || !request.agentId || !selectedSecretId || !masterKeys) {
      return;
    }

    if (!requireUnlockedVault()) {
      return;
    }

    setSubmitting(true);
    setNotice(null);

    let leaseResult;
    try {
      leaseResult = await createLeaseForExistingSecret(selectedSecretId, request.agentId, masterKeys);
    } catch (leaseError) {
      setSubmitting(false);
      setNotice({
        tone: "error",
        message: leaseError instanceof Error ? leaseError.message : "Lease creation failed.",
      });
      return;
    }
    if (!leaseResult.ok) {
      setSubmitting(false);
      setNotice({ tone: "error", message: `Lease creation failed: ${leaseResult.error.message}` });
      return;
    }

    const updateResult = await appApiClient.updateRequest(request.requestId, {
      status: "fulfilled",
      secretId: selectedSecretId,
    });
    setSubmitting(false);
    if (!updateResult.ok) {
      setNotice({ tone: "error", message: `Request update failed: ${updateResult.error.message}` });
      return;
    }

    setRequest(updateResult.data);
    setNotice({ tone: "success", message: "Request fulfilled using existing secret." });
  };

  const submitCreateAndFulfill = async () => {
    if (!request?.requestId || !request.agentId) {
      return;
    }

    if (!requireUnlockedVault() || !masterKeys) {
      return;
    }

    let metadata: Record<string, string>;
    try {
      metadata = parseMetadataInput(newSecretMetadata);
    } catch (metadataError) {
      setNotice({
        tone: "error",
        message: metadataError instanceof Error ? metadataError.message : "Invalid metadata JSON.",
      });
      return;
    }

    setSubmitting(true);
    setNotice(null);

    const encrypted = await SecretCryptoAdapter.encryptPlaintextSecret(
      {
        name: newSecretName,
        plaintextValue: newSecretPlaintext,
        metadata,
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
      setNotice({
        tone: "error",
        message: createResult.ok ? "Create secret succeeded but no secret id was returned." : createResult.error.message,
      });
      return;
    }

    const createdSecretId = createResult.data.secretId;
    let leaseResult;
    try {
      leaseResult = await createLeaseForPlaintext(createdSecretId, request.agentId, newSecretPlaintext);
    } catch (leaseError) {
      setSubmitting(false);
      setNotice({
        tone: "error",
        message: leaseError instanceof Error ? leaseError.message : "Lease creation failed.",
      });
      return;
    }
    if (!leaseResult.ok) {
      setSubmitting(false);
      setNotice({ tone: "error", message: `Lease creation failed: ${leaseResult.error.message}` });
      return;
    }

    const updateResult = await appApiClient.updateRequest(request.requestId, {
      status: "fulfilled",
      secretId: createdSecretId,
    });
    setSubmitting(false);
    if (!updateResult.ok) {
      setNotice({ tone: "error", message: `Request update failed: ${updateResult.error.message}` });
      return;
    }

    setRequest(updateResult.data);
    setNotice({ tone: "success", message: "Request fulfilled with new encrypted secret." });
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={onLogin} />;
  }

  return (
    <div className="min-h-screen bg-[var(--color-app-bg)] px-3 py-4 sm:px-4 sm:py-6">
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <header className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-text-muted)]">AgentPassVault</p>
          <h1 className="mt-1 text-xl font-semibold text-[var(--color-text)]">Fulfillment</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Signed in as {adminName}. This page is independent from the admin console.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href="#/requests"
              className="rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)]"
            >
              Open Admin Console
            </a>
            <Button variant="secondary" size="sm" onClick={onLogout}>
              Logout
            </Button>
          </div>
        </header>

        {notice ? (
          <Toast tone={notice.tone} title="Fulfillment" onDismiss={() => setNotice(null)}>
            {notice.message}
          </Toast>
        ) : null}

        {loading ? <Toast title="Fulfillment">Loading request...</Toast> : null}

        {!loading && error ? (
          <ErrorState title="Request unavailable" message={error} actionLabel="Open Admin Console" onAction={() => {
            window.location.hash = "#/requests";
          }} />
        ) : null}

        {!loading && !error && request ? (
          <section className="space-y-4">
            <Card title={request.name ?? "Unnamed request"} description={request.context ?? "No context provided."}>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={toneForStatus(request.status)}>{request.status ?? "pending"}</Badge>
                <Badge tone="warning">{request.type ?? "unknown"}</Badge>
                <span className="text-xs text-[var(--color-text-muted)]">Agent: {request.agentId ?? "-"}</span>
              </div>
            </Card>

            {request.status !== "pending" ? (
              <Card title="Request Closed" description="This request is no longer actionable." />
            ) : null}

            {request.status === "pending" && (isVaultLocked || !masterKeys) ? (
              <VaultUnlockPage username={adminName} onUnlock={onUnlock} />
            ) : null}

            {request.status === "pending" && isLeaseRequest(request.type) ? (
              <Card title="Approve Lease" description="Approve this lease request directly.">
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm text-[var(--color-text)]">
                    <input
                      type="checkbox"
                      checked={isPermanentLease}
                      onChange={(event) => setIsPermanentLease(event.target.checked)}
                    />
                    Permanent lease
                  </label>

                  {!isPermanentLease ? (
                    <Input
                      label="Lease Expiry"
                      type="datetime-local"
                      value={leaseExpiry}
                      onChange={(event) => setLeaseExpiry(event.target.value)}
                    />
                  ) : null}

                  <Button
                    className="w-full sm:w-auto"
                    disabled={submitting || isVaultLocked || !masterKeys}
                    onClick={() => {
                      void submitLeaseApproval();
                    }}
                  >
                    {submitting ? "Approving..." : "Approve Lease"}
                  </Button>
                </div>
              </Card>
            ) : null}

            {request.status === "pending" && isCreateRequest(request.type) ? (
              <Card title="Fulfill Create Request" description="Map an existing secret or create a new encrypted secret.">
                <div className="space-y-4">
                  <Tabs tabs={CREATE_MODE_TABS} activeId={createMode} onChange={(id) => setCreateMode(id as CreateMode)} />

                  {createMode === "map-existing" ? (
                    <div className="space-y-3">
                      <SearchableSelect
                        label="Select Existing Secret"
                        value={selectedSecretId}
                        onChange={setSelectedSecretId}
                        options={secrets
                          .filter((secret): secret is SecretDetailsResponse & { secretId: string } => Boolean(secret.secretId))
                          .map((secret) => ({
                            value: secret.secretId,
                            label: secret.name ?? secret.secretId,
                          }))}
                        placeholder="Choose a secret"
                        searchPlaceholder="Search by secret name"
                      />
                      <Button
                        className="w-full sm:w-auto"
                        disabled={submitting || !selectedSecretId || isVaultLocked || !masterKeys}
                        onClick={() => {
                          void submitMapExisting();
                        }}
                      >
                        {submitting ? "Submitting..." : "Fulfill With Existing Secret"}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
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
                        placeholder='{"service":"aws"}'
                      />
                      <Button
                        className="w-full sm:w-auto"
                        disabled={submitting || isVaultLocked || !masterKeys}
                        onClick={() => {
                          void submitCreateAndFulfill();
                        }}
                      >
                        {submitting ? "Submitting..." : "Create Secret & Fulfill"}
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ) : null}
          </section>
        ) : null}
      </div>
    </div>
  );
}
