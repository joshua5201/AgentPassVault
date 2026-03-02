import { useEffect, useMemo, useState } from "react";
import type { RequestResponse, RequestResponseStatusEnum } from "@agentpassvault/sdk";
import { appApiClient } from "../api/client";
import { Badge, Button, Input, Table, Tabs, type TabItem, Toast } from "../components/ui";
import { ErrorState } from "../components/states/ErrorState";
import { EmptyState } from "../components/states/EmptyState";
import { useSessionStore } from "../state/session-store";
import { readAppEnv } from "../config/env";

interface RequestsPageProps {
  onOpenRequest: (requestId: string) => void;
}

type RequestFilter = "active" | "past" | "all";

const FILTER_TABS: TabItem[] = [
  { id: "active", label: "Active" },
  { id: "past", label: "Past" },
  { id: "all", label: "All" },
];

function toneForStatus(status: RequestResponseStatusEnum | undefined) {
  if (status === "fulfilled") {
    return "success" as const;
  }
  if (status === "rejected" || status === "abandoned") {
    return "danger" as const;
  }
  return "warning" as const;
}

export function RequestsPage({ onOpenRequest }: RequestsPageProps) {
  const env = readAppEnv();
  const { accessToken } = useSessionStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<RequestResponse[]>([]);
  const [filter, setFilter] = useState<RequestFilter>("active");
  const [query, setQuery] = useState("");
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
      const result = await appApiClient.listRequests();
      if (!active) {
        return;
      }

      setLoading(false);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }

      setRequests(result.data);
    };

    void load();
    return () => {
      active = false;
    };
  }, [canFetch]);

  const filteredRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return requests.filter((request) => {
      const status = request.status;
      const isActive = status === "pending";
      const matchesFilter =
        filter === "all"
          ? true
          : filter === "active"
            ? isActive
            : !isActive;
      const matchesQuery =
        !normalizedQuery ||
        (request.name ?? "").toLowerCase().includes(normalizedQuery) ||
        (request.context ?? "").toLowerCase().includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [filter, query, requests]);

  if (loading) {
    return <Toast title="Requests">Loading request inbox...</Toast>;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load requests"
        message={error}
        actionLabel="Retry"
        onAction={() => window.location.reload()}
      />
    );
  }

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Requests</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          View active and past requests. Use direct fulfillment links for actions.
        </p>
      </header>

      <div className="space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
        <Tabs tabs={FILTER_TABS} activeId={filter} onChange={(id) => setFilter(id as RequestFilter)} />
        <Input
          label="Search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by request name or context"
        />
      </div>

      {filteredRequests.length === 0 ? (
        <EmptyState
          title="No matching requests"
          message="Try another filter or search query."
        />
      ) : (
        <Table
          headers={["Name", "Context", "Status", "Actions"]}
          rows={filteredRequests.map((request) => [
            request.name ?? "Unnamed request",
            request.context ?? "-",
            <Badge key={`${request.requestId}-status`} tone={toneForStatus(request.status)}>
              {request.status ?? "pending"}
            </Badge>,
            <div key={`${request.requestId}-action`} className="flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onOpenRequest(request.requestId ?? "")}
                disabled={!request.requestId}
              >
                View
              </Button>
              {request.requestId && request.status === "pending" ? (
                <a
                  href={`#/fulfill/${request.requestId}`}
                  className="rounded-lg border border-[var(--color-border)] bg-white px-3 py-1.5 text-sm text-[var(--color-text)]"
                >
                  Fulfill
                </a>
              ) : null}
            </div>,
          ])}
        />
      )}
    </section>
  );
}
