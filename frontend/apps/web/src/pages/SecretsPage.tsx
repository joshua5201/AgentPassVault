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
        <h1 className="text-2xl font-semibold text-slate-900">Secrets</h1>
        <p className="mt-1 text-sm text-slate-600">Manage encrypted records available for lease workflows.</p>
      </header>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Updated
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {MOCK_SECRETS.map((secret) => (
              <tr key={secret.id}>
                <td className="px-4 py-3 text-sm font-medium text-slate-900">{secret.name}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{secret.updatedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
