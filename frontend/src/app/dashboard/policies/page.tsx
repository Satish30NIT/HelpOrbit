"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  Building2,
  FileText,
  Filter,
  Users,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePageHeader } from "@/contexts/PageHeaderContext";
import { PageShell } from "@/components/layout/PageShell";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Drawer } from "@/components/ui/Drawer";
import { BrandedLoader } from "@/components/ui/BrandedLoader";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { CircularProgress } from "@/components/ui/CircularProgress";
import { PolicyForm, PolicyFormFooter } from "@/components/policies/PolicyForm";
import { PolicyViewDrawer } from "@/components/policies/PolicyViewDrawer";
import { PolicyAckDrawer } from "@/components/policies/PolicyAckDrawer";
import { titleToPolicyName } from "@/lib/slug";
import {
  createPolicy,
  deletePolicy,
  fetchCompanies,
  fetchPolicies,
  updatePolicy,
  type PolicyStatusFilter,
} from "@/lib/policies";
import type { Company, PolicyListItem } from "@/types/policy";
import { ApiError } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";

export default function PoliciesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role_name?.toLowerCase() === "admin";

  const [items, setItems] = useState<PolicyListItem[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    limit: 10,
  });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<PolicyStatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editPolicy, setEditPolicy] = useState<PolicyListItem | null>(null);
  const [viewPolicyId, setViewPolicyId] = useState<string | null>(null);
  const [statusPolicyId, setStatusPolicyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PolicyListItem | null>(null);

  const initialLoading = loading && items.length === 0;
  const listLoading = loading && !initialLoading;
  const filterPending = search.trim() !== debouncedSearch.trim();
  const filterBusy = listLoading || filterPending;

  useEffect(() => {
    const viewId = searchParams.get("view");
    if (viewId) {
      setViewPolicyId(viewId);
      router.replace("/dashboard/policies", { scroll: false });
    }
  }, [searchParams, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPolicies({
        search: debouncedSearch || undefined,
        company_id: companyFilter || undefined,
        status: statusFilter,
        page: Number(page) || 1,
        limit: pagination.limit,
      });
      setItems(data.items);
      setPagination({
        total: data.pagination.total,
        totalPages: data.pagination.totalPages,
        limit: data.pagination.limit,
      });
      if (data.pagination.page !== page) {
        setPage(data.pagination.page);
      }
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to load policies", "error");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, companyFilter, statusFilter, page, pagination.limit, toast]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!isAdmin) {
      router.replace("/dashboard");
      return;
    }
    fetchCompanies().then(setCompanies).catch(() => {});
  }, [isAdmin, router]);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, companyFilter, statusFilter]);

  async function handleCreate(values: Parameters<typeof createPolicy>[0]) {
    setSaving(true);
    try {
      await createPolicy({
        ...values,
        policy_name: titleToPolicyName(values.title),
      });
      toast(`"${values.title}" was created and assigned to company users.`, "success");
      setCreateOpen(false);
      await load();
    } catch (err) {
      toast(
        err instanceof ApiError ? err.message : "Failed to create policy. Please try again.",
        "error"
      );
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(values: Parameters<typeof createPolicy>[0]) {
    if (!editPolicy) return;
    setSaving(true);
    try {
      await updatePolicy(editPolicy.id, {
        policy_name: titleToPolicyName(values.title),
        title: values.title,
        description: values.description,
        is_active: values.is_active,
      });
      toast(`"${values.title}" was updated successfully.`, "success");
      setEditPolicy(null);
      await load();
    } catch (err) {
      toast(
        err instanceof ApiError ? err.message : "Failed to update policy. Please try again.",
        "error"
      );
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const policy = deleteTarget;
    setDeletingId(policy.id);
    try {
      await deletePolicy(policy.id);
      toast(`"${policy.title}" was deleted successfully.`, "success");
      setDeleteTarget(null);
      await load();
    } catch (err) {
      toast(
        err instanceof ApiError
          ? err.message
          : `Failed to delete "${policy.title}". Please try again.`,
        "error"
      );
    } finally {
      setDeletingId(null);
    }
  }

  const pageHeader = useMemo(
    () => ({
      title: "Policy Management",
      description: "Create, assign, and track policy acknowledgements across companies",
      breadcrumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Policies" },
      ],
      actions: (
        <button type="button" onClick={() => setCreateOpen(true)} className="btn-primary">
          <Plus className="h-4 w-4" />
          Add Policy
        </button>
      ),
    }),
    []
  );
  usePageHeader(isAdmin ? pageHeader : null);

  if (!isAdmin) return null;

  return (
    <PageShell>
      <div className="mb-4 grid shrink-0 gap-3 sm:grid-cols-3">
        <div className="stat-pill">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total policies</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {pagination.total}
            </p>
          </div>
        </div>
        <div className="stat-pill">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-[var(--success)]">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Acknowledged (page)</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {items.reduce((s, p) => s + p.acknowledged_users, 0)}
            </p>
          </div>
        </div>
        <div className="stat-pill">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-[var(--warning)]">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Pending (page)</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {items.reduce((s, p) => s + p.pending_users, 0)}
            </p>
          </div>
        </div>
      </div>

      <div className="filter-toolbar relative mb-[var(--space-4)] shrink-0">
        <LoadingOverlay show={filterBusy} bar compact />
        <div className="mb-2 flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <Filter className="h-3.5 w-3.5" />
          Filters
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-12">
          <div className="relative lg:col-span-5">
            <input
              type="search"
              placeholder="Search policies…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-compact w-full pr-10"
            />
            <Search
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
          </div>
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="input-compact lg:col-span-3"
          >
            <option value="">All companies</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PolicyStatusFilter)}
            className="input-compact lg:col-span-4"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending acknowledgements</option>
            <option value="complete">Fully acknowledged</option>
            <option value="unassigned">Unassigned</option>
          </select>
        </div>
      </div>

      <div className="table-module">
        {initialLoading ? (
          <div className="flex flex-1 items-center justify-center py-20">
            <BrandedLoader size="md" message="Loading policies…" showMessage />
          </div>
        ) : (
          <>
            <div className="table-module-scroll">
              <LoadingOverlay show={listLoading} bar />
              <div className="table-scroll-body hidden md:block">
              <table className="min-w-full text-left text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="table-head">
                    <th className="px-4 py-3 pl-5">Title</th>
                    <th className="px-4 py-3.5">Company</th>
                    <th className="px-4 py-3.5 text-center">Users</th>
                    <th className="px-4 py-3.5 text-center">Progress</th>
                    <th className="px-4 py-3.5">Created</th>
                    <th className="px-4 py-3.5 pr-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-20 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                          <FileText className="h-7 w-7 text-slate-400" />
                        </div>
                        <p className="mt-4 font-medium text-slate-700 dark:text-slate-300">
                          No policies found
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Try adjusting filters or create a new policy
                        </p>
                      </td>
                    </tr>
                  ) : (
                    items.map((p, i) => {
                      const pct =
                        p.total_users > 0
                          ? Math.round((p.acknowledged_users / p.total_users) * 100)
                          : 0;
                      return (
                        <motion.tr
                          key={p.id}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.025 }}
                          className="table-row"
                        >
                          <td className="px-4 py-2.5 pl-5">
                            <div className="flex items-center gap-3">
                              <div className="policy-avatar">
                                {(p.title || p.policy_name).charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-[var(--text-primary)]">
                                  {p.title}
                                </p>
                                {!p.is_active && (
                                  <span className="badge-muted mt-0.5">Packaging disabled</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                              <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                              <span className="truncate max-w-[140px]">{p.company_name}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                              <Users className="h-3.5 w-3.5 text-slate-400" />
                              {p.total_users}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <CircularProgress
                              value={pct}
                              acknowledged={p.acknowledged_users}
                              pending={p.pending_users}
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-500">
                            {new Date(p.created_at).toLocaleDateString(undefined, {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-4 py-3 pr-5">
                            <div className="flex justify-end">
                              <div className="action-group">
                                <IconBtn
                                  onClick={() => setViewPolicyId(p.id)}
                                  label="View"
                                  icon={Eye}
                                />
                                <IconBtn
                                  onClick={() => setEditPolicy(p)}
                                  label="Edit"
                                  icon={Pencil}
                                />
                                <IconBtn
                                  onClick={() => setStatusPolicyId(p.id)}
                                  label="Status"
                                  icon={BarChart2}
                                />
                                <IconBtn
                                  onClick={() => setDeleteTarget(p)}
                                  label="Delete"
                                  icon={Trash2}
                                  danger
                                  loading={deletingId === p.id}
                                  disabled={!!deletingId}
                                />
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="table-scroll-body space-y-3 p-4 md:hidden">
              {items.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">No policies found</p>
              ) : (
                items.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
                  >
                    <p className="font-semibold">{p.title}</p>
                    <p className="mt-2 text-sm text-slate-600">{p.company_name}</p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <CircularProgress
                        value={
                          p.total_users > 0
                            ? Math.round((p.acknowledged_users / p.total_users) * 100)
                            : 0
                        }
                        size={44}
                        strokeWidth={4}
                        acknowledged={p.acknowledged_users}
                        pending={p.pending_users}
                      />
                      {!p.is_active && (
                        <span className="badge-muted">Disabled</span>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setViewPolicyId(p.id)}
                        className="btn-secondary py-1.5 text-xs"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditPolicy(p)}
                        className="btn-secondary py-1.5 text-xs"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatusPolicyId(p.id)}
                        className="btn-secondary py-1.5 text-xs"
                      >
                        Status
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            </div>
            <div className="table-module-pagination relative table-footer">
                <LoadingOverlay show={listLoading} bar compact />
                <p className="text-sm text-slate-500">
                  Page {page} of {Math.max(pagination.totalPages, 1)} · {pagination.total}{" "}
                  policies
                </p>
                {pagination.totalPages > 1 && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={page <= 1 || listLoading}
                      onClick={() => setPage((p) => Math.max(1, Number(p) - 1))}
                      className="btn-secondary inline-flex items-center gap-2 py-2"
                    >
                      {listLoading ? (
                        <BrandedLoader size="xs" ring={false} />
                      ) : (
                        <ChevronLeft className="h-4 w-4" />
                      )}
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={page >= pagination.totalPages || listLoading}
                      onClick={() =>
                        setPage((p) =>
                          Math.min(pagination.totalPages, Number(p) + 1)
                        )
                      }
                      className="btn-secondary inline-flex items-center gap-2 py-2"
                    >
                      Next
                      {listLoading ? (
                        <BrandedLoader size="xs" ring={false} />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                )}
            </div>
          </>
        )}
      </div>

      <Drawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        size="panel"
        title="Create Policy"
        description="Auto-assigned to all active company users"
        footer={
          <PolicyFormFooter
            onCancel={() => setCreateOpen(false)}
            submitLabel="Save Policy"
            loading={saving}
          />
        }
      >
        <PolicyForm onSubmit={handleCreate} loading={saving} />
      </Drawer>

      <Drawer
        open={!!editPolicy}
        onClose={() => setEditPolicy(null)}
        size="panel"
        title="Edit Policy"
        description="Acknowledgement history is preserved"
        footer={
          <PolicyFormFooter
            onCancel={() => setEditPolicy(null)}
            submitLabel="Update Policy"
            loading={saving}
          />
        }
      >
        {editPolicy && (
          <PolicyForm
            key={editPolicy.id}
            showCompany={false}
            showPackagingToggle
            initial={{
              company_id: editPolicy.company_id,
              title: editPolicy.title,
              description: editPolicy.description,
              is_active: editPolicy.is_active,
            }}
            onSubmit={handleUpdate}
            loading={saving}
          />
        )}
      </Drawer>

      <PolicyViewDrawer
        policyId={viewPolicyId}
        open={!!viewPolicyId}
        onClose={() => setViewPolicyId(null)}
        onManageStatus={(id) => {
          setViewPolicyId(null);
          setStatusPolicyId(id);
        }}
      />

      <PolicyAckDrawer
        policyId={statusPolicyId}
        open={!!statusPolicyId}
        onClose={() => setStatusPolicyId(null)}
        onUpdated={load}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => !deletingId && setDeleteTarget(null)}
        title="Delete policy?"
        highlight={deleteTarget?.title}
        description="will be removed. Acknowledgement history will no longer be available."
        confirmLabel="Confirm"
        onConfirm={confirmDelete}
        loading={!!deletingId}
      />
    </PageShell>
  );
}

function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "success" | "warning" | "muted";
}) {
  const cls =
    tone === "success"
      ? "badge-success"
      : tone === "warning"
      ? "badge-warning"
      : "badge-muted";
  return <span className={cls}>{children}</span>;
}

function IconBtn({
  onClick,
  label,
  icon: Icon,
  danger,
  loading: busy,
  disabled,
}: {
  onClick: () => void;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  danger?: boolean;
  loading?: boolean;
  disabled?: boolean;
}) {
  const cls = danger ? "btn-icon-danger" : "btn-icon";
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      disabled={disabled || busy}
      aria-busy={busy}
      className={cls}
    >
      {busy ? <BrandedLoader size="xs" ring={false} /> : <Icon className="h-4 w-4" />}
    </button>
  );
}
