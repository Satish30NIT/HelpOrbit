"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { BrandedLoader } from "@/components/ui/BrandedLoader";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { Switch } from "@/components/ui/Switch";
import {
  assignUser,
  fetchPolicyStatus,
  restrictUser,
} from "@/lib/policies";
import type { PolicyStatusData, PolicyUserStatus } from "@/types/policy";
import { ApiError } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";

const USERS_PER_PAGE = 10;

type Props = {
  policyId: string | null;
  open: boolean;
  onClose: () => void;
  onUpdated?: () => void;
};

type UserFilter = "all" | "acknowledged" | "pending" | "restricted";

function patchUser(
  user: PolicyUserStatus,
  assigned: boolean
): PolicyUserStatus {
  if (!assigned) {
    return {
      ...user,
      is_assigned: false,
      is_acknowledged: false,
      status: "restricted",
      acknowledged_at: null,
    };
  }
  if (user.is_acknowledged) {
    return { ...user, is_assigned: true, status: "acknowledged" };
  }
  return {
    ...user,
    is_assigned: true,
    status: "pending",
    is_acknowledged: false,
  };
}

function patchStats(
  data: PolicyStatusData,
  prev: PolicyUserStatus,
  next: PolicyUserStatus
): PolicyStatusData {
  let { total_assigned, acknowledged, pending, restricted } = data;
  const wasAssigned = prev.is_assigned;
  const isAssigned = next.is_assigned;

  if (!wasAssigned && isAssigned) {
    total_assigned += 1;
    restricted -= 1;
    if (next.status === "acknowledged") acknowledged += 1;
    else pending += 1;
  } else if (wasAssigned && !isAssigned) {
    total_assigned -= 1;
    restricted += 1;
    if (prev.status === "acknowledged") acknowledged -= 1;
    else if (prev.status === "pending") pending -= 1;
  }
  return {
    ...data,
    total_assigned: Math.max(0, total_assigned),
    acknowledged: Math.max(0, acknowledged),
    pending: Math.max(0, pending),
    restricted: Math.max(0, restricted),
  };
}

