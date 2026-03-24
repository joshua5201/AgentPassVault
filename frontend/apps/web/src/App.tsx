import { useEffect, useState } from "react";
import { appApiClient } from "./api/client";
import { AppShell } from "./components/layout/AppShell";
import { Toast } from "./components/ui";
import { useHashRouter } from "./app/router";
import { DEFAULT_AUTH_ROUTE, ROUTES } from "./app/routes";
import { LoginPage } from "./pages/LoginPage";
import { AgentsPage } from "./pages/AgentsPage";
import { AuditLogPage } from "./pages/AuditLogPage";
import { RequestsPage } from "./pages/RequestsPage";
import { SecretsPage } from "./pages/SecretsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { UiLabPage } from "./pages/UiLabPage";
import { VaultUnlockPage } from "./pages/VaultUnlockPage";
import { FulfillmentPage } from "./pages/FulfillmentPage";
import { useVaultLockManager } from "./hooks/use-vault-lock-manager";
import { AuthCryptoOrchestrator, useVaultKeyStore } from "./security";
import { useSessionStore } from "./state/session-store";
import { readAppEnv } from "./config/env";
import { createMockDevSession } from "./security/mock-dev-session";
import type { LoginResponse, MasterKeys } from "@agentpassvault/sdk";

async function applyMockDevSession(
  setLoginSession: (username: string, loginResponse: LoginResponse) => void,
  setVaultSession: (masterKeys: MasterKeys, loginHash: string) => void,
) {
  const session = await createMockDevSession();
  setLoginSession(session.username, session.loginResponse);
  setVaultSession(session.masterKeys, session.loginHash);
}

