import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type RouteContextValue = {
  path: string;
  navigate: (to: string) => void;
};

const RouteContext = createContext<RouteContextValue | null>(null);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const value = useMemo<RouteContextValue>(() => {
    const navigate = (to: string) => {
      if (to === window.location.pathname) return;
      window.history.pushState({}, '', to);
      setPath(to);
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    };
    return { path, navigate };
  }, [path]);

  return <RouteContext.Provider value={value}>{children}</RouteContext.Provider>;
}

export function useRouter() {
  const ctx = useContext(RouteContext);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
}

// Simple path matcher supporting one named param, e.g. matchRoute('/product/:slug', path)
export function matchRoute(pattern: string, path: string): Record<string, string> | null {
  const pParts = pattern.split('/').filter(Boolean);
  const aParts = path.split('/').filter(Boolean);
  if (pParts.length !== aParts.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < pParts.length; i++) {
    if (pParts[i].startsWith(':')) {
      params[pParts[i].slice(1)] = decodeURIComponent(aParts[i]);
    } else if (pParts[i] !== aParts[i]) {
      return null;
    }
  }
  return params;
}
