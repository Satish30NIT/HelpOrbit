"use client";

import { useCallback, useEffect, useState } from "react";
import { ActivityMetricCard } from "@/components/companies/ActivityMetricCard";
import { fetchActivityLogStats, type ActivityLogCategory } from "@/lib/activityLogs";
import { metricTitles } from "@/lib/activityLogLabels";
import { dateRangeFromPreset, type DatePreset } from "@/lib/activityDateRange";
import type { ActivityLogStats } from "@/types/activityLog";

type Props = {
  datePreset: DatePreset;
  category?: ActivityLogCategory;
  className?: string;
};

export function ActivityLogMetricsStrip({
  datePreset,
  category = "all",
  className = "",
}: Props) {
  const [stats, setStats] = useState<ActivityLogStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const range = dateRangeFromPreset(datePreset);
      setStats(await fetchActivityLogStats(range.from, range.to, category));
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [category, datePreset]);

  useEffect(() => {
    load();
  }, [load]);

  const titles = metricTitles(category);

  return (
    <div
      className={`grid min-w-0 flex-1 grid-cols-2 gap-2 sm:grid-cols-3 ${
        titles.logins ? "xl:grid-cols-5" : "xl:grid-cols-4"
      } ${className}`.trim()}
    >
      <ActivityMetricCard
        title={titles.total}
        value={stats?.total.count ?? 0}
        trend={stats?.total.trend ?? 0}
        variant="total"
        loading={loading}
        compact
      />
      <ActivityMetricCard
        title={titles.created}
        value={stats?.created.count ?? 0}
        trend={stats?.created.trend ?? 0}
        variant="created"
        loading={loading}
        compact
      />
      <ActivityMetricCard
        title={titles.updated}
        value={stats?.updated.count ?? 0}
        trend={stats?.updated.trend ?? 0}
        variant="updated"
        loading={loading}
        compact
      />
      <ActivityMetricCard
        title={titles.deleted}
        value={stats?.deleted.count ?? 0}
        trend={stats?.deleted.trend ?? 0}
        variant="deleted"
        loading={loading}
        compact
      />
      {titles.logins && (
        <ActivityMetricCard
          title={titles.logins}
          value={stats?.logins.count ?? 0}
          trend={stats?.logins.trend ?? 0}
          variant="logins"
          loading={loading}
          compact
        />
      )}
    </div>
  );
}
