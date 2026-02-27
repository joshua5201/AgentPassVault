import { Card, Button, Badge } from "../components/ui";
import { ErrorState } from "../components/states/ErrorState";

interface RequestDetailPageProps {
  requestId: string;
  onBack: () => void;
}

const REQUEST_DETAILS: Record<string, { name: string; context: string; requiredFields: string[] }> = {
  "req-aws-prod": {
    name: "AWS Production Credentials",
    context: "Deployment pipeline needs updated credentials.",
    requiredFields: ["access_key", "secret_key"],
  },
  "req-gcp-billing": {
    name: "GCP Billing Service Account",
    context: "Finance export integration cannot authenticate.",
    requiredFields: ["service_account_json"],
  },
};

export function RequestDetailPage({ requestId, onBack }: RequestDetailPageProps) {
  const detail = REQUEST_DETAILS[requestId];

  if (!detail) {
    return (
      <ErrorState
        title="Request not found"
        message="The selected request does not exist or has already been resolved."
        actionLabel="Back to requests"
        onAction={onBack}
      />
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">{detail.name}</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{detail.context}</p>
        </div>

        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Request Requirements">
          <ul className="space-y-2 text-sm text-[var(--color-text)]">
            {detail.requiredFields.map((field) => (
              <li key={field} className="rounded-md bg-[var(--color-surface-muted)] px-3 py-2">
                {field}
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Fulfillment Placeholder" description="Flow wiring starts in Phase 3 and Phase 4.">
          <div className="flex flex-wrap gap-2">
            <Badge tone="neutral">Existing Secret</Badge>
            <Badge tone="success">Create + Lease</Badge>
            <Badge tone="danger">Reject</Badge>
          </div>
        </Card>
      </div>
    </section>
  );
}
