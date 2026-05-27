"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import { PageHeaderProvider } from "@/contexts/PageHeaderContext";

function LayoutInner({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  const pathname = usePathname();
  const isDashboardHome = pathname === "/dashboard";

  return (
    <div className="app-bg h-screen overflow-hidden">
      <Sidebar />
      <div
        className={`flex h-screen flex-col overflow-hidden transition-[margin] duration-300 ease-out lg:ml-[var(--sidebar-width)] ${
          collapsed ? "lg:ml-[var(--sidebar-collapsed)]" : ""
        }`}
      >
        <Header />
        <main className={`app-main${isDashboardHome ? " app-main--dashboard" : ""}`}>
          {children}
        </main>
      </div>
    </div>
  );
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <PageHeaderProvider>
        <LayoutInner>{children}</LayoutInner>
      </PageHeaderProvider>
    </SidebarProvider>
  );
}
