import { useEffect } from "react";
import { AppShell } from "./components/layout/AppShell";
import { useHashRouter } from "./app/router";
import { DEFAULT_AUTH_ROUTE, ROUTES } from "./app/routes";
import { LoginPage } from "./pages/LoginPage";
import { RequestDetailPage } from "./pages/RequestDetailPage";
import { RequestsPage } from "./pages/RequestsPage";
import { SecretsPage } from "./pages/SecretsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { useSessionStore } from "./state/session-store";

function App() {
  const { match, navigate } = useHashRouter();
  const { isAuthenticated, adminName, login, logout } = useSessionStore();

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
    return <LoginPage onLogin={(username) => login(username)} />;
  }

  const navItems = ROUTES.filter((route) => route.key !== "login").map((route) => ({
    key: route.key,
    path: route.path,
    label: route.label,
  }));

  const currentPath =
    match.route === "request-detail" ? "/requests" : ROUTES.find((route) => route.key === match.route)?.path ?? "/requests";

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
      {match.route === "request-detail" ? <RequestDetailPage requestId={match.params.requestId ?? ""} onBack={() => navigate("/requests")} /> : null}
      {match.route === "secrets" ? <SecretsPage /> : null}
      {match.route === "settings" ? <SettingsPage /> : null}
    </AppShell>
  );
}

export default App;
