export type AppRoute =
  | "login"
  | "fulfillment"
  | "requests"
  | "agents"
  | "audit-log"
  | "secrets"
  | "settings"
  | "ui-lab";

export interface RouteMatch {
  route: AppRoute;
  params: Record<string, string>;
}

interface RouteDefinition {
  key: AppRoute;
  path: string;
  label: string;
}

export const ROUTES: RouteDefinition[] = [
  { key: "login", path: "/login", label: "Login" },
  { key: "requests", path: "/requests", label: "Requests" },
  { key: "secrets", path: "/secrets", label: "Secrets" },
  { key: "agents", path: "/agents", label: "Agents" },
  { key: "audit-log", path: "/audit-log", label: "Audit Log" },
  { key: "settings", path: "/settings", label: "Settings" },
  { key: "ui-lab", path: "/ui-lab", label: "UI Lab" },
];

export const DEFAULT_AUTH_ROUTE = "/requests";

function parseHashRoute(hash: string): RouteMatch | null {
  const normalized = hash.replace(/^#/, "");
  if (!normalized) {
    return null;
  }

  const [pathname, rawQuery = ""] = normalized.split("?");
  const queryParams = Object.fromEntries(new URLSearchParams(rawQuery).entries());
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return { route: "login", params: queryParams };
  }

  if (segments[0] === "login") {
    return { route: "login", params: queryParams };
  }

  if (segments[0] === "fulfill" && segments.length === 2) {
    return {
      route: "fulfillment",
      params: { requestId: segments[1], ...queryParams },
    };
  }

  if (segments[0] === "requests") {
    if (segments.length === 2) {
      return {
        route: "requests",
        params: { request: segments[1], ...queryParams },
      };
    }
    return { route: "requests", params: queryParams };
  }

  if (segments[0] === "secrets") {
    if (segments.length === 2) {
      return {
        route: "secrets",
        params: { secret: segments[1], ...queryParams },
      };
    }
    return { route: "secrets", params: queryParams };
  }

  if (segments[0] === "agents") {
    return { route: "agents", params: queryParams };
  }

  if (segments[0] === "audit-log") {
    return { route: "audit-log", params: queryParams };
  }

  if (segments[0] === "settings") {
    return { route: "settings", params: queryParams };
  }

  if (segments[0] === "ui-lab") {
    return { route: "ui-lab", params: queryParams };
  }

  return { route: "login", params: queryParams };
}

function parsePathnameRoute(pathname: string): RouteMatch | null {
  const normalized = pathname || "/";
  const segments = normalized.split("/").filter(Boolean);
  if (segments[0] === "fulfill" && segments.length === 2) {
    return { route: "fulfillment", params: { requestId: segments[1] } };
  }

  if (segments[0] === "requests" && segments.length === 2) {
    return { route: "requests", params: { request: segments[1] } };
  }

  if (segments[0] === "secrets" && segments.length === 2) {
    return { route: "secrets", params: { secret: segments[1] } };
  }

  return null;
}

export function parseRoute(hash: string, pathname: string = "/"): RouteMatch {
  const hashMatch = parseHashRoute(hash);
  if (hashMatch) {
    return hashMatch;
  }

  const pathMatch = parsePathnameRoute(pathname);
  if (pathMatch) {
    return pathMatch;
  }

  return { route: "login", params: {} };
}

export function toHashPath(path: string): string {
  return `#${path.startsWith("/") ? path : `/${path}`}`;
}
