import { useState } from "react";
import { Button, Card, Input } from "../components/ui";

interface VaultUnlockPageProps {
  username: string;
  onUnlock: (password: string) => Promise<void>;
}

export function VaultUnlockPage({ username, onUnlock }: VaultUnlockPageProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="mx-auto mt-8 max-w-xl">
      <Card title="Vault Locked" description="Enter your master password to unlock encrypted secret actions.">
        <p className="mb-4 text-sm text-[var(--color-text-muted)]">Signed in as {username}</p>
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setSubmitting(true);
            setError(null);
            try {
              await onUnlock(password);
              setPassword("");
            } catch (unlockError) {
              setError(unlockError instanceof Error ? unlockError.message : "Unable to unlock vault");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <Input
            label="Master Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Unlocking..." : "Unlock Vault"}
          </Button>

          {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
        </form>
      </Card>
    </div>
  );
}
