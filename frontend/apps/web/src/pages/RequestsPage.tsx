import { Badge, Button, Table } from "../components/ui";
import { EmptyState } from "../components/states/EmptyState";

interface RequestsPageProps {
  onOpenRequest: (requestId: string) => void;
}

const MOCK_REQUESTS = [
  {
    id: "req-aws-prod",
    name: "AWS Production Credentials",
    status: "pending",
    context: "Deployment pipeline needs updated credentials.",
  },
  {
    id: "req-gcp-billing",
    name: "GCP Billing Service Account",
    status: "pending",
    context: "Finance export integration cannot authenticate.",
  },
];

export function RequestsPage({ onOpenRequest }: RequestsPageProps) {
  if (MOCK_REQUESTS.length === 0) {
    return (
      <EmptyState
        title="No pending requests"
        message="When agents request missing secrets, they will appear here."
      />
    );
  }

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Pending Requests</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Review and fulfill agent requests securely.</p>
      </header>

      <Table
        headers={["Name", "Context", "Status", "Action"]}
        rows={MOCK_REQUESTS.map((request) => [
          request.name,
          request.context,
          <Badge key={`${request.id}-status`} tone="warning">
            {request.status}
          </Badge>,
          <div key={`${request.id}-action`} className="text-right">
            <Button variant="secondary" size="sm" onClick={() => onOpenRequest(request.id)}>
              Open
            </Button>
          </div>,
        ])}
      />
    </section>
  );
}
