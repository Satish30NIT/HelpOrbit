"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Braces,
  Clock,
  Eye,
  Filter,
  RotateCcw,
  Search,
  User,
} from "lucide-react";
import { ActivityLogChangesDrawer } from "@/components/companies/ActivityLogChangesDrawer";
import { ActivityLogJsonDrawer } from "@/components/companies/ActivityLogJsonDrawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { TablePagination } from "@/components/ui/TablePagination";
import { ActivityMetricCard } from "@/components/companies/ActivityMetricCard";
import {
  fetchActivityLogActors,
  fetchActivityLogStats,
  fetchActivityLogs,
  type ActivityLogCategory,
  type ActivityLogFilters,
} from "@/lib/activityLogs";
import { fetchCompanies } from "@/lib/companies";
import { fetchUsers } from "@/lib/users";
import {
  actionBadgeClass,
  actionFilterOptions,
  actionLabel,
  categoryLabel,
  metricTitles,
} from "@/lib/activityLogLabels";
import { getChangesJson } from "@/lib/activityLogChangeSummary";
import { datePresetLabel, dateRangeFromPreset, type DatePreset } from "@/lib/activityDateRange";
import { getLogActor } from "@/lib/activityLogActor";
import { formatActivityDateTime } from "@/lib/formatActivityTime";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import type { ActivityLogStats, CompanyActivityLog } from "@/types/activityLog";
import { ApiError } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";

type Props = {
  companyId?: string;
  companyTitle?: string;
  userId?: number;
  userLabel?: string;
  initialCategory?: ActivityLogCategory;
  showMetrics?: boolean;
  onDatePresetChange?: (preset: DatePreset) => void;
  onItemsChange?: (items: CompanyActivityLog[]) => void;
};

type AppliedFilters = {
  category: ActivityLogCategory;
  action: string;
  companyId: string;
  userId: string;
  actorEmail: string;
  search: string;
  datePreset: DatePreset;
};

function defaultApplied(
  companyId?: string,
  userId?: number,
  initialCategory?: ActivityLogCategory
): AppliedFilters {
  const category = companyId
    ? "company"
    : userId
      ? "user"
      : initialCategory || "all";
  return {
    category,
    action: "",
    companyId: companyId || "",
    userId: userId ? String(userId) : "",
    actorEmail: "",
    search: "",
    datePreset: "7d",
  };
}

