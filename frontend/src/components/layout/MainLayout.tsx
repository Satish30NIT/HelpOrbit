"use client";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import { PageHeaderProvider } from "@/contexts/PageHeaderContext";

function LayoutInner({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <div className="app-bg h-screen overflow-hidden">
      <Sidebar />
      <div
        className={`flex h-screen flex-col overflow-hidden transition-[margin] duration-300 ease-out lg:ml-[var(--sidebar-width)] ${
          collapsed ? "lg:ml-[var(--sidebar-collapsed)]" : ""
        }`}
      >
        <Header />
        <main className="app-main">{children}</main>
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
