"use client";

import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type PageHeaderBreadcrumb = { label: string; href?: string };

export type PageHeaderState = {
  breadcrumbs?: PageHeaderBreadcrumb[];
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Full-width toolbar row (e.g. metrics + export) — uses extra header height */
  actionsToolbar?: boolean;
};

type PageHeaderContextValue = {
  header: PageHeaderState | null;
  setHeader: (header: PageHeaderState | null) => void;
};

const PageHeaderContext = createContext<PageHeaderContextValue | null>(null);

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [header, setHeader] = useState<PageHeaderState | null>(null);
  const value = useMemo(() => ({ header, setHeader }), [header]);
  return (
    <PageHeaderContext.Provider value={value}>{children}</PageHeaderContext.Provider>
  );
}

export function usePageHeaderContext() {
  const ctx = useContext(PageHeaderContext);
  if (!ctx) {
    throw new Error("usePageHeaderContext must be used within PageHeaderProvider");
  }
  return ctx;
}

/** Register page title/breadcrumbs in the top app header (clears on unmount). */
export function usePageHeader(config: PageHeaderState | null) {
  const { setHeader } = usePageHeaderContext();

  useLayoutEffect(() => {
    setHeader(config);
    return () => setHeader(null);
  }, [setHeader, config]);
}
