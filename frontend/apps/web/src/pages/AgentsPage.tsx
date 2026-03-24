import { useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import type { AgentResponse } from "@agentpassvault/sdk";
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
  Toast,
} from "../components/ui";
import { readAppEnv } from "../config/env";
import { formatDateTime, formatRelativeLabel } from "../mockup/format";
import { type MockupAgent, mockupAgents } from "../mockup/lofi-data";
import { useSessionStore } from "../state/session-store";

function mapAgent(agent: AgentResponse): MockupAgent {
  const fingerprintSource = agent.publicKey ?? agent.agentId ?? "unknown";

  return {
    id: agent.agentId ?? `agent-${Math.random().toString(36).slice(2)}`,
    name: agent.name ?? agent.agentId ?? "Unnamed agent",
    displayName: agent.displayName ?? agent.name ?? "Unnamed agent",
    environment: "shared",
    publicKeyState: agent.publicKey
      ? "RSA-OAEP-4096 key present"
      : "No key registered",
    keyFingerprint: fingerprintSource.slice(0, 16),
    lastActivityAt: agent.createdAt
      ? new Date(agent.createdAt).toISOString()
      : new Date().toISOString(),
    activeLeases: 0,
    linkedSecrets: [],
    note: "Live mode exposes agent identity data only in the current mockup branch.",
    risk: agent.publicKey ? "stable" : "attention",
  };
}

interface AgentsPageProps {
  initialSelectedAgentId?: string | null;
  initialSelectedAgentName?: string | null;
}

