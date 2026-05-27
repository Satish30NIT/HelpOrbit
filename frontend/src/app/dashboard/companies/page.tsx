"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Eye,
  History,
  Pencil,
  Trash2,
  Building2,
  Mail,
  Phone,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePageHeader } from "@/contexts/PageHeaderContext";
import {
  DataPageLayout,
  DataTableModule,
  PageFilterBar,
  PageMetricsRow,
  PageToolbar,
} from "@/components/layout/DataPageLayout";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Drawer } from "@/components/ui/Drawer";
import { BrandedLoader } from "@/components/ui/BrandedLoader";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import {
  CompanyForm,
  CompanyFormFooter,
} from "@/components/companies/CompanyForm";
import { CompanyViewDrawer } from "@/components/companies/CompanyViewDrawer";
import { CompanyActivityDrawer } from "@/components/companies/CompanyActivityDrawer";
import { CompanyMetricCard } from "@/components/companies/CompanyMetricCard";
import { TablePagination } from "@/components/ui/TablePagination";
import {
  createCompany,
  deleteCompany,
  fetchCompanies,
  updateCompany,
  type CompanyStatusFilter,
} from "@/lib/companies";
import { formatCompanyAddress } from "@/lib/companyAddress";
import type { CompanyListItem } from "@/types/company";
import { ApiError } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";

