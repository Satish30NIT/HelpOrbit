"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePageHeader } from "@/contexts/PageHeaderContext";
import { ActivityLogMetricsStrip } from "@/components/companies/ActivityLogMetricsStrip";
import { ActivityLogList } from "@/components/activity/ActivityLogList";
import { DataPageLayout } from "@/components/layout/DataPageLayout";
import { activityExportFilename, exportActivityLogsCsv } from "@/lib/exportActivityLogs";
import type { ActivityLogCategory } from "@/lib/activityLogs";
import type { DatePreset } from "@/lib/activityDateRange";
import type { CompanyActivityLog } from "@/types/activityLog";
import { useToast } from "@/contexts/ToastContext";

function parseCategory(raw: string | null): ActivityLogCategory {
  if (raw === "company" || raw === "user") return raw;
  return "all";
}

export default function ActivityLogsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role_name?.toLowerCase() === "admin";
  const exportItemsRef = useRef<CompanyActivityLog[]>([]);
  const [metricsDatePreset, setMetricsDatePreset] = useState<DatePreset>("7d");

  const userIdParam = searchParams.get("user_id");
  const userId = userIdParam ? Number(userIdParam) : undefined;
  const initialCategory = parseCategory(searchParams.get("category"));

  const handleExport = useCallback(() => {
    const items = exportItemsRef.current;
    if (!items.length) {
      toast("No logs on this page to export", "error");
      return;
    }
    exportActivityLogsCsv(items, activityExportFilename());
    toast(`Exported ${items.length} events`, "success");
  }, [toast]);

  const pageHeader = useMemo(
    () => ({
      title: userId ? "User activity" : "Activity logs",
      description:
        "Audit trail for company and user changes, logins, and company mapping updates",
      breadcrumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Activity logs" },
      ],
      actionsToolbar: true,
      actions: (
        <div className="flex w-full min-w-0 items-center gap-3">
          {!userId && (
            <ActivityLogMetricsStrip
              datePreset={metricsDatePreset}
              category={initialCategory}
            />
          )}
          <button
            type="button"
            onClick={handleExport}
            className="btn-primary shrink-0 self-center whitespace-nowrap"
          >
            <Upload className="h-4 w-4" />
            Export Logs
          </button>
        </div>
      ),
    }),
    [handleExport, initialCategory, metricsDatePreset, userId]
  );
  usePageHeader(isAdmin ? pageHeader : null);

  useEffect(() => {
    if (!isAdmin) router.replace("/dashboard");
  }, [isAdmin, router]);

  if (!isAdmin) return null;

  return (
    <DataPageLayout
      table={
        <ActivityLogList
          userId={userId}
          initialCategory={userId ? "user" : initialCategory}
          showMetrics={false}
          onDatePresetChange={setMetricsDatePreset}
          onItemsChange={(items) => {
            exportItemsRef.current = items;
          }}
        />
      }
    />
  );
}
