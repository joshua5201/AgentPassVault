import { useEffect, useMemo, useState } from "react";
import type { RequestResponse, RequestResponseStatusEnum } from "@agentpassvault/sdk";
import { appApiClient } from "../api/client";
import { Badge, Button, Input, Table, Tabs, type TabItem, Toast } from "../components/ui";
import { ErrorState } from "../components/states/ErrorState";
import { EmptyState } from "../components/states/EmptyState";

interface RequestsPageProps {
  onOpenRequest: (requestId: string) => void;
}

type RequestFilter = "all" | RequestResponseStatusEnum;

const FILTER_TABS: TabItem[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "fulfilled", label: "Fulfilled" },
  { id: "rejected", label: "Rejected" },
  { id: "abandoned", label: "Abandoned" },
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<RequestResponse[]>([]);
  const [filter, setFilter] = useState<RequestFilter>("pending");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
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
  }, []);

  const filteredRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return requests.filter((request) => {
      const matchesFilter = filter === "all" ? true : request.status === filter;
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

  if (filteredRequests.length === 0) {
    return (
      <EmptyState
        title="No matching requests"
        message="Try another filter or search query."
      />
    );
  }

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Pending Requests</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Review and fulfill agent requests securely.</p>
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

      <Table
        headers={["Name", "Context", "Status", "Action"]}
        rows={filteredRequests.map((request) => [
          request.name ?? "Unnamed request",
          request.context ?? "-",
          <Badge key={`${request.requestId}-status`} tone={toneForStatus(request.status)}>
            {request.status ?? "pending"}
          </Badge>,
          <div key={`${request.requestId}-action`} className="text-right">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onOpenRequest(request.requestId ?? "")}
              disabled={!request.requestId}
            >
              Open
            </Button>
          </div>,
        ])}
      />
    </section>
  );
}