export function PolicyAckDrawer({ policyId, open, onClose, onUpdated }: Props) {
  const { toast } = useToast();
  const [data, setData] = useState<PolicyStatusData | null>(null);
  const [users, setUsers] = useState<PolicyUserStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserFilter>("all");
  const [page, setPage] = useState(1);
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());
  const [togglingAll, setTogglingAll] = useState(false);

  const load = useCallback(async () => {
    if (!policyId) return;
    setLoading(true);
    try {
      const fresh = await fetchPolicyStatus(policyId);
      setData(fresh);
      setUsers(fresh.users);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to load acknowledgements", "error");
      onClose();
    } finally {
      setLoading(false);
    }
  }, [policyId, toast, onClose]);

  useEffect(() => {
    if (open && policyId) load();
    if (!open) {
      setData(null);
      setUsers([]);
      setUserSearch("");
      setStatusFilter("all");
      setPage(1);
      setTogglingIds(new Set());
      setTogglingAll(false);
    }
  }, [open, policyId, load]);

  useEffect(() => {
    setPage(1);
  }, [userSearch, statusFilter]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (statusFilter !== "all" && u.status !== statusFilter) return false;
      if (!userSearch.trim()) return true;
      const q = userSearch.toLowerCase();
      return (
        u.user_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    });
  }, [users, userSearch, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(start, start + USERS_PER_PAGE);
  }, [filteredUsers, page]);

  const filteredIds = useMemo(
    () => new Set(filteredUsers.map((u) => u.user_id)),
    [filteredUsers]
  );

  const toggleAllChecked =
    filteredUsers.length > 0 && filteredUsers.every((u) => u.is_assigned);
  const toggleAllIndeterminate =
    filteredUsers.some((u) => u.is_assigned) && !toggleAllChecked;

  async function refreshStatus() {
    if (!policyId) return;
    setLoading(true);
    try {
      const fresh = await fetchPolicyStatus(policyId);
      setData(fresh);
      setUsers(fresh.users);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to refresh status", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(user: PolicyUserStatus, enabled: boolean) {
    if (!policyId) return;
    const userId = user.user_id;
    const prevUser = user;
    const nextUser = patchUser(user, enabled);

    setTogglingIds((s) => new Set(s).add(userId));
    setUsers((list) => list.map((u) => (u.user_id === userId ? nextUser : u)));
    if (data) {
      setData((d) => (d ? patchStats(d, prevUser, nextUser) : d));
    }

    try {
      if (enabled) {
        await assignUser(policyId, userId);
        toast("Policy assigned to user", "success");
      } else {
        await restrictUser(policyId, userId);
        toast("Policy access restricted", "success");
      }
      onUpdated?.();
      await refreshStatus();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to update policy access", "error");
      try {
        await refreshStatus();
      } catch {
        setUsers((list) =>
          list.map((u) => (u.user_id === userId ? prevUser : u))
        );
        if (data) setData(patchStats(data, nextUser, prevUser));
      }
    } finally {
      setTogglingIds((s) => {
        const next = new Set(s);
        next.delete(userId);
        return next;
      });
    }
  }

  async function handleToggleAll(enabled: boolean) {
    if (!policyId || filteredUsers.length === 0) return;

    const targets = filteredUsers.filter((u) => u.is_assigned !== enabled);
    if (targets.length === 0) return;

    setTogglingAll(true);
    const prevUsers = users;
    const prevData = data;

    setUsers((list) =>
      list.map((u) =>
        filteredIds.has(u.user_id) && u.is_assigned !== enabled
          ? patchUser(u, enabled)
          : u
      )
    );

    try {
      const results = await Promise.allSettled(
        targets.map((u) =>
          enabled
            ? assignUser(policyId, u.user_id)
            : restrictUser(policyId, u.user_id)
        )
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      const succeeded = targets.length - failed;

      await refreshStatus();
      onUpdated?.();

      if (failed > 0) {
        toast(
          `${succeeded} updated, ${failed} failed. Refresh to see latest state.`,
          failed === targets.length ? "error" : "success"
        );
      } else {
        toast(
          enabled
            ? `Policy enabled for ${succeeded} user${succeeded === 1 ? "" : "s"}`
            : `Policy restricted for ${succeeded} user${succeeded === 1 ? "" : "s"}`,
          "success"
        );
      }
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Bulk update failed", "error");
      setUsers(prevUsers);
      if (prevData) setData(prevData);
      try {
        await refreshStatus();
      } catch {
        /* keep rollback */
      }
    } finally {
      setTogglingAll(false);
    }
  }

  const filterOptions: { value: UserFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "acknowledged", label: "Acknowledged" },
    { value: "pending", label: "Pending" },
    { value: "restricted", label: "Restricted" },
  ];

  const bulkBusy = togglingAll || togglingIds.size > 0;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      size="ack"
      header={
        <div className="min-w-0 flex-1 pr-2">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Acknowledged Policy
          </h2>
          {data && (
            <div className="mt-3 space-y-1 border-t border-[var(--border)] pt-3">
              <p className="text-sm text-[var(--text-secondary)]">
                <span className="font-semibold text-[var(--text-primary)]">Policy:</span>{" "}
                {data.title}
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
                <span className="font-semibold text-[var(--text-primary)]">Company:</span>{" "}
                {data.company_name}
              </p>
            </div>
          )}
        </div>
      }
    >
      {loading && !data ? (
        <div className="flex justify-center py-16">
          <BrandedLoader size="md" message="Loading acknowledgements…" showMessage />
        </div>
      ) : data ? (
        <div className="relative flex min-h-0 flex-1 flex-col gap-5">
          <LoadingOverlay show={loading} bar />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat label="Assigned" value={data.total_assigned} />
            <MiniStat label="Acknowledged" value={data.acknowledged} tone="success" />
            <MiniStat label="Pending" value={data.pending} tone="warning" />
            <MiniStat label="Restricted" value={data.restricted ?? 0} tone="danger" />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <span
                className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-11 items-center justify-center text-[var(--text-muted)]"
                aria-hidden
              >
                <Search className="h-4 w-4 shrink-0" />
              </span>
              <input
                type="search"
                placeholder="Search by name or email…"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="input-compact w-full pl-11"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatusFilter(opt.value)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                    statusFilter === opt.value
                      ? "bg-[var(--primary)] text-white shadow-[0_2px_12px_-2px_rgba(109,76,255,0.45)]"
                      : "border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[#6d4cff]/30 hover:bg-[var(--primary-soft)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="table-shell flex min-h-0 flex-1 flex-col">
            <div
              className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3"
              title={
                toggleAllChecked
                  ? "Disable policy for all filtered users"
                  : "Enable policy for all filtered users"
              }
            >
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  Policy access for all
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {filteredUsers.length === 0
                    ? "No users in current filter"
                    : `Applies to ${filteredUsers.length} filtered user${filteredUsers.length === 1 ? "" : "s"}`}
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-medium text-[var(--text-muted)]">
                  {toggleAllChecked ? "All enabled" : toggleAllIndeterminate ? "Mixed" : "All disabled"}
                </span>
                <Switch
                  checked={toggleAllChecked}
                  indeterminate={toggleAllIndeterminate}
                  loading={togglingAll}
                  disabled={filteredUsers.length === 0 || bulkBusy}
                  onChange={handleToggleAll}
                  aria-label="Toggle all filtered users"
                />
              </div>
            </div>

            <div className="max-h-[min(50vh,480px)] overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 z-10 bg-[var(--primary-soft)]/95 backdrop-blur-sm">
                  <tr className="table-head">
                    <th className="px-4 py-3.5 pl-5">Name</th>
                    <th className="px-4 py-3.5">Email</th>
                    <th className="px-4 py-3.5">Ack Date</th>
                    <th className="px-4 py-3.5 pr-5 text-center">Policy Access</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-14 text-center text-[var(--text-muted)]"
                      >
                        No users match your search or filters
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((u) => (
                      <tr key={u.user_id} className="table-row">
                        <td className="px-4 py-3.5 pl-5 font-medium text-[var(--text-primary)]">
                          {u.user_name}
                        </td>
                        <td className="px-4 py-3.5 text-[var(--text-secondary)]">{u.email}</td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-xs text-[var(--text-muted)]">
                          {u.acknowledged_at
                            ? new Date(u.acknowledged_at).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "—"}
                        </td>
                        <td className="px-4 py-3.5 pr-5">
                          <div
                            className="flex items-center justify-center gap-2"
                            title={
                              u.is_assigned
                                ? "Enabled — policy assigned"
                                : "Disabled — policy restricted"
                            }
                          >
                            <Switch
                              checked={u.is_assigned}
                              loading={togglingIds.has(u.user_id)}
                              disabled={bulkBusy && !togglingIds.has(u.user_id)}
                              onChange={(enabled) => handleToggle(u, enabled)}
                              aria-label={
                                u.is_assigned
                                  ? "Disable policy access"
                                  : "Enable policy access"
                              }
                            />
                            <span className="hidden text-xs font-medium text-[var(--text-muted)] sm:inline">
                              {u.is_assigned ? "Enabled" : "Disabled"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {filteredUsers.length > 0 && (
              <div className="flex shrink-0 flex-col gap-3 border-t border-[var(--border)] bg-gradient-to-r from-slate-50 to-[var(--primary-soft)]/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[var(--text-secondary)]">
                  Page {page} of {totalPages} · {filteredUsers.length} user
                  {filteredUsers.length === 1 ? "" : "s"}
                  {filteredUsers.length !== users.length && (
                    <span className="text-[var(--text-muted)]">
                      {" "}
                      (filtered from {users.length})
                    </span>
                  )}
                </p>
                {totalPages > 1 && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={page <= 1 || bulkBusy}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="btn-secondary py-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={page >= totalPages || bulkBusy}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="btn-secondary py-2"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </Drawer>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "success" | "warning" | "danger";
}) {
  const bg =
    tone === "success"
      ? "bg-emerald-50 border-emerald-100"
      : tone === "warning"
        ? "bg-amber-50 border-amber-100"
        : tone === "danger"
          ? "bg-red-50 border-red-100"
          : "bg-[var(--primary-soft)] border-[var(--border)]";
  return (
    <div className={`rounded-xl border p-3 text-center ${bg}`}>
      <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}
