import { useEffect, useState } from "react";
import { parseRoute, type RouteMatch, toHashPath } from "./routes";

function getCurrentRoute(): RouteMatch {
  return parseRoute(window.location.hash);
}

export function useHashRouter() {
  const [match, setMatch] = useState<RouteMatch>(() => getCurrentRoute());

  useEffect(() => {
    const onHashChange = () => setMatch(getCurrentRoute());

    window.addEventListener("hashchange", onHashChange);

    return () => {
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

  const navigate = (path: string) => {
    const nextHash = toHashPath(path);
    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash;
      return;
    }

    setMatch(getCurrentRoute());
  };

  return { match, navigate };
}
