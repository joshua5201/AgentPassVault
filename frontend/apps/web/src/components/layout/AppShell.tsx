import type { ReactNode } from "react";
import { KeyRound, LogOut, Settings, Shield, Vault } from "lucide-react";

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

  return <KeyRound className="h-4 w-4" />;
}

export function AppShell({
  children,
  adminName,
  currentPath,
  navItems,
  onNavigate,
  onLogout,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="w-72 border-r border-slate-200 bg-white px-4 py-6">
          <div className="rounded-xl bg-slate-900 px-4 py-3 text-white">
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
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
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
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Signed in</p>
              <p className="text-sm font-medium text-slate-900">{adminName}</p>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </header>

          <main className="flex-1 p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
