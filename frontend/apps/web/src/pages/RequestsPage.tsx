import { useEffect, useMemo, useRef, useState } from "react";
import type { RequestResponse } from "@agentpassvault/sdk";
import { appApiClient } from "../api/client";
import {
  Badge,
  Button,
  Card,
  DetailPanel,
  DetailPanelSection,
  EntityBadge,
  Input,
  Tabs,
  type TabItem,
  Toast,
} from "../components/ui";
import { readAppEnv } from "../config/env";
import { formatDateTime, formatRelativeLabel } from "../mockup/format";
import { type MockupRequest, mockupRequests } from "../mockup/lofi-data";
import { useSessionStore } from "../state/session-store";

interface RequestsPageProps {
  initialSelectedRequestId?: string | null;
}

type RequestFilter = "pending" | "resolved" | "all";

const FILTER_TABS: TabItem[] = [
  { id: "pending", label: "Pending" },
  { id: "resolved", label: "Resolved" },
  { id: "all", label: "All" },
];

function statusTone(status: MockupRequest["status"]) {
  if (status === "fulfilled") {
    return "success" as const;
  }

  if (status === "rejected") {
    return "danger" as const;
  }

  return "warning" as const;
}

function normalizeMetadata(
  metadata: RequestResponse["requiredMetadata"],
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
      const maybeValue = value.value;
      normalized[key] =
        typeof maybeValue === "string"
          ? maybeValue
          : JSON.stringify(maybeValue);
      continue;
    }

    normalized[key] = JSON.stringify(value);
  }

  return normalized;
}

function toMockupRequest(
  request: RequestResponse,
  agentNames: Record<string, string>,
): MockupRequest {
  const status =
    request.status === "fulfilled" || request.status === "rejected"
      ? request.status
      : "pending";
  const type = request.type === "LEASE" ? "LEASE" : "CREATE";

  return {
    id: request.requestId ?? `request-${Math.random().toString(36).slice(2)}`,
    name: request.name ?? "Unnamed request",
    type,
    status,
    agentId: request.agentId ?? "unknown-agent",
    agentName:
      agentNames[request.agentId ?? ""] ?? request.agentId ?? "Unknown agent",
    updatedAt: request.updatedAt
      ? new Date(request.updatedAt).toISOString()
      : new Date().toISOString(),
    context: request.context ?? "No context supplied.",
    summary:
      status === "pending"
        ? "Waiting for a human review before a credential can be issued or leased."
        : status === "fulfilled"
          ? "This request has already been handled and is no longer actionable."
          : "This request was rejected and should be treated as closed.",
    requiredFields: request.requiredFieldsInSecretValue ?? [],
    metadata: normalizeMetadata(request.requiredMetadata),
    linkedSecretId: request.secretId ?? request.mappedSecretId ?? undefined,
    linkedSecretName: request.secretName ?? undefined,
    leaseStatus:
      status === "fulfilled"
        ? "Lease status available in backend detail"
        : undefined,
    leaseExpiresAt: undefined,
  };
}

