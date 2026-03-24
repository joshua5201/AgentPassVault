import { useMemo, useState } from "react";
import {
  Badge,
  Card,
  EntityBadge,
  Input,
  Tabs,
  type TabItem,
} from "../components/ui";
import { formatDateTime } from "../mockup/format";
import { mockupAuditEvents } from "../mockup/lofi-data";

type AuditFilter = "all" | "requests" | "secrets" | "agents";

const FILTER_TABS: TabItem[] = [
  { id: "all", label: "All" },
  { id: "requests", label: "Requests" },
  { id: "secrets", label: "Secrets" },
  { id: "agents", label: "Agents" },
];

function outcomeTone(outcome: "success" | "warning" | "danger" | "neutral") {
  if (outcome === "success") {
    return "success" as const;
  }

  if (outcome === "warning") {
    return "warning" as const;
  }

  if (outcome === "danger") {
    return "danger" as const;
  }

  return "neutral" as const;
}

function eventDomainKind(domain: "Requests" | "Secrets" | "Agents") {
  if (domain === "Requests") {
    return "request" as const;
  }

  if (domain === "Secrets") {
    return "secret" as const;
  }

  return "agent" as const;
}

export function AuditLogPage() {
  const [filter, setFilter] = useState<AuditFilter>("all");
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return mockupAuditEvents.filter((event) => {
      const matchesFilter =
        filter === "all" ? true : event.domain.toLowerCase() === filter;
      const matchesQuery =
        !normalizedQuery ||
        event.actor.toLowerCase().includes(normalizedQuery) ||
        event.action.toLowerCase().includes(normalizedQuery) ||
        event.target.toLowerCase().includes(normalizedQuery) ||
        event.detail.toLowerCase().includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    });
  }, [filter, query]);

  return (
    <section className="flex flex-col gap-4 xl:h-full xl:min-h-0">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent-text)]">
              Audit Log
            </p>
            <span className="inline-flex items-center rounded-full border border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--color-accent-text)]">
              Visible {items.length}
            </span>
          </div>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Timeline-first history keeps sequence, actor, target, and outcome
            visible without opening every event.
          </p>
        </div>
      </header>

      <Card
        title="Timeline"
        description="Audit Log remains a dense operational history rather than a dashboard."
        className="flex min-h-[720px] flex-col overflow-hidden xl:min-h-0 xl:flex-1"
        actions={
          <Tabs
            tabs={FILTER_TABS}
            activeId={filter}
            onChange={(next) => setFilter(next as AuditFilter)}
          />
        }
      >
        <div className="mb-4">
          <Input
            label="Search audit events"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by actor, action, target, or detail"
          />
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {items.map((event) => (
            <div
              key={event.id}
              className="grid gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:grid-cols-[180px_minmax(0,1fr)]"
            >
              <div className="text-xs text-[var(--color-text-subtle)]">
                <EntityBadge kind={eventDomainKind(event.domain)}>
                  {event.domain}
                </EntityBadge>
                <p className="mt-2 text-sm font-medium text-[var(--color-text)]">
                  {formatDateTime(event.at)}
                </p>
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={outcomeTone(event.outcome)}>
                    {event.outcome}
                  </Badge>
                  <span className="text-sm font-semibold text-[var(--color-text)]">
                    {event.action}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[var(--color-text)]">
                  <span className="font-medium">{event.actor}</span> acted on{" "}
                  <span className="font-medium">{event.target}</span>.
                </p>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {event.detail}
                </p>
              </div>
            </div>
          ))}

          {items.length === 0 ? (
            <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-4 py-10 text-center text-sm text-[var(--color-text-muted)]">
              No audit events match the current filter.
            </div>
          ) : null}
        </div>
      </Card>
    </section>
  );
}
