"use client";

import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { displayName } from "@/lib/auth";
import { usePageHeader } from "@/contexts/PageHeaderContext";
import { PageShell } from "@/components/layout/PageShell";
import { DashboardHome } from "@/components/dashboard/DashboardHome";

export default function DashboardPage() {
  const { user } = useAuth();

  const name = user ? displayName(user) : "";
  const firstName = name.split(" ")[0] || "there";
  const isAdmin = user?.role_name?.toLowerCase() === "admin";

  const pageHeader = useMemo(
    () =>
      user
        ? {
            title: "Dashboard",
            description: `Welcome back, ${firstName}`,
            breadcrumbs: [{ label: "Dashboard" }],
          }
        : null,
    [user, firstName]
  );
  usePageHeader(pageHeader);

  if (!user) return null;

  return (
    <PageShell fill={false} className="min-h-0 flex-1 overflow-y-auto">
      <DashboardHome isAdmin={isAdmin} />
    </PageShell>
  );
}
