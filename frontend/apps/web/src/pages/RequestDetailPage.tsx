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
          <h1 className="text-2xl font-semibold text-slate-900">{detail.name}</h1>
          <p className="mt-1 text-sm text-slate-600">{detail.context}</p>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Back
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">Request Requirements</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {detail.requiredFields.map((field) => (
              <li key={field} className="rounded-md bg-slate-50 px-3 py-2">
                {field}
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">Fulfillment Placeholder</h2>
          <p className="mt-3 text-sm text-slate-600">
            In Phase 2+, this panel will support mapping to an existing secret or creating and leasing a new
            one.
          </p>
        </article>
      </div>
    </section>
  );
}
