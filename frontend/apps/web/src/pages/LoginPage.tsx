import { useState } from "react";
import { Button, Card, Input } from "../components/ui";

interface LoginPageProps {
  onLogin: (username: string) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState("admin@example.com");
  const [password, setPassword] = useState("");

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
          onSubmit={(event) => {
            event.preventDefault();
            onLogin(username);
          }}
        >
          <Input
            label="Username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />

          <Button type="submit" className="w-full">
            Sign In
          </Button>
        </form>
      </Card>
    </div>
  );
}
