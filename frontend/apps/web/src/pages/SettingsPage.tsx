import { Card, Input } from "../components/ui";

export function SettingsPage() {
  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Settings</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Workspace and profile controls will be added in later phases.</p>
      </header>

      <Card title="Numeric Placeholders" description="Temporary numeric settings for MVP scaffolding.">
        <div className="grid max-w-xl gap-4 sm:grid-cols-2">
          <Input label="Session Timeout (minutes)" type="number" min={1} defaultValue={30} />
          <Input label="Default Page Size" type="number" min={5} max={200} defaultValue={20} />
          <Input label="Auto-lock Warning (seconds)" type="number" min={0} defaultValue={60} />
          <Input label="Refresh Interval (seconds)" type="number" min={0} defaultValue={15} />
        </div>
      </Card>
    </section>
  );
}
