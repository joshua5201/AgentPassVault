import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Bot,
  CircleUserRound,
  ChevronDown,
  FlaskConical,
  History,
  KeyRound,
  Lock,
  LogOut,
  Moon,
  Settings,
  Shield,
  Sun,
  Vault,
} from "lucide-react";
import { cn } from "../../lib/cn";

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

  if (key === "agents") {
    return <Bot className="h-4 w-4" />;
  }

  if (key === "audit-log") {
    return <History className="h-4 w-4" />;
  }

  if (key === "settings") {
    return <Settings className="h-4 w-4" />;
  }

  if (key === "ui-lab") {
    return <FlaskConical className="h-4 w-4" />;
  }

  return <KeyRound className="h-4 w-4" />;
}

function activeNavClass(key: string) {
  void key;
  return "border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] text-[var(--color-accent-text)]";
}

type ThemeMode = "light" | "dark";

export function AppShell({
  children,
  adminName,
  currentPath,
  navItems,
  onNavigate,
  onLockVault,
  onLogout,
}: AppShellProps) {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("apv-theme");
    if (storedTheme === "light" || storedTheme === "dark") {
      setTheme(storedTheme);
      document.documentElement.dataset.theme = storedTheme;
      return;
    }

    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const resolvedTheme: ThemeMode = prefersDark ? "dark" : "light";
    setTheme(resolvedTheme);
    document.documentElement.dataset.theme = resolvedTheme;
  }, []);

  useEffect(() => {
    if (!isUserMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsUserMenuOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isUserMenuOpen]);

  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("apv-theme", nextTheme);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-app-bg)] text-[var(--color-text)] xl:h-dvh xl:overflow-hidden">
      <header className="z-30 shrink-0 border-b border-[var(--color-border)] bg-[color:color-mix(in_srgb,var(--color-shell)_86%,transparent)] backdrop-blur-xl">
        <div className="flex h-[var(--layout-topbar-height)] items-center justify-between px-5">
          <button
            type="button"
            onClick={() => onNavigate("/requests")}
            className="inline-flex shrink-0 items-center rounded-[var(--radius-control)] px-2 py-1.5 text-left transition hover:bg-[var(--color-surface-subtle)]"
          >
            <span className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">
                AgentPassVault
              </span>
              <span className="text-sm font-semibold tracking-[-0.01em] text-[var(--color-text)]">
                Operations Console
              </span>
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-control)] border border-transparent text-[var(--color-text-muted)] transition hover:border-[var(--color-border)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-app-bg)]"
              aria-label={
                theme === "light"
                  ? "Switch to dark mode"
                  : "Switch to light mode"
              }
              title={theme === "light" ? "Dark mode" : "Light mode"}
            >
              {theme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </button>

            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((open) => !open)}
                className="inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-control)] border border-transparent px-2 text-[var(--color-text-muted)] transition hover:border-[var(--color-border)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-app-bg)]"
                aria-haspopup="menu"
                aria-expanded={isUserMenuOpen}
                aria-label="Open user menu"
              >
                <CircleUserRound className="h-5 w-5 text-[var(--color-text)]" />
                <ChevronDown className="h-3.5 w-3.5 text-[var(--color-text-subtle)]" />
              </button>

              {isUserMenuOpen ? (
                <div
                  className="absolute right-0 top-[calc(100%+0.5rem)] w-64 rounded-[var(--radius-menu)] border border-[var(--color-border)] bg-[var(--color-shell)] p-2 shadow-[var(--color-shadow)]"
                  role="menu"
                >
                  <div className="rounded-[var(--radius-panel)] px-3 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">
                      User
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">
                      {adminName}
                    </p>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                      Human review remains the action boundary for request
                      handling and lease issuance.
                    </p>
                  </div>

                  <div className="my-2 h-px bg-[var(--color-border)]" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onLockVault();
                    }}
                    className="flex w-full items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-left text-sm text-[var(--color-text)] transition hover:bg-[var(--color-surface-subtle)]"
                    role="menuitem"
                  >
                    <Lock className="h-4 w-4 text-[var(--color-text-muted)]" />
                    <span>Lock vault</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onLogout();
                    }}
                    className="flex w-full items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-left text-sm text-[var(--color-danger)] transition hover:bg-[var(--color-danger-soft)]"
                    role="menuitem"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 flex-col xl:flex-row xl:overflow-hidden">
        <aside className="flex shrink-0 flex-col border-b border-[var(--color-border)] bg-[var(--color-shell)] xl:h-full xl:w-[var(--layout-sidebar-width)] xl:overflow-y-auto xl:border-b-0 xl:border-r">
          <nav className="flex-1 space-y-1 px-2.5 py-4">
            {navItems.map((item) => {
              const isActive = currentPath === item.path;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onNavigate(item.path)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-[var(--radius-control)] border px-3 py-2.5 text-left text-[13px] font-medium transition",
                    isActive
                      ? activeNavClass(item.key)
                      : "border-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text)]",
                  )}
                >
                  {navIconFor(item.key)}
                  <span className="flex-1">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 px-5 py-5 xl:flex xl:h-full xl:min-h-0 xl:flex-col xl:overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