export function ActivityLogList({
  companyId,
  companyTitle,
  userId,
  userLabel,
  initialCategory = "all",
  showMetrics = true,
  onDatePresetChange,
  onItemsChange,
}: Props) {
  const { toast } = useToast();
  const scoped = !!(companyId || userId);
  const [items, setItems] = useState<CompanyActivityLog[]>([]);
  const [source, setSource] = useState("postgres");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ActivityLogStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [companies, setCompanies] = useState<{ id: string; title: string }[]>([]);
  const [users, setUsers] = useState<{ id: number; label: string }[]>([]);
  const [actors, setActors] = useState<{ email: string; display_name: string }[]>([]);

  const [draft, setDraft] = useState<AppliedFilters>(() =>
    defaultApplied(companyId, userId, initialCategory)
  );
  const [applied, setApplied] = useState<AppliedFilters>(() =>
    defaultApplied(companyId, userId, initialCategory)
  );
  const [viewLog, setViewLog] = useState<CompanyActivityLog | null>(null);
  const [viewChanges, setViewChanges] = useState<{
    log: CompanyActivityLog;
    json: string;
  } | null>(null);
  const [timeTick, setTimeTick] = useState(0);

  const statsCategory = companyId ? "company" : userId ? "user" : applied.category;
  const titles = metricTitles(statsCategory);

  const buildParams = useCallback((): ActivityLogFilters => {
    const range = dateRangeFromPreset(applied.datePreset);
    const category = companyId ? "company" : userId ? "user" : applied.category;
    return {
      category: category === "all" ? undefined : category,
      company_id: companyId || applied.companyId || undefined,
      user_id: userId || (applied.userId ? Number(applied.userId) : undefined),
      action: applied.action || undefined,
      actor_email: applied.actorEmail || undefined,
      search: applied.search.trim() || undefined,
      from: range.from,
      to: range.to,
      page,
      limit,
    };
  }, [applied, companyId, userId, page, limit]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchActivityLogs(buildParams());
      setItems(data.items);
      onItemsChange?.(data.items);
      setSource(data.source);
      setPagination({
        total: data.pagination.total,
        totalPages: data.pagination.totalPages,
      });
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to load activity logs", "error");
    } finally {
      setLoading(false);
    }
  }, [buildParams, onItemsChange, toast]);

  const loadStats = useCallback(async () => {
    if (!showMetrics || scoped) return;
    setStatsLoading(true);
    try {
      const range = dateRangeFromPreset(applied.datePreset);
      setStats(
        await fetchActivityLogStats(range.from, range.to, applied.category)
      );
    } catch {
      /* optional */
    } finally {
      setStatsLoading(false);
    }
  }, [applied.category, applied.datePreset, scoped, showMetrics]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    const id = window.setInterval(() => setTimeTick((t) => t + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (scoped) return;
    fetchCompanies({ page: 1, limit: 100, status: "all" })
      .then((d) => setCompanies(d.items.map((c) => ({ id: c.id, title: c.title }))))
      .catch(() => {});
    fetchUsers({ page: 1, limit: 100 })
      .then((d) =>
        setUsers(
          d.items.map((u) => ({
            id: u.id,
            label: [u.first_name, u.last_name].filter(Boolean).join(" ") || u.email,
          }))
        )
      )
      .catch(() => {});
    fetchActivityLogActors()
      .then(setActors)
      .catch(() => {});
  }, [scoped]);

  const actionOptions = useMemo(
    () => actionFilterOptions(applied.category),
    [applied.category]
  );

  const commitFilters = useCallback(
    (next: AppliedFilters) => {
      setDraft(next);
      setApplied(next);
      setPage(1);
      onDatePresetChange?.(next.datePreset);
    },
    [onDatePresetChange]
  );

  function applyFilters() {
    commitFilters({ ...draft });
  }

  function clearFilters() {
    commitFilters(defaultApplied(companyId, userId, initialCategory));
  }

  const searchPending = useMemo(
    () => draft.search.trim() !== applied.search.trim(),
    [draft.search, applied.search]
  );

  function handleLimitChange(next: number) {
    setLimit(next);
    setPage(1);
  }

  const initialLoading = loading && items.length === 0;
  const listLoading = loading && !initialLoading;
  const scopeLabel = companyTitle || userLabel;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      {showMetrics && !scoped && (
        <div
          className={`grid shrink-0 gap-3 sm:grid-cols-2 ${
            titles.logins ? "xl:grid-cols-5" : "xl:grid-cols-4"
          }`}
        >
          <ActivityMetricCard
            title={titles.total}
            value={stats?.total.count ?? 0}
            trend={stats?.total.trend ?? 0}
            variant="total"
            loading={statsLoading}
          />
          <ActivityMetricCard
            title={titles.created}
            value={stats?.created.count ?? 0}
            trend={stats?.created.trend ?? 0}
            variant="created"
            loading={statsLoading}
          />
          <ActivityMetricCard
            title={titles.updated}
            value={stats?.updated.count ?? 0}
            trend={stats?.updated.trend ?? 0}
            variant="updated"
            loading={statsLoading}
          />
          <ActivityMetricCard
            title={titles.deleted}
            value={stats?.deleted.count ?? 0}
            trend={stats?.deleted.trend ?? 0}
            variant="deleted"
            loading={statsLoading}
          />
          {titles.logins && (
            <ActivityMetricCard
              title={titles.logins}
              value={stats?.logins.count ?? 0}
              trend={stats?.logins.trend ?? 0}
              variant="logins"
              loading={statsLoading}
            />
          )}
        </div>
      )}

      <div className="filter-toolbar relative shrink-0">
        <LoadingOverlay show={listLoading} bar compact />
        <div className="activity-filters-row min-w-0 flex-1">
          <div className="flex shrink-0 items-center gap-1.5 pr-1 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            <Filter className="h-3.5 w-3.5" aria-hidden />
            Filters
          </div>
          <select
            value={draft.datePreset}
            onChange={(e) =>
              commitFilters({ ...draft, datePreset: e.target.value as DatePreset })
            }
            className="input-compact activity-filter-field"
            aria-label="Date range"
          >
            <option value="today">{datePresetLabel("today")}</option>
            <option value="7d">{datePresetLabel("7d")}</option>
            <option value="30d">{datePresetLabel("30d")}</option>
            <option value="all">{datePresetLabel("all")}</option>
          </select>
          {!companyId && !userId && (
            <select
              value={draft.category}
              onChange={(e) =>
                commitFilters({
                  ...draft,
                  category: e.target.value as ActivityLogCategory,
                  action: "",
                })
              }
              className="input-compact activity-filter-field"
              aria-label="Category"
            >
              <option value="all">All categories</option>
              <option value="company">Company</option>
              <option value="user">User</option>
            </select>
          )}
          <select
            value={draft.action}
            onChange={(e) => commitFilters({ ...draft, action: e.target.value })}
            className="input-compact activity-filter-field"
            aria-label="Filter by action"
          >
            <option value="">All actions</option>
            {actionOptions.map((action) => (
              <option key={action} value={action}>
                {actionLabel(action)}
              </option>
            ))}
          </select>
          {!companyId && !userId && (
            <>
              <select
                value={draft.companyId}
                onChange={(e) => commitFilters({ ...draft, companyId: e.target.value })}
                className="input-compact activity-filter-field max-w-[12rem]"
                aria-label="Filter by company"
              >
                <option value="">All companies</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
              <select
                value={draft.userId}
                onChange={(e) => commitFilters({ ...draft, userId: e.target.value })}
                className="input-compact activity-filter-field max-w-[12rem]"
                aria-label="Filter by target user"
              >
                <option value="">All users</option>
                {users.map((u) => (
                  <option key={u.id} value={String(u.id)}>
                    {u.label}
                  </option>
                ))}
              </select>
            </>
          )}
          <select
            value={draft.actorEmail}
            onChange={(e) => commitFilters({ ...draft, actorEmail: e.target.value })}
            className="input-compact activity-filter-field"
            aria-label="Filter by actor"
          >
            <option value="">All actors</option>
            {actors.map((actor) => (
              <option key={actor.email} value={actor.email} title={actor.email}>
                {actor.display_name}
              </option>
            ))}
          </select>
          <div className="relative shrink-0">
            <input
              type="search"
              placeholder="Search by keyword…"
              value={draft.search}
              onChange={(e) => setDraft((d) => ({ ...d, search: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              className="input-compact activity-filter-search pr-9"
              aria-label="Search by keyword"
            />
            <Search
              className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
              aria-hidden
            />
          </div>
          <button
            type="button"
            onClick={applyFilters}
            className={`btn-primary shrink-0 whitespace-nowrap px-4 py-2 text-sm ${
              searchPending ? "ring-2 ring-[var(--primary)] ring-offset-1" : ""
            }`}
            title="Apply keyword search"
          >
            Search
          </button>
          <button type="button" onClick={clearFilters} className="btn-ghost shrink-0">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset filters
          </button>
          <span className="ml-auto shrink-0 whitespace-nowrap pl-2 text-[10px] text-[var(--text-muted)]">
            Source: <span className="font-semibold capitalize">{source}</span>
            {scopeLabel ? ` · ${scopeLabel}` : ""}
          </span>
        </div>
      </div>

      <div className="table-module activity-table-shell relative">
        {initialLoading ? (
          <div className="flex flex-1 items-center justify-center p-8">
            <TableSkeleton rows={8} cols={7} />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-8">
            <EmptyState
              icon={Clock}
              title="No activity found"
              description="Try adjusting filters or date range"
            />
          </div>
        ) : (
          <>
            <div className="table-module-scroll">
              <LoadingOverlay show={listLoading && items.length > 0} bar compact />
              <div className="table-scroll-body" key={timeTick}>
                <table className="activity-table">
                  <thead className="table-head">
                    <tr>
                      <th className="col-category">Category</th>
                      <th className="col-action">Action</th>
                      <th className="col-message">Message</th>
                      <th className="col-modified-by">Modified by</th>
                      <th className="col-occurred-at">Occurred at</th>
                      <th className="col-changes">Changes</th>
                      <th className="col-payload">View payload</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((log) => (
                      <ActivityLogRow
                        key={log.id}
                        log={log}
                        onView={() => setViewLog(log)}
                        onViewChanges={(json) => setViewChanges({ log, json })}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="table-module-pagination relative">
              <LoadingOverlay show={listLoading} bar compact />
              <TablePagination
                page={page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                limit={limit}
                onPageChange={setPage}
                onLimitChange={handleLimitChange}
                loading={listLoading}
                itemLabel="events"
              />
            </div>
          </>
        )}
      </div>

      <ActivityLogJsonDrawer
        logId={viewLog?.id ?? null}
        logPreview={viewLog}
        open={!!viewLog}
        onClose={() => setViewLog(null)}
      />

      <ActivityLogChangesDrawer
        open={!!viewChanges}
        json={viewChanges?.json ?? ""}
        logPreview={viewChanges?.log}
        onClose={() => setViewChanges(null)}
      />
    </div>
  );
}

function ActivityLogRow({
  log,
  onView,
  onViewChanges,
}: {
  log: CompanyActivityLog;
  onView: () => void;
  onViewChanges: (json: string) => void;
}) {
  const changesJson = getChangesJson(log.metadata);
  const actor = getLogActor(log);

  return (
    <tr className="table-row activity-log-row">
      <td className="col-category">
        <code className="activity-field-value">{categoryLabel(log.category)}</code>
      </td>
      <td className="col-action">
        <span className={actionBadgeClass(log.action)}>{actionLabel(log.action)}</span>
        <code className="activity-field-value mt-1 block max-w-full truncate">{log.action}</code>
      </td>
      <td className="col-message">
        <p className="text-sm font-medium leading-snug text-[var(--text-primary)]">{log.message}</p>
        {log.target?.label && (
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">{log.target.label}</p>
        )}
      </td>
      <td className="col-modified-by">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
          <User className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
          {actor.display_name}
        </p>
        {actor.email && <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{actor.email}</p>}
        {actor.role && (
          <span className="mt-0.5 inline-block rounded bg-[var(--primary-soft)] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[var(--primary)]">
            {actor.role}
          </span>
        )}
      </td>
      <td className="col-occurred-at">
        <time className="block text-sm font-medium text-[var(--text-primary)]" dateTime={log.occurred_at}>
          {formatActivityDateTime(log.occurred_at)}
        </time>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">{formatRelativeTime(log.occurred_at)}</p>
      </td>
      <td className="col-changes">
        {changesJson ? (
          <button
            type="button"
            onClick={() => onViewChanges(changesJson)}
            title="View changes JSON"
            aria-label="View changes JSON"
            className="btn-icon mx-auto"
          >
            <Braces className="h-4 w-4" />
          </button>
        ) : (
          <span className="mx-auto block text-center text-xs text-[var(--text-muted)]">—</span>
        )}
      </td>
      <td className="col-payload">
        <button
          type="button"
          onClick={onView}
          title="View payload"
          aria-label="View payload"
          className="btn-icon mx-auto"
        >
          <Eye className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}