export function RequestsPage({
  initialSelectedRequestId = null,
}: RequestsPageProps) {
  const env = readAppEnv();
  const { accessToken } = useSessionStore();
  const [requests, setRequests] = useState<MockupRequest[]>(
    env.apiMockingEnabled ? mockupRequests : [],
  );
  const [loading, setLoading] = useState(!env.apiMockingEnabled);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<RequestFilter>("pending");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    mockupRequests[0]?.id ?? null,
  );
  const lastAppliedSelectionRef = useRef<string | null>(null);

  useEffect(() => {
    if (env.apiMockingEnabled) {
      setRequests(mockupRequests);
      setSelectedId(mockupRequests[0]?.id ?? null);
      setLoading(false);
      return;
    }

    let active = true;
    const canFetch = Boolean(accessToken);
    if (!canFetch) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);

      const [requestResult, agentResult] = await Promise.all([
        appApiClient.listRequests(),
        appApiClient.listAgents(),
      ]);

      if (!active) {
        return;
      }

      if (!requestResult.ok) {
        setLoading(false);
        setError(requestResult.error.message);
        return;
      }

      const agentNames = agentResult.ok
        ? Object.fromEntries(
            agentResult.data.map((agent) => [
              agent.agentId ?? "",
              agent.displayName ??
                agent.name ??
                agent.agentId ??
                "Unknown agent",
            ]),
          )
        : {};

      const mapped = requestResult.data.map((request) =>
        toMockupRequest(request, agentNames),
      );
      setRequests(mapped);
      setSelectedId(mapped[0]?.id ?? null);
      setLoading(false);
    };

    void load();
    return () => {
      active = false;
    };
  }, [accessToken, env.apiMockingEnabled]);

  const filteredRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesFilter =
        filter === "all"
          ? true
          : filter === "pending"
            ? request.status === "pending"
            : request.status !== "pending";

      const matchesQuery =
        !normalizedQuery ||
        request.name.toLowerCase().includes(normalizedQuery) ||
        request.context.toLowerCase().includes(normalizedQuery) ||
        request.agentName.toLowerCase().includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    });
  }, [filter, query, requests]);

  useEffect(() => {
    if (!filteredRequests.some((request) => request.id === selectedId)) {
      setSelectedId(filteredRequests[0]?.id ?? null);
    }
  }, [filteredRequests, selectedId]);

  useEffect(() => {
    if (!initialSelectedRequestId) {
      return;
    }

    if (lastAppliedSelectionRef.current === initialSelectedRequestId) {
      return;
    }

    lastAppliedSelectionRef.current = initialSelectedRequestId;
    const matchedRequest = requests.find(
      (request) => request.id === initialSelectedRequestId,
    );
    if (matchedRequest && matchedRequest.id !== selectedId) {
      setSelectedId(matchedRequest.id);
    }
  }, [initialSelectedRequestId, requests, selectedId]);

  const selectedRequest =
    filteredRequests.find((request) => request.id === selectedId) ??
    filteredRequests[0] ??
    null;
  const pendingCount = requests.filter(
    (request) => request.status === "pending",
  ).length;

  if (loading) {
    return <Toast title="Requests">Loading request inbox...</Toast>;
  }

  return (
    <section className="flex flex-col gap-4 xl:h-full xl:min-h-0">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent-text)]">
              Requests
            </p>
            <span className="inline-flex items-center rounded-full border border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--color-accent-text)]">
              Pending {pendingCount}
            </span>
          </div>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Review pending work first. Context, metadata, and lease state stay
            visible before action.
          </p>
        </div>
      </header>

      {error ? (
        <Toast tone="error" title="Requests">
          {error}
        </Toast>
      ) : null}

      <div className="grid gap-4 xl:min-h-0 xl:flex-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)] xl:overflow-hidden">
        <Card className="flex min-h-[720px] flex-col overflow-hidden xl:h-full xl:min-h-0">
          <div className="mb-3">
            <p className="max-w-[28rem] text-xs text-[var(--color-text-muted)]">
              Select a request to inspect details in place.
            </p>
          </div>

          <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0 flex-1">
              <Input
                label="Search requests"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by request, context, or agent"
              />
            </div>

            <Tabs
              tabs={FILTER_TABS}
              activeId={filter}
              onChange={(next) => setFilter(next as RequestFilter)}
            />
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {filteredRequests.map((request) => {
              const isSelected = request.id === selectedRequest?.id;

              return (
                <button
                  key={request.id}
                  type="button"
                  onClick={() => setSelectedId(request.id)}
                  className={`w-full rounded-[var(--radius-card)] border p-4 text-left transition ${
                    isSelected
                      ? "border-[var(--color-accent-strong)] border-l-4 border-l-[var(--color-accent-strong)] bg-[var(--color-surface)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-subtle)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge tone={statusTone(request.status)}>
                          {request.status}
                        </Badge>
                        <span className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-text-subtle)]">
                          {request.type}
                        </span>
                      </div>
                      <h2 className="mt-2 truncate text-sm font-semibold text-[var(--color-text)]">
                        {request.name}
                      </h2>
                      <p className="mt-1 line-clamp-2 text-sm text-[var(--color-text-muted)]">
                        {request.context}
                      </p>
                    </div>
                    <div className="text-right text-xs text-[var(--color-text-subtle)]">
                      <p>{formatRelativeLabel(request.updatedAt)}</p>
                      <p className="mt-1">
                        {formatDateTime(request.updatedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <EntityBadge
                        kind="agent"
                        className="max-w-full"
                        href={`#/agents?agent=${encodeURIComponent(request.agentId)}&agentName=${encodeURIComponent(request.agentName)}`}
                      >
                        {request.agentName}
                      </EntityBadge>
                    </div>
                    <span className="text-xs font-semibold text-[var(--color-primary)]">
                      Open
                    </span>
                  </div>
                </button>
              );
            })}

            {filteredRequests.length === 0 ? (
              <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-4 py-10 text-center text-sm text-[var(--color-text-muted)]">
                No requests match the current filter.
              </div>
            ) : null}
          </div>
        </Card>

        <div className="xl:min-h-0 xl:pl-2">
          {selectedRequest ? (
            <DetailPanel
              tone="requests"
              eyebrow="Selected request"
              heading={
                <h2 className="text-xl font-semibold tracking-[-0.02em]">
                  {selectedRequest.name}
                </h2>
              }
              description={selectedRequest.summary}
              actions={
                <Badge tone={statusTone(selectedRequest.status)}>
                  {selectedRequest.status}
                </Badge>
              }
              copyLink={`#/requests?request=${encodeURIComponent(selectedRequest.id)}`}
              className="min-h-[720px] xl:h-full xl:min-h-0"
            >
              <DetailPanelSection heading="Overview">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-subtle)]">
                      Agent
                    </p>
                    <div className="mt-2">
                      <EntityBadge
                        kind="agent"
                        href={`#/agents?agent=${encodeURIComponent(selectedRequest.agentId)}&agentName=${encodeURIComponent(selectedRequest.agentName)}`}
                      >
                        {selectedRequest.agentName}
                      </EntityBadge>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-subtle)]">
                      Updated
                    </p>
                    <p className="mt-1 text-sm text-[var(--color-text)]">
                      {formatDateTime(selectedRequest.updatedAt)}
                    </p>
                  </div>
                </div>
              </DetailPanelSection>

              <DetailPanelSection heading="Context">
                <p className="text-sm leading-6 text-[var(--color-text)]">
                  {selectedRequest.context}
                </p>
              </DetailPanelSection>

              <DetailPanelSection heading="Requirements and lease posture">
                <div className="grid gap-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-subtle)]">
                      Requirements
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedRequest.requiredFields.map((field) => (
                        <span
                          key={field}
                          className="rounded-full bg-[var(--color-surface-subtle)] px-3 py-1 text-xs font-medium text-[var(--color-text)]"
                        >
                          {field}
                        </span>
                      ))}
                      {selectedRequest.requiredFields.length === 0 ? (
                        <span className="text-sm text-[var(--color-text-muted)]">
                          No required fields provided.
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-subtle)]">
                      Linked secret and lease
                    </p>
                    <dl className="mt-2 grid gap-3 text-sm text-[var(--color-text)]">
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-[var(--color-text-muted)]">
                          Linked secret
                        </dt>
                        <dd>
                          {selectedRequest.linkedSecretName ? (
                            <EntityBadge
                              kind="secret"
                              href={
                                selectedRequest.linkedSecretId
                                  ? `#/secrets?secret=${encodeURIComponent(selectedRequest.linkedSecretId)}`
                                  : `#/secrets?secretName=${encodeURIComponent(selectedRequest.linkedSecretName)}`
                              }
                            >
                              {selectedRequest.linkedSecretName}
                            </EntityBadge>
                          ) : (
                            "Not linked yet"
                          )}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-[var(--color-text-muted)]">
                          Lease state
                        </dt>
                        <dd>
                          {selectedRequest.leaseStatus ?? "No lease issued yet"}
                        </dd>
                      </div>
                      {selectedRequest.leaseExpiresAt ? (
                        <div className="flex items-center justify-between gap-4">
                          <dt className="text-[var(--color-text-muted)]">
                            Lease expiry
                          </dt>
                          <dd>
                            {formatDateTime(selectedRequest.leaseExpiresAt)}
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                  </div>
                </div>
              </DetailPanelSection>

              <DetailPanelSection heading="Metadata">
                <pre className="overflow-x-auto rounded-[var(--radius-panel)] bg-[var(--color-surface-subtle)] p-4 text-xs leading-6 text-[var(--color-text)]">
                  {JSON.stringify(selectedRequest.metadata, null, 2)}
                </pre>
              </DetailPanelSection>

              <DetailPanelSection heading="Actions">
                <div className="flex flex-wrap gap-3">
                  {selectedRequest.status === "pending" ? (
                    <a
                      href={`#/fulfill/${selectedRequest.id}`}
                      className="inline-flex h-8 items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-medium text-[var(--color-text)] shadow-sm transition hover:bg-[var(--color-surface-muted)]"
                    >
                      {selectedRequest.type === "LEASE"
                        ? "Open lease review"
                        : "Open fulfill flow"}
                    </a>
                  ) : null}
                </div>
              </DetailPanelSection>
            </DetailPanel>
          ) : (
            <DetailPanel
              tone="requests"
              eyebrow="Selected request"
              heading={
                <h2 className="text-lg font-semibold">No request selected</h2>
              }
              description="The detail panel stays empty until there is a visible request in the queue."
              className="min-h-[720px] xl:h-full xl:min-h-0"
            />
          )}
        </div>
      </div>
    </section>
  );
}
