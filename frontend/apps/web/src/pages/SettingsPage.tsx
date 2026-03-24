import { Badge, Button, Card, Input } from "../components/ui";

export function SettingsPage() {
  return (
    <section className="flex flex-col gap-4 xl:h-full xl:min-h-0">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent-text)]">
              Settings
            </p>
            <span className="inline-flex items-center rounded-full border border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--color-accent-text)]">
              Preview
            </span>
          </div>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Secondary controls stay useful without competing with daily work.
          </p>
        </div>
      </header>

      <Card
        title="Workspace settings"
        description="Settings stay quieter than the operational domains, but the same viewport ownership still applies."
        className="min-h-[720px] overflow-y-auto xl:min-h-0 xl:flex-1"
        actions={<Badge tone="neutral">Preview</Badge>}
      >
        <div className="space-y-8">
          <section>
            <h2 className="text-sm font-semibold text-[var(--color-text)]">
              Session controls
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Session defaults stay editable here without competing with daily
              work.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input
                label="Session timeout (minutes)"
                type="number"
                min={1}
                defaultValue={30}
              />
              <Input
                label="Auto-lock warning (seconds)"
                type="number"
                min={0}
                defaultValue={60}
              />
            </div>
            <div className="mt-4 flex gap-3">
              <Button>Save session defaults</Button>
              <Button variant="secondary">Reset</Button>
            </div>
          </section>

          <section className="border-t border-[var(--color-border)] pt-8">
            <h2 className="text-sm font-semibold text-[var(--color-text)]">
              Workspace density
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Density and timeline cadence remain product-level defaults, not
              purely local taste.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input
                label="Default page size"
                type="number"
                min={10}
                max={100}
                defaultValue={25}
              />
              <Input
                label="Timeline batch size"
                type="number"
                min={10}
                max={200}
                defaultValue={40}
              />
            </div>
          </section>

          <section className="border-t border-[var(--color-border)] pt-8">
            <h2 className="text-sm font-semibold text-[var(--color-text)]">
              Security posture
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Account security controls stay visible, but secondary to Requests,
              Secrets, and Agents.
            </p>
            <div className="mt-4 space-y-3 text-sm text-[var(--color-text)]">
              <div className="flex items-center justify-between rounded-[14px] bg-[var(--color-surface-subtle)] px-4 py-3">
                <span>TOTP MFA</span>
                <Badge tone="success">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between rounded-[14px] bg-[var(--color-surface-subtle)] px-4 py-3">
                <span>Device trust</span>
                <Badge tone="neutral">Review quarterly</Badge>
              </div>
            </div>
          </section>

          <section className="border-t border-[var(--color-border)] pt-8">
            <h2 className="text-sm font-semibold text-[var(--color-text)]">
              Environment
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Read-only context can stay here without stealing focus from
              operations.
            </p>
            <div className="mt-4 space-y-3 text-sm text-[var(--color-text)]">
              <div className="flex items-center justify-between rounded-[14px] bg-[var(--color-surface-subtle)] px-4 py-3">
                <span>Mode</span>
                <Badge tone="neutral">Mocked preview</Badge>
              </div>
              <div className="flex items-center justify-between rounded-[14px] bg-[var(--color-surface-subtle)] px-4 py-3">
                <span>Vault URL</span>
                <span className="font-mono text-xs text-[var(--color-text-muted)]">
                  https://api-staging.agentpassvault.com
                </span>
              </div>
            </div>
          </section>
        </div>
      </Card>
    </section>
  );
}