export function AgentsPage({
  initialSelectedAgentId = null,
  initialSelectedAgentName = null,
}: AgentsPageProps) {
  const env = readAppEnv();
  const { accessToken } = useSessionStore();
  const [agents, setAgents] = useState<MockupAgent[]>(
    env.apiMockingEnabled ? mockupAgents : [],
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    mockupAgents[0]?.id ?? null,
  );
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(!env.apiMockingEnabled);
  const [error, setError] = useState<string | null>(null);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [newAgentName, setNewAgentName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdAgentCredentials, setCreatedAgentCredentials] = useState<{
    agentId: string;
    appToken: string;
  } | null>(null);
  const lastAppliedSelectionRef = useRef<string | null>(null);

  useEffect(() => {
    if (env.apiMockingEnabled) {
      setAgents(mockupAgents);
      setSelectedId(mockupAgents[0]?.id ?? null);
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
      const result = await appApiClient.listAgents();
      if (!active) {
        return;
      }

      if (!result.ok) {
        setLoading(false);
        setError(result.error.message);
        return;
      }

      const mapped = result.data.map((agent) => mapAgent(agent));
      setAgents(mapped);
      setSelectedId(mapped[0]?.id ?? null);
      setLoading(false);
    };

    void load();
    return () => {
      active = false;
    };
  }, [accessToken, env.apiMockingEnabled]);

  const filteredAgents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return agents.filter((agent) => {
      if (!normalizedQuery) {
        return true;
      }

      return (
        agent.name.toLowerCase().includes(normalizedQuery) ||
        agent.displayName.toLowerCase().includes(normalizedQuery) ||
        agent.environment.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [agents, query]);

  useEffect(() => {
    if (!filteredAgents.some((agent) => agent.id === selectedId)) {
      setSelectedId(filteredAgents[0]?.id ?? null);
    }
  }, [filteredAgents, selectedId]);

  useEffect(() => {
    if (!initialSelectedAgentId && !initialSelectedAgentName) {
      return;
    }

    const selectionKey = `${initialSelectedAgentId ?? ""}|${initialSelectedAgentName ?? ""}`;
    if (lastAppliedSelectionRef.current === selectionKey) {
      return;
    }

    const matchedAgent = agents.find((agent) => {
      if (initialSelectedAgentId && agent.id === initialSelectedAgentId) {
        return true;
      }

      return Boolean(
        initialSelectedAgentName &&
          agent.name.toLowerCase() === initialSelectedAgentName.toLowerCase(),
      );
    });

    lastAppliedSelectionRef.current = selectionKey;
    if (matchedAgent && matchedAgent.id !== selectedId) {
      setSelectedId(matchedAgent.id);
    }
  }, [
    agents,
    initialSelectedAgentId,
    initialSelectedAgentName,
    selectedId,
  ]);

  const selectedAgent =
    filteredAgents.find((agent) => agent.id === selectedId) ??
    filteredAgents[0] ??
    null;

  const resetCreateAgentForm = () => {
    setNewAgentName("");
    setCreateError(null);
    setCreateSubmitting(false);
  };

  const handleCreateAgent = async () => {
    const trimmedName = newAgentName.trim();
    if (!trimmedName) {
      setCreateError("Agent name is required.");
      return;
    }

    setCreateSubmitting(true);
    setCreateError(null);
    const createdAt = new Date().toISOString();

    let agentId = `agent-manual-${Date.now()}`;
    let appToken = `mock-app-token-${Math.random().toString(36).slice(2, 10)}`;

    if (!env.apiMockingEnabled) {
      const result = await appApiClient.createAgent({ name: trimmedName });
      if (!result.ok || !result.data.agentId || !result.data.appToken) {
        setCreateError(
          result.ok
            ? "Agent was created without returning credentials."
            : result.error.message,
        );
        setCreateSubmitting(false);
        return;
      }

      agentId = result.data.agentId;
      appToken = result.data.appToken;
    }

    const createdAgent: MockupAgent = {
      id: agentId,
      name: trimmedName,
      displayName: trimmedName,
      environment: "shared",
      publicKeyState: "No key registered",
      keyFingerprint: "Pending registration",
      lastActivityAt: createdAt,
      activeLeases: 0,
      linkedSecrets: [],
      note: "Newly created agent. Public key registration is still required.",
      risk: "attention",
    };

    setAgents((current) => [createdAgent, ...current]);
    setSelectedId(createdAgent.id);
    setCreatedAgentCredentials({ agentId, appToken });
    setCreateOpen(false);
    resetCreateAgentForm();
  };

  if (loading) {
    return <Toast title="Agents">Loading agents...</Toast>;
  }

  return (
    <section className="flex flex-col gap-4 xl:h-full xl:min-h-0">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent-text)]">
              Agents
            </p>
            <span className="inline-flex items-center rounded-full border border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--color-accent-text)]">
              Registered {agents.length}
            </span>
          </div>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Identity state, key posture, and lease exposure stay available in
            one operational view.
          </p>
        </div>
      </header>

      {error ? (
        <Toast tone="error" title="Agents">
          {error}
        </Toast>
      ) : null}

      <div className="grid gap-4 xl:min-h-0 xl:flex-1 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.95fr)] xl:overflow-hidden">
        <Card className="flex min-h-[680px] flex-col overflow-hidden xl:h-full xl:min-h-0">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-xs text-[var(--color-text-muted)]">
              Select an agent to inspect key registration and lease posture.
            </p>
            <Button
              variant="secondary"
              size="sm"
              startIcon={<Plus className="h-4 w-4" />}
              onClick={() => setCreateOpen(true)}
            >
              Create Agent
            </Button>
          </div>

          <div className="mb-4">
            <Input
              label="Search agents"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by agent, display name, or environment"
            />
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {filteredAgents.map((agent) => {
              const isSelected = agent.id === selectedAgent?.id;
              return (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => setSelectedId(agent.id)}
                  className={`w-full rounded-[var(--radius-card)] border p-4 text-left transition ${
                    isSelected
                      ? "border-[var(--color-accent-strong)] border-l-4 border-l-[var(--color-accent-strong)] bg-[var(--color-surface)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-subtle)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge
                          tone={agent.risk === "stable" ? "success" : "warning"}
                        >
                          {agent.risk === "stable" ? "ready" : "attention"}
                        </Badge>
                        <span className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-text-subtle)]">
                          {agent.environment}
                        </span>
                      </div>
                      <h2 className="mt-2 truncate text-sm font-semibold text-[var(--color-text)]">
                        {agent.displayName}
                      </h2>
                      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        {agent.publicKeyState}
                      </p>
                    </div>
                    <div className="text-right text-xs text-[var(--color-text-subtle)]">
                      <p>{formatRelativeLabel(agent.lastActivityAt)}</p>
                      <p className="mt-1">
                        {formatDateTime(agent.lastActivityAt)}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <div className="xl:min-h-0 xl:pl-2">
          {selectedAgent ? (
            <DetailPanel
              tone="agents"
              eyebrow="Selected agent"
              heading={
                <h2 className="text-xl font-semibold tracking-[-0.02em]">
                  {selectedAgent.displayName}
                </h2>
              }
              description={selectedAgent.note}
              actions={
                <Badge
                  tone={selectedAgent.risk === "stable" ? "success" : "warning"}
                >
                  {selectedAgent.risk}
                </Badge>
              }
              copyLink={`#/agents?agent=${encodeURIComponent(selectedAgent.id)}&agentName=${encodeURIComponent(selectedAgent.name)}`}
              className="min-h-[680px] xl:h-full xl:min-h-0"
            >
              <DetailPanelSection heading="Overview">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-subtle)]">
                      Agent ID
                    </p>
                    <p className="mt-1 text-sm text-[var(--color-text)]">
                      {selectedAgent.id}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-subtle)]">
                      Environment
                    </p>
                    <p className="mt-1 text-sm text-[var(--color-text)]">
                      {selectedAgent.environment}
                    </p>
                  </div>
                </div>
              </DetailPanelSection>

              <DetailPanelSection heading="Registration and exposure">
                <div className="grid gap-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-subtle)]">
                      Registration and key state
                    </p>
                    <dl className="mt-2 grid gap-3 text-sm text-[var(--color-text)]">
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-[var(--color-text-muted)]">
                          Public key state
                        </dt>
                        <dd>{selectedAgent.publicKeyState}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-[var(--color-text-muted)]">
                          Key fingerprint
                        </dt>
                        <dd className="font-mono text-xs">
                          {selectedAgent.keyFingerprint}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-subtle)]">
                      Operational exposure
                    </p>
                    <dl className="mt-2 grid gap-3 text-sm text-[var(--color-text)]">
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-[var(--color-text-muted)]">
                          Active leases
                        </dt>
                        <dd>{selectedAgent.activeLeases}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-[var(--color-text-muted)]">
                          Last activity
                        </dt>
                        <dd>{formatDateTime(selectedAgent.lastActivityAt)}</dd>
                      </div>
                      <div>
                        <dt className="text-[var(--color-text-muted)]">
                          Linked secrets
                        </dt>
                        <dd className="mt-2 flex flex-wrap gap-2">
                          {selectedAgent.linkedSecrets.map((secret) => (
                            <EntityBadge
                              key={secret}
                              kind="secret"
                              href={`#/secrets?secretName=${encodeURIComponent(secret)}`}
                            >
                              {secret}
                            </EntityBadge>
                          ))}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </DetailPanelSection>

              <DetailPanelSection heading="Actions">
                <div className="flex flex-wrap gap-3">
                  <Button variant="secondary">Rotate token</Button>
                  <Button variant="danger" onClick={() => setRevokeOpen(true)}>
                    Revoke agent
                  </Button>
                </div>
              </DetailPanelSection>
            </DetailPanel>
          ) : (
            <DetailPanel
              tone="agents"
              eyebrow="Selected agent"
              heading={
                <h2 className="text-lg font-semibold">No agent selected</h2>
              }
              description="Choose an agent from the inventory to inspect registration, lease exposure, and available actions."
              className="min-h-[680px] xl:h-full xl:min-h-0"
            />
          )}
        </div>
      </div>

      <Modal
        open={revokeOpen}
        title="Revoke agent access"
        confirmLabel="Confirm revoke"
        onClose={() => setRevokeOpen(false)}
        onConfirm={() => setRevokeOpen(false)}
      >
        <p className="text-sm text-[var(--color-text-muted)]">
          This mockup keeps destructive confirmation inside a modal. Final
          implementation should explain which leases and secrets are affected
          before revocation.
        </p>
      </Modal>

      <Modal
        open={createOpen}
        title="Create Agent"
        confirmLabel={createSubmitting ? "Creating..." : "Create Agent"}
        onClose={() => {
          setCreateOpen(false);
          resetCreateAgentForm();
        }}
        onConfirm={createSubmitting ? undefined : handleCreateAgent}
      >
        <Input
          label="Agent name"
          value={newAgentName}
          onChange={(event) => setNewAgentName(event.target.value)}
          error={createError ?? undefined}
          placeholder="release-bot"
        />
      </Modal>

      <Modal
        open={Boolean(createdAgentCredentials)}
        title="Agent credentials"
        cancelLabel="Close"
        onClose={() => setCreatedAgentCredentials(null)}
      >
        {createdAgentCredentials ? (
          <div className="space-y-3">
            <p className="text-sm text-[var(--color-text-muted)]">
              Store this app token now. It may not be shown again.
            </p>
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-subtle)]">
                  Agent ID
                </dt>
                <dd className="mt-1 font-mono text-[var(--color-text)]">
                  {createdAgentCredentials.agentId}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-subtle)]">
                  App token
                </dt>
                <dd className="mt-1 overflow-x-auto rounded-[var(--radius-panel)] bg-[var(--color-surface-subtle)] p-3 font-mono text-xs text-[var(--color-text)]">
                  {createdAgentCredentials.appToken}
                </dd>
              </div>
            </dl>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}
