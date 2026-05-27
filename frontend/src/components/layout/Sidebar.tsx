"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, LogOut } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useSidebar } from "@/contexts/SidebarContext";
import { useAuth } from "@/contexts/AuthContext";
import { mainNav, resolveActiveNavHref } from "@/config/navigation";
import { displayName } from "@/lib/auth";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { collapsed, mobileOpen, toggleCollapsed, closeMobile } = useSidebar();
  const isAdmin = user?.role_name?.toLowerCase() === "admin";

  const items = mainNav.filter((item) => !item.adminOnly || isAdmin);
  const activeHref = resolveActiveNavHref(pathname, items);

  function isActive(href: string) {
    return activeHref === href;
  }

  function handleLogout() {
    logout();
    closeMobile();
    router.replace("/login");
  }

  const width = collapsed ? "w-[var(--sidebar-collapsed)]" : "w-[var(--sidebar-width)]";

  const sidebarContent = (
    <div className={`sidebar-shell ${width}`}>
      <div
        className="flex items-center justify-between border-b border-[var(--sidebar-border)] px-[var(--space-4)]"
        style={{ height: "var(--header-height)" }}
      >
        <Link href="/dashboard" onClick={closeMobile}>
          <Logo size="sm" showText={!collapsed} collapsed={collapsed} variant="light" />
        </Link>
        <button
          type="button"
          onClick={toggleCollapsed}
          className="btn-icon hidden lg:flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <motion.span animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronLeft className="h-4 w-4" />
          </motion.span>
        </button>
      </div>

      {!collapsed && (
        <p className="px-[var(--space-4)] pb-1 pt-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
          Main menu
        </p>
      )}

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-[var(--space-2)] py-[var(--space-2)]">
        {items.map((item) => {
          const active = !item.disabled && isActive(item.href);
          const Icon = item.icon;

          if (item.disabled) {
            return (
              <div
                key={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex cursor-not-allowed items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-sm text-[var(--text-muted)] opacity-60 ${
                  collapsed ? "justify-center" : ""
                }`}
              >
                <Icon className="h-[1.125rem] w-[1.125rem] shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && <span className="nav-badge-soon">{item.badge}</span>}
                  </>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMobile}
              title={collapsed ? item.label : undefined}
              className={`sidebar-nav-link ${collapsed ? "justify-center px-2" : ""} ${
                active ? "sidebar-nav-link--active" : ""
              }`}
            >
              <Icon className="h-[1.125rem] w-[1.125rem] shrink-0" />
              {!collapsed && <span className="flex-1">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-divider" aria-hidden />

      <div className="p-[var(--space-3)]">
        {!collapsed && user && (
          <div className="mb-[var(--space-3)] rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
              {displayName(user)}
            </p>
            <p className="truncate text-xs text-[var(--text-secondary)]">{user.email}</p>
            {user.role_name && (
              <span className="status-chip status-chip--muted mt-2">{user.role_name}</span>
            )}
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          title={collapsed ? "Logout" : undefined}
          className={`sidebar-nav-link w-full text-[var(--danger)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)] ${
            collapsed ? "justify-center px-2" : ""
          }`}
        >
          <LogOut className="h-[1.125rem] w-[1.125rem] shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <motion.button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMobile}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={`fixed inset-y-0 left-0 z-50 lg:hidden ${width} ${
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        initial={false}
        animate={{ x: mobileOpen ? 0 : "-100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        aria-hidden={!mobileOpen}
        inert={mobileOpen ? undefined : true}
      >
        {sidebarContent}
      </motion.aside>

      <aside className={`hidden shrink-0 lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex ${width}`}>
        {sidebarContent}
      </aside>
    </>
  );
}
