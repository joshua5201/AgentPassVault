import { Badge, Table } from "../components/ui";
import { EmptyState } from "../components/states/EmptyState";

const MOCK_SECRETS = [
  { id: "sec-001", name: "AWS Deploy Key", updatedAt: "2026-02-22" },
  { id: "sec-002", name: "GCP Billing Token", updatedAt: "2026-02-20" },
];

export function SecretsPage() {
  if (MOCK_SECRETS.length === 0) {
    return (
      <EmptyState
        title="No secrets yet"
        message="Create your first encrypted secret to support request fulfillment."
        actionLabel="Create secret"
      />
    );
  }

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Secrets</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Manage encrypted records available for lease workflows.</p>
      </header>

      <Table
        headers={["Name", "Updated", "Status"]}
        rows={MOCK_SECRETS.map((secret) => [
          secret.name,
          secret.updatedAt,
          <Badge key={`${secret.id}-active`} tone="success">
            Active
          </Badge>,
        ])}
      />
    </section>
  );
}
