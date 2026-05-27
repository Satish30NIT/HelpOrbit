import {
  BarChart3,
  Building2,
  FileText,
  LayoutDashboard,
  LogOut,
  ScrollText,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  disabled?: boolean;
  badge?: string;
};

/** Longest matching nav href for the current path (only one item should appear active). */
export function resolveActiveNavHref(pathname: string, items: NavItem[]): string | null {
  let best: string | null = null;

  for (const item of items) {
    if (item.disabled) continue;

    const match =
      item.href === "/dashboard"
        ? pathname === "/dashboard"
        : pathname === item.href || pathname.startsWith(`${item.href}/`);

    if (match && (!best || item.href.length > best.length)) {
      best = item.href;
    }
  }

  return best;
}

export const mainNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Companies", href: "/dashboard/companies", icon: Building2, adminOnly: true },
  {
    label: "Activity logs",
    href: "/dashboard/activity",
    icon: ScrollText,
    adminOnly: true,
  },
  { label: "Users", href: "/dashboard/users", icon: Users, adminOnly: true },
  { label: "Policies", href: "/dashboard/policies", icon: FileText, adminOnly: true },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3, adminOnly: true, disabled: true, badge: "Soon" },
  { label: "Settings", href: "/dashboard/settings", icon: Settings, disabled: true, badge: "Soon" },
];