function App() {
  const { match, navigate } = useHashRouter();
  const env = readAppEnv();
  const [notice, setNotice] = useState<{
    message: string;
    tone: "info" | "success" | "error";
  } | null>(null);
  const { isAuthenticated, adminName, setLoginSession, logout, accessToken } =
    useSessionStore();
  const {
    masterKeys,
    loginHash,
    isLocked,
    setVaultSession,
    lockVault,
    clearVaultSession,
    markActivity,
    lastActivityAt,
    vaultUnlockedAt,
  } = useVaultKeyStore();
  const pageStateKey = `${isLocked ? "locked" : "unlocked"}-${vaultUnlockedAt ?? 0}`;
  const mockBootstrapNeeded =
    env.apiMockingEnabled && (!isAuthenticated || (!loginHash && !masterKeys));

  useEffect(() => {
    appApiClient.setAccessToken(accessToken);
  }, [accessToken]);

  useEffect(() => {
    if (!mockBootstrapNeeded) {
      return;
    }

    let active = true;

    void applyMockDevSession(setLoginSession, setVaultSession).catch(
      (error) => {
        if (!active) {
          return;
        }

        console.error("Mock auth bootstrap failed.", error);
      },
    );

    return () => {
      active = false;
    };
  }, [mockBootstrapNeeded, setLoginSession, setVaultSession]);

  useVaultLockManager({
    enabled: isAuthenticated,
    isLocked,
    lastActivityAt,
    vaultUnlockedAt,
    markActivity,
    lockVault,
  });

  useEffect(() => {
    if (mockBootstrapNeeded) {
      return;
    }

    if (
      !isAuthenticated &&
      match.route !== "login" &&
      match.route !== "fulfillment"
    ) {
      navigate("/login");
      return;
    }

    if (isAuthenticated && match.route === "login") {
      navigate(DEFAULT_AUTH_ROUTE);
    }
  }, [isAuthenticated, match.route, mockBootstrapNeeded, navigate]);

  useEffect(() => {
    if (!env.apiMockingEnabled && match.route === "ui-lab") {
      navigate(DEFAULT_AUTH_ROUTE);
    }
  }, [env.apiMockingEnabled, match.route, navigate]);

  useEffect(() => {
    setNotice(null);
  }, [pageStateKey]);

  const handleLogin = async (username: string, password: string) => {
    if (env.apiMockingEnabled) {
      await applyMockDevSession(setLoginSession, setVaultSession);
      return;
    }

    const derived = await AuthCryptoOrchestrator.deriveForLogin(
      username,
      password,
    );

    const result = await appApiClient.login({
      username: derived.username,
      password: derived.loginHash,
    });
    if (!result.ok) {
      throw new Error(result.error.message);
    }

    setLoginSession(derived.username, result.data);
    setVaultSession(derived.masterKeys, derived.loginHash);
  };

  const handleUnlock = async (password: string) => {
    if (env.apiMockingEnabled) {
      await applyMockDevSession(setLoginSession, setVaultSession);
      return;
    }

    if (!loginHash) {
      const derived = await AuthCryptoOrchestrator.deriveForLogin(
        adminName,
        password,
      );
      const reloginResult = await appApiClient.login({
        username: derived.username,
        password: derived.loginHash,
      });

      if (!reloginResult.ok) {
        throw new Error("Invalid master password.");
      }

      setLoginSession(derived.username, reloginResult.data);
      setVaultSession(derived.masterKeys, derived.loginHash);
      return;
    }

    const unlockResult = await AuthCryptoOrchestrator.validateUnlockPassword(
      adminName,
      password,
      loginHash,
    );
    if (!unlockResult.valid || !unlockResult.masterKeys) {
      throw new Error("Invalid master password.");
    }

    setVaultSession(unlockResult.masterKeys, loginHash);
  };

  if (match.route === "fulfillment") {
    if (mockBootstrapNeeded) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--color-app-bg)] px-4 text-[var(--color-text-muted)]">
          Preparing mock session...
        </div>
      );
    }

    return (
      <FulfillmentPage
        key={`fulfillment-${match.params.requestId ?? "unknown"}-${pageStateKey}`}
        requestId={match.params.requestId ?? ""}
        isAuthenticated={isAuthenticated}
        adminName={adminName}
        isVaultLocked={isLocked}
        masterKeys={masterKeys}
        onLogin={handleLogin}
        onUnlock={handleUnlock}
        onLogout={
          env.apiMockingEnabled
            ? () => {
                void applyMockDevSession(setLoginSession, setVaultSession);
              }
            : () => {
                clearVaultSession();
                logout();
              }
        }
      />
    );
  }

  if (mockBootstrapNeeded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-app-bg)] px-4 text-[var(--color-text-muted)]">
        Preparing mock session...
      </div>
    );
  }

  if (!isAuthenticated || match.route === "login") {
    return <LoginPage onLogin={handleLogin} />;
  }

  const navItems = ROUTES.filter((route) => {
    if (route.key === "login") {
      return false;
    }

    if (!env.apiMockingEnabled && route.key === "ui-lab") {
      return false;
    }

    return true;
  }).map((route) => ({
    key: route.key,
    path: route.path,
    label: route.label,
  }));

  const currentPath =
    ROUTES.find((route) => route.key === match.route)?.path ?? "/requests";

  return (
    <AppShell
      adminName={adminName}
      currentPath={currentPath}
      navItems={navItems}
      onNavigate={navigate}
      onLockVault={lockVault}
      onLogout={
        env.apiMockingEnabled
          ? () => {
              void applyMockDevSession(setLoginSession, setVaultSession);
            }
          : () => {
              clearVaultSession();
              logout();
              navigate("/login");
            }
      }
    >
      {notice ? (
        <Toast
          tone={notice.tone}
          title="Notification"
          onDismiss={() => setNotice(null)}
        >
          {notice.message}
        </Toast>
      ) : null}
      {isLocked ? (
        <VaultUnlockPage username={adminName} onUnlock={handleUnlock} />
      ) : null}
      {match.route === "requests" ? (
        <RequestsPage
          key={`requests-${pageStateKey}`}
          initialSelectedRequestId={match.params.request ?? null}
        />
      ) : null}
      {match.route === "secrets" ? (
        <SecretsPage
          key={`secrets-${pageStateKey}`}
          isVaultLocked={isLocked}
          masterKeys={masterKeys}
          initialSelectedSecretId={match.params.secret ?? null}
          initialSelectedSecretName={match.params.secretName ?? null}
        />
      ) : null}
      {match.route === "agents" ? (
        <AgentsPage
          initialSelectedAgentId={match.params.agent ?? null}
          initialSelectedAgentName={match.params.agentName ?? null}
        />
      ) : null}
      {match.route === "audit-log" ? <AuditLogPage /> : null}
      {match.route === "settings" ? <SettingsPage /> : null}
      {match.route === "ui-lab" && env.apiMockingEnabled ? <UiLabPage /> : null}
    </AppShell>
  );
}

export default App;
