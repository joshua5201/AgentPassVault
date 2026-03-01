import type { ReactNode } from "react";
import { FlaskConical, KeyRound, Lock, LogOut, Settings, Shield, Vault } from "lucide-react";
import { Button } from "../ui";

interface NavItem {
  key: string;
  label: string;
  path: string;
}

interface AppShellProps {
  children: ReactNode;
  adminName: string;
  currentPath: string;
  navItems: NavItem[];
  onNavigate: (path: string) => void;
  onLockVault: () => void;
  onLogout: () => void;
}

function navIconFor(key: string) {
  if (key === "requests") {
    return <Shield className="h-4 w-4" />;
  }

  if (key === "secrets") {
    return <Vault className="h-4 w-4" />;
  }

  if (key === "settings") {
    return <Settings className="h-4 w-4" />;
  }

  if (key === "ui-lab") {
    return <FlaskConical className="h-4 w-4" />;
  }

  return <KeyRound className="h-4 w-4" />;
}

export function AppShell({
  children,
  adminName,
  currentPath,
  navItems,
  onNavigate,
  onLockVault,
  onLogout,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-[var(--color-app-bg)] text-[var(--color-text)]">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="w-72 border-r border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-6">
          <div className="rounded-xl bg-[var(--color-primary)] px-4 py-3 text-white">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-300">AgentPassVault</p>
            <p className="mt-1 text-lg font-semibold">Admin Console</p>
          </div>

          <nav className="mt-6 space-y-2">
            {navItems.map((item) => {
              const isActive = currentPath === item.path;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onNavigate(item.path)}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                    isActive
                      ? "bg-[var(--color-primary)] text-white"
                      : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
                  }`}
                >
                  {navIconFor(item.key)}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-8 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-text-muted)]">Signed in</p>
              <p className="text-sm font-medium text-[var(--color-text)]">{adminName}</p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="secondary" startIcon={<Lock className="h-4 w-4" />} onClick={onLockVault}>
                Lock Vault
              </Button>
              <Button variant="secondary" startIcon={<LogOut className="h-4 w-4" />} onClick={onLogout}>
                Logout
              </Button>
            </div>
          </header>

          <main className="flex-1 p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
