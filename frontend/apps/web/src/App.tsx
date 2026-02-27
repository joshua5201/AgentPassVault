import { useEffect } from "react";
import { appApiClient } from "./api/client";
import { AppShell } from "./components/layout/AppShell";
import { readAppEnv } from "./config/env";
import { useHashRouter } from "./app/router";
import { DEFAULT_AUTH_ROUTE, ROUTES } from "./app/routes";
import { LoginPage } from "./pages/LoginPage";
import { RequestDetailPage } from "./pages/RequestDetailPage";
import { RequestsPage } from "./pages/RequestsPage";
import { SecretsPage } from "./pages/SecretsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { UiLabPage } from "./pages/UiLabPage";
import { useSessionStore } from "./state/session-store";

function App() {
  const env = readAppEnv();
  const { match, navigate } = useHashRouter();
  const { isAuthenticated, adminName, login, setLoginSession, logout, accessToken } = useSessionStore();

  useEffect(() => {
    appApiClient.setAccessToken(accessToken);
  }, [accessToken]);

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
        onLogin={async (username, password) => {
          if (env.apiMockingEnabled) {
            login(username);
            return;
          }

          const result = await appApiClient.login({ username, password });
          if (!result.ok) {
            throw new Error(result.error.message);
          }

          setLoginSession(username, result.data);
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
      onLogout={() => {
        logout();
        navigate("/login");
      }}
    >
      {match.route === "requests" ? <RequestsPage onOpenRequest={(requestId) => navigate(`/requests/${requestId}`)} /> : null}
      {match.route === "request-detail" ? (
        <RequestDetailPage requestId={match.params.requestId ?? ""} onBack={() => navigate("/requests")} />
      ) : null}
      {match.route === "secrets" ? <SecretsPage /> : null}
      {match.route === "settings" ? <SettingsPage /> : null}
      {match.route === "ui-lab" ? <UiLabPage /> : null}
    </AppShell>
  );
}

export default App;