export default function CompaniesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role_name?.toLowerCase() === "admin";

  const [items, setItems] = useState<CompanyListItem[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    limit: 10,
  });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [debouncedEmail, setDebouncedEmail] = useState("");
  const [statusFilter, setStatusFilter] = useState<CompanyStatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editCompany, setEditCompany] = useState<CompanyListItem | null>(null);
  const [viewCompanyId, setViewCompanyId] = useState<string | null>(null);
  const [activityCompany, setActivityCompany] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CompanyListItem | null>(null);
  const [companyStats, setCompanyStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const initialLoading = loading && items.length === 0;
  const listLoading = loading && !initialLoading;
  const filterPending =
    search.trim() !== debouncedSearch.trim() ||
    emailFilter.trim() !== debouncedEmail.trim();
  const filterBusy = listLoading || filterPending;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCompanies({
        search: debouncedSearch || undefined,
        email: debouncedEmail || undefined,
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
      toast(err instanceof ApiError ? err.message : "Failed to load companies", "error");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, debouncedEmail, statusFilter, page, pagination.limit, toast]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const [all, active, inactive] = await Promise.all([
        fetchCompanies({ page: 1, limit: 1 }),
        fetchCompanies({ status: "active", page: 1, limit: 1 }),
        fetchCompanies({ status: "inactive", page: 1, limit: 1 }),
      ]);
      setCompanyStats({
        total: all.pagination.total,
        active: active.pagination.total,
        inactive: inactive.pagination.total,
      });
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedEmail(emailFilter), 300);
    return () => clearTimeout(t);
  }, [emailFilter]);

  useEffect(() => {
    if (!isAdmin) {
      router.replace("/dashboard");
      return;
    }
  }, [isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      load();
      loadStats();
    }
  }, [isAdmin, load, loadStats]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, debouncedEmail, statusFilter]);

  async function handleCreate(values: Parameters<typeof createCompany>[0]) {
    setSaving(true);
    try {
      await createCompany(values);
      toast(`"${values.title}" was created successfully.`, "success");
      setCreateOpen(false);
      await Promise.all([load(), loadStats()]);
    } catch (err) {
      toast(
        err instanceof ApiError ? err.message : "Failed to create company. Please try again.",
        "error"
      );
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(values: Parameters<typeof createCompany>[0]) {
    if (!editCompany) return;
    setSaving(true);
    try {
      await updateCompany(editCompany.id, values);
      toast(`"${values.title}" was updated successfully.`, "success");
      setEditCompany(null);
      await Promise.all([load(), loadStats()]);
    } catch (err) {
      toast(
        err instanceof ApiError ? err.message : "Failed to update company. Please try again.",
        "error"
      );
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const c = deleteTarget;
    setDeletingId(c.id);
    try {
      await deleteCompany(c.id);
      toast(`"${c.title}" was deleted successfully.`, "success");
      setDeleteTarget(null);
      await Promise.all([load(), loadStats()]);
    } catch (err) {
      toast(
        err instanceof ApiError
          ? err.message
          : `Failed to delete "${c.title}". Please try again.`,
        "error"
      );
    } finally {
      setDeletingId(null);
    }
  }

  const pageHeader = useMemo(
    () => ({
      title: "Company Management",
      description: "Create and manage companies, users, and policies",
      breadcrumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Companies" },
      ],
    }),
    []
  );
  usePageHeader(isAdmin ? pageHeader : null);

  if (!isAdmin) return null;

  const activePct =
    companyStats.total > 0
      ? Math.round((companyStats.active / companyStats.total) * 100)
      : 0;
  const inactivePct =
    companyStats.total > 0
      ? Math.round((companyStats.inactive / companyStats.total) * 100)
      : 0;

  function handleLimitChange(limit: number) {
    setPagination((p) => ({ ...p, limit }));
    setPage(1);
  }

  return (
    <>
    <DataPageLayout
      metrics={
        <PageMetricsRow>
          <CompanyMetricCard
            title="Total Companies"
            value={companyStats.total}
            variant="total"
            loading={statsLoading}
          />
          <CompanyMetricCard
            title="Active Companies"
            value={companyStats.active}
            variant="active"
            trendLabel={`${activePct}% of total`}
            loading={statsLoading}
          />
          <CompanyMetricCard
            title="Inactive Companies"
            value={companyStats.inactive}
            variant="inactive"
            trendLabel={`${inactivePct}% of total`}
            loading={statsLoading}
          />
        </PageMetricsRow>
      }
      toolbar={
        <PageToolbar>
          <button type="button" onClick={() => setCreateOpen(true)} className="btn-primary">
            <Plus className="h-4 w-4" />
            Add Company
          </button>
        </PageToolbar>
      }
      filters={
        <PageFilterBar
          singleRow
          busy={filterBusy}
          busyOverlay={<LoadingOverlay show={filterBusy} bar compact />}
        >
          <div className="relative min-w-0">
            <input
              id="company-search"
              type="search"
              placeholder="Search companies…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-compact w-full pr-10"
            />
            <Search
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
              aria-hidden
            />
          </div>
          <div className="relative min-w-0">
            <input
              id="company-email-filter"
              type="search"
              placeholder="Filter by email…"
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              className="input-compact w-full pr-10"
            />
            <Mail
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
              aria-hidden
            />
          </div>
          <select
            id="company-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CompanyStatusFilter)}
            className="input-compact w-full min-w-[9.5rem] sm:w-auto"
          >
            <option value="all">All statuses</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>
        </PageFilterBar>
      }
      table={
        <DataTableModule
          loadingOverlay={!initialLoading ? <LoadingOverlay show={listLoading} bar compact /> : undefined}
          pagination={
            !initialLoading ? (
              <TablePagination
                page={page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                limit={pagination.limit}
                onPageChange={setPage}
                onLimitChange={handleLimitChange}
                loading={listLoading}
                itemLabel="companies"
              />
            ) : undefined
          }
        >
          {initialLoading ? (
            <div className="flex flex-1 items-center justify-center py-20">
              <BrandedLoader size="md" message="Loading companies…" showMessage />
            </div>
          ) : (
            <>
              <LoadingOverlay show={listLoading} bar />
              <div className="table-scroll-body hidden md:block">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="table-head">
                    <th className="col-title">Title</th>
                    <th className="col-contact">Contact</th>
                    <th className="col-status">Status</th>
                    <th className="col-date">Created</th>
                    <th className="col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <div className="table-empty">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
                            <Building2 className="h-7 w-7" />
                          </div>
                          <p className="mt-4 font-semibold text-[var(--text-primary)]">
                            No companies found
                          </p>
                          <p className="mt-1 max-w-sm text-sm text-[var(--text-secondary)]">
                            Add a company or adjust your search and filters
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    items.map((c, i) => (
                      <motion.tr
                        key={c.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="table-row"
                      >
                        <td className="col-title">
                          <div className="flex items-center gap-3">
                            <div className="policy-avatar">
                              {c.title.charAt(0).toUpperCase()}
                            </div>
                            <p className="font-semibold leading-snug text-[var(--text-primary)]">
                              {c.title}
                            </p>
                          </div>
                        </td>
                        <td className="col-contact">
                          <div className="space-y-1">
                            <p className="flex items-center gap-2 text-[var(--text-secondary)]">
                              <Mail className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
                              <span className="truncate">{c.email}</span>
                            </p>
                            {c.phone && (
                              <p className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                                <Phone className="h-3 w-3 shrink-0" />
                                <span>{c.phone}</span>
                              </p>
                            )}
                            {formatCompanyAddress(c) && (
                              <p className="truncate text-xs text-[var(--text-muted)]">
                                {formatCompanyAddress(c)}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="col-status">
                          <div className="flex justify-center">
                            <span className={c.is_active ? "badge-success" : "badge-muted"}>
                              {c.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </td>
                        <td className="col-date text-sm">
                          {new Date(c.created_at).toLocaleDateString(undefined, {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="col-actions">
                          <div className="flex justify-end">
                            <div className="action-group">
                              <IconBtn
                                onClick={() => setViewCompanyId(c.id)}
                                label="View"
                                icon={Eye}
                              />
                              <IconBtn
                                onClick={() =>
                                  setActivityCompany({ id: c.id, title: c.title })
                                }
                                label="Activity"
                                icon={History}
                              />
                              <IconBtn
                                onClick={() => setEditCompany(c)}
                                label="Edit"
                                icon={Pencil}
                              />
                              <IconBtn
                                onClick={() => setDeleteTarget(c)}
                                label="Delete"
                                icon={Trash2}
                                danger
                                loading={deletingId === c.id}
                                disabled={!!deletingId}
                              />
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-scroll-body space-y-3 p-4 md:hidden">
              {items.length === 0 ? (
                <div className="table-empty">
                  <Building2 className="h-10 w-10 text-[var(--text-muted)]" />
                  <p className="mt-3 font-semibold text-[var(--text-primary)]">No companies found</p>
                </div>
              ) : (
                items.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="policy-avatar">{c.title.charAt(0).toUpperCase()}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-[var(--text-primary)]">{c.title}</p>
                          <span className={c.is_active ? "badge-success" : "badge-muted"}>
                            {c.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-sm text-[var(--text-secondary)]">
                          {c.email}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setViewCompanyId(c.id)}
                        className="btn-secondary flex-1 py-2 text-xs"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditCompany(c)}
                        className="btn-secondary flex-1 py-2 text-xs"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            </>
          )}
        </DataTableModule>
      }
    />

      <Drawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        size="panel"
        title="Create Company"
        description="Add a new company to the platform"
        footer={
          <CompanyFormFooter
            onCancel={() => setCreateOpen(false)}
            submitLabel="Save Company"
            loading={saving}
          />
        }
      >
        <CompanyForm onSubmit={handleCreate} loading={saving} />
      </Drawer>

      <Drawer
        open={!!editCompany}
        onClose={() => setEditCompany(null)}
        size="panel"
        title="Edit Company"
        description="Update company details and status"
        footer={
          <CompanyFormFooter
            onCancel={() => setEditCompany(null)}
            submitLabel="Update Company"
            loading={saving}
          />
        }
      >
        {editCompany && (
          <CompanyForm
            key={editCompany.id}
            showStatusToggle
            initial={{
              title: editCompany.title,
              email: editCompany.email,
              phone: editCompany.phone || "",
              address_line_1: editCompany.address_line_1 || "",
              city: editCompany.city || "",
              state: editCompany.state || "",
              country: editCompany.country || "",
              pin_code: editCompany.pin_code || "",
              description: editCompany.description || "",
              is_active: editCompany.is_active,
            }}
            onSubmit={handleUpdate}
            loading={saving}
          />
        )}
      </Drawer>

      <CompanyViewDrawer
        companyId={viewCompanyId}
        open={!!viewCompanyId}
        onClose={() => setViewCompanyId(null)}
        onViewActivity={(id, title) => {
          setViewCompanyId(null);
          setActivityCompany({ id, title });
        }}
      />

      <CompanyActivityDrawer
        companyId={activityCompany?.id ?? null}
        companyTitle={activityCompany?.title}
        open={!!activityCompany}
        onClose={() => setActivityCompany(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => !deletingId && setDeleteTarget(null)}
        title="Delete company?"
        highlight={deleteTarget?.title}
        description="will be removed from the platform along with its linked data."
        confirmLabel="Confirm"
        onConfirm={confirmDelete}
        loading={!!deletingId}
      />
    </>
  );
}

function IconBtn({
  onClick,
  label,
  icon: Icon,
  danger,
  loading,
  disabled,
}: {
  onClick: () => void;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  danger?: boolean;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading}
      className={danger ? "btn-icon-danger" : "btn-icon"}
    >
      {loading ? <BrandedLoader size="xs" ring={false} /> : <Icon className="h-4 w-4" />}
    </button>
  );
}
