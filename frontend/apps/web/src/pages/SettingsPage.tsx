import { Card, Select } from "../components/ui";

export function SettingsPage() {
  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Settings</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Workspace and profile controls will be added in later phases.</p>
      </header>

      <Card title="Default Environment" description="Placeholder configuration for upcoming staging and production toggles.">
        <div className="max-w-sm">
          <Select label="Environment" defaultValue="staging">
            <option value="local">Local</option>
            <option value="staging">Staging</option>
          </Select>
        </div>
      </Card>
    </section>
  );
}
