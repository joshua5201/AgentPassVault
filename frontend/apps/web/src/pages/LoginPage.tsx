import { useState } from "react";
import { Button, Card, Input } from "../components/ui";

interface LoginPageProps {
  onLogin: (username: string, password: string) => Promise<void> | void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-app-bg)] px-4">
      <Card
        className="w-full max-w-md"
        title="Admin Login"
        description="Sign in to manage secrets and fulfillment requests."
      >
        <p className="mb-4 text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">AgentPassVault</p>

        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setSubmitting(true);
            setErrorMessage(null);
            try {
              await onLogin(username, password);
              setPassword("");
            } catch (error) {
              const message =
                error instanceof Error ? error.message : "Unable to sign in with provided credentials.";
              setErrorMessage(message);
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <Input
            label="Username"
            type="email"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="admin@your-company.com"
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            placeholder="Enter your password"
          />

          <Button type="submit" className="w-full">
            {submitting ? "Signing In..." : "Sign In"}
          </Button>

          {errorMessage ? (
            <p className="text-sm text-[var(--color-danger)]" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </form>
      </Card>
    </div>
  );
}
