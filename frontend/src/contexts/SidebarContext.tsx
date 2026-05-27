"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type SidebarContextValue = {
  collapsed: boolean;
  mobileOpen: boolean;
  toggleCollapsed: () => void;
  setMobileOpen: (open: boolean) => void;
  toggleMobileOpen: () => void;
  closeMobile: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("helporbit.sidebar.collapsed");
    if (stored === "true") setCollapsed(true);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem("helporbit.sidebar.collapsed", String(next));
      return next;
    });
  }, []);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const toggleMobileOpen = useCallback(() => {
    setMobileOpen((open) => !open);
  }, []);

  const value = useMemo(
    () => ({
      collapsed,
      mobileOpen,
      toggleCollapsed,
      setMobileOpen,
      toggleMobileOpen,
      closeMobile,
    }),
    [collapsed, mobileOpen, toggleCollapsed, toggleMobileOpen, closeMobile]
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}
