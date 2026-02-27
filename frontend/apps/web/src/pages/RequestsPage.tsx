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
        <h1 className="text-2xl font-semibold text-slate-900">Pending Requests</h1>
        <p className="mt-1 text-sm text-slate-600">Review and fulfill agent requests securely.</p>
      </header>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Context
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Status
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {MOCK_REQUESTS.map((request) => (
              <tr key={request.id}>
                <td className="px-4 py-3 text-sm font-medium text-slate-900">{request.name}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{request.context}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{request.status}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    onClick={() => onOpenRequest(request.id)}
                  >
                    Open
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
