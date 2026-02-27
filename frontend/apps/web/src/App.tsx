import { useEffect, useState } from "react";
import { appApiClient } from "./api/client";
import { AppShell } from "./components/layout/AppShell";
import { Toast } from "./components/ui";
import { useHashRouter } from "./app/router";
import { DEFAULT_AUTH_ROUTE, ROUTES } from "./app/routes";
import { LoginPage } from "./pages/LoginPage";
import { RequestDetailPage } from "./pages/RequestDetailPage";
import { RequestsPage } from "./pages/RequestsPage";
import { SecretsPage } from "./pages/SecretsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { UiLabPage } from "./pages/UiLabPage";
import { VaultUnlockPage } from "./pages/VaultUnlockPage";
import { useVaultLockManager } from "./hooks/use-vault-lock-manager";
import { AuthCryptoOrchestrator, useVaultKeyStore } from "./security";
import { useSessionStore } from "./state/session-store";

function App() {
  const { match, navigate } = useHashRouter();
  const [notice, setNotice] = useState<{ message: string; tone: "info" | "success" | "error" } | null>(null);
  const { isAuthenticated, adminName, setLoginSession, logout, accessToken } = useSessionStore();
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

  useEffect(() => {
    appApiClient.setAccessToken(accessToken);
  }, [accessToken]);

  useVaultLockManager({
    enabled: isAuthenticated,
    isLocked,
    lastActivityAt,
    vaultUnlockedAt,
    markActivity,
    lockVault,
  });

  useEffect(() => {
    if (!isAuthenticated && match.route !== "login") {
      navigate("/login");
      return;
    }

    if (isAuthenticated && match.route === "login") {
      navigate(DEFAULT_AUTH_ROUTE);
    }
  }, [isAuthenticated, match.route, navigate]);

  if (!isAuthenticated || match.route === "login") {
    return (
      <LoginPage
        onLogin={async (username, password, twoFactorCode) => {
          const derived = await AuthCryptoOrchestrator.deriveForLogin(username, password);

          const result = twoFactorCode
            ? await appApiClient.loginWith2fa({
                username: derived.username,
                password: derived.loginHash,
                code: twoFactorCode,
              })
            : await appApiClient.login({
                username: derived.username,
                password: derived.loginHash,
              });
          if (!result.ok) {
            throw new Error(result.error.message);
          }

          setLoginSession(derived.username, result.data);
          setVaultSession(derived.masterKeys, derived.loginHash);
        }}
      />
    );
  }

  const navItems = ROUTES.filter((route) => route.key !== "login").map((route) => ({
    key: route.key,
    path: route.path,
    label: route.label,
  }));

  const currentPath =
    match.route === "request-detail"
      ? "/requests"
      : ROUTES.find((route) => route.key === match.route)?.path ?? "/requests";

  return (
    <AppShell
      adminName={adminName}
      currentPath={currentPath}
      navItems={navItems}
      onNavigate={navigate}
      onLockVault={lockVault}
      onLogout={() => {
        clearVaultSession();
        logout();
        navigate("/login");
      }}
    >
      {notice ? <Toast tone={notice.tone} title="Notification">{notice.message}</Toast> : null}
      {isLocked ? (
        <VaultUnlockPage
          username={adminName}
          onUnlock={async (password) => {
            if (!loginHash) {
              throw new Error("Login hash is unavailable; sign out and sign in again.");
            }

            const unlockResult = await AuthCryptoOrchestrator.validateUnlockPassword(adminName, password, loginHash);
            if (!unlockResult.valid || !unlockResult.masterKeys) {
              throw new Error("Invalid master password.");
            }

            setVaultSession(unlockResult.masterKeys, loginHash);
          }}
        />
      ) : null}
      {match.route === "requests" ? <RequestsPage onOpenRequest={(requestId) => navigate(`/requests/${requestId}`)} /> : null}
      {match.route === "request-detail" ? (
        <RequestDetailPage
          requestId={match.params.requestId ?? ""}
          onBack={() => navigate("/requests")}
          isVaultLocked={isLocked}
          masterKeys={masterKeys}
          onNotify={(message, tone = "info") => {
            setNotice({ message, tone });
          }}
        />
      ) : null}
      {match.route === "secrets" ? <SecretsPage isVaultLocked={isLocked} masterKeys={masterKeys} /> : null}
      {match.route === "settings" ? <SettingsPage /> : null}
      {match.route === "ui-lab" ? <UiLabPage /> : null}
    </AppShell>
  );
}

export default App;
