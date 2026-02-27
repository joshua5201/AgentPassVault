export type AppRoute = "login" | "requests" | "request-detail" | "secrets" | "settings";

export interface RouteMatch {
  route: AppRoute;
  params: Record<string, string>;
}

interface RouteDefinition {
  key: Exclude<AppRoute, "request-detail">;
  path: string;
  label: string;
}

export const ROUTES: RouteDefinition[] = [
  { key: "login", path: "/login", label: "Login" },
  { key: "requests", path: "/requests", label: "Requests" },
  { key: "secrets", path: "/secrets", label: "Secrets" },
  { key: "settings", path: "/settings", label: "Settings" },
];

export const DEFAULT_AUTH_ROUTE = "/requests";

export function parseRoute(hash: string): RouteMatch {
  const normalized = hash.replace(/^#/, "") || "/login";
  const segments = normalized.split("/").filter(Boolean);

  if (segments.length === 0 || segments[0] === "login") {
    return { route: "login", params: {} };
  }

  if (segments[0] === "requests" && segments.length === 2) {
    return { route: "request-detail", params: { requestId: segments[1] } };
  }

  if (segments[0] === "requests") {
    return { route: "requests", params: {} };
  }

  if (segments[0] === "secrets") {
    return { route: "secrets", params: {} };
  }

  if (segments[0] === "settings") {
    return { route: "settings", params: {} };
  }

  return { route: "login", params: {} };
}

export function toHashPath(path: string): string {
  return `#${path.startsWith("/") ? path : `/${path}`}`;
}
