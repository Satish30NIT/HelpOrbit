"use client";

import Link from "next/link";
import { Menu, Bell, ChevronRight } from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePageHeaderContext } from "@/contexts/PageHeaderContext";
import { displayName } from "@/lib/auth";
import { ThemeToggle } from "./ThemeToggle";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export function Header() {
  const { collapsed, mobileOpen, toggleCollapsed, toggleMobileOpen } = useSidebar();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const { user } = useAuth();
  const { header } = usePageHeaderContext();
  const name = displayName(user);
  const initials =
    name
      .split(/\s+/)
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  const hasActions = Boolean(header?.actions);
  const actionsToolbar = Boolean(header?.actionsToolbar);
  const inlineActions = hasActions && !actionsToolbar;

  return (
    <header
      className={`app-header header-glass sticky top-0 z-20 flex flex-col gap-0 border-b border-[var(--border)] px-[var(--space-4)] py-2 sm:px-[var(--space-5)] ${
        header ? (actionsToolbar ? "app-header--toolbar" : "") : "justify-center"
      }`}
      style={!header ? { height: "var(--header-height)" } : undefined}
    >
      <div className="flex w-full items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => (isDesktop ? toggleCollapsed() : toggleMobileOpen())}
          className="btn-icon relative z-30 shrink-0 cursor-pointer"
          aria-label={
            isDesktop
              ? collapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
              : mobileOpen
                ? "Close menu"
                : "Open menu"
          }
          aria-expanded={isDesktop ? !collapsed : mobileOpen}
        >
          <Menu className="h-5 w-5 pointer-events-none" aria-hidden />
        </button>

        {header ? (
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-0 text-left">
            {header.breadcrumbs && header.breadcrumbs.length > 0 && (
              <nav
                className="mb-0 flex flex-wrap items-center gap-0.5 text-[11px] leading-none text-[var(--text-muted)]"
                aria-label="Breadcrumb"
              >
                {header.breadcrumbs.map((crumb, i) => (
                  <span key={i} className="flex items-center gap-0.5">
                    {i > 0 && (
                      <ChevronRight className="h-2.5 w-2.5 shrink-0 opacity-60" />
                    )}
                    {crumb.href ? (
                      <Link
                        href={crumb.href}
                        className="font-medium transition-ui hover:text-[var(--primary)]"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="font-medium text-[var(--text-secondary)]">{crumb.label}</span>
                    )}
                  </span>
                ))}
              </nav>
            )}
            <div className="min-w-0">
              <h1 className="page-header-title truncate">{header.title}</h1>
              {header.description && (
                <p className="page-header-desc hidden truncate sm:block">{header.description}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="hidden flex-1 lg:block" />
        )}

        {inlineActions && (
          <div className="page-header-actions hidden shrink-0 sm:flex">{header!.actions}</div>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <button type="button" className="btn-icon relative" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--primary)] ring-2 ring-[var(--bg-card)]" />
          </button>
          <div
            className="flex shrink-0 items-center gap-2 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg-card)] py-1 pl-1 pr-2.5"
            role="group"
            aria-label="Account"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-control)] bg-[var(--primary-soft)] text-xs font-semibold text-[var(--primary)]">
              {initials}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold leading-tight text-[var(--text-primary)]">{name}</p>
              <p className="type-meta capitalize">{user?.role_name || "User"}</p>
            </div>
          </div>
        </div>
      </div>

      {inlineActions && (
        <div className="page-header-actions flex w-full border-t border-[var(--border)] py-2 pl-11 sm:hidden">
          {header!.actions}
        </div>
      )}

      {hasActions && actionsToolbar && (
        <div className="flex w-full items-stretch border-t border-[var(--border)] py-2 pl-11 lg:pl-0">
          {header!.actions}
        </div>
      )}
    </header>
  );
}
