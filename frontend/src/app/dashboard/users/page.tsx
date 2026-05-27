"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Pencil, Trash2, Mail, History } from "lucide-react";
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
import { TablePagination } from "@/components/ui/TablePagination";
import { UserForm, UserFormFooter } from "@/components/users/UserForm";
import {
  createUser,
  deleteUser,
  fetchRoles,
  fetchUsers,
  updateUser,
  userDisplayName,
  userToFormValues,
} from "@/lib/users";
import { fetchCompanyDropdown } from "@/lib/companies";
import type { UserListItem, UserStatusFilter } from "@/types/user";
import type { RoleOption } from "@/types/user";
import { ApiError } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";

export default function UsersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role_name?.toLowerCase() === "admin";

  const [items, setItems] = useState<UserListItem[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0, limit: 10 });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>("all");
  const [companyFilter, setCompanyFilter] = useState("");
  const [companies, setCompanies] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserListItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserListItem | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const initialLoading = loading && items.length === 0;
  const listLoading = loading && !initialLoading;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchUsers({
        search: debouncedSearch || undefined,
        company_id: companyFilter || undefined,
        status: statusFilter,
        page,
        limit: pagination.limit,
      });
      setItems(data.items);
      setPagination({
        total: data.pagination.total,
        totalPages: data.pagination.totalPages,
        limit: data.pagination.limit,
      });
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, companyFilter, statusFilter, page, pagination.limit, toast]);

  useEffect(() => {
    if (!isAdmin) router.replace("/dashboard");
  }, [isAdmin, router]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, companyFilter]);

  useEffect(() => {
    if (isAdmin) {
      load();
      fetchRoles().then(setRoles).catch(() => {});
      fetchCompanyDropdown().then((c) => setCompanies(c)).catch(() => {});
    }
  }, [isAdmin, load]);

  const pageHeader = useMemo(
    () => ({
      title: "User Management",
      description: "Create users, map them to companies, and review audit logs",
      breadcrumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Users" },
      ],
    }),
    []
  );
  usePageHeader(isAdmin ? pageHeader : null);

  if (!isAdmin) return null;

  async function handleCreate(values: Parameters<typeof createUser>[0]) {
    setSaving(true);
    try {
      await createUser(values);
      toast("User created successfully", "success");
      setCreateOpen(false);
      await load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to create user", "error");
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(values: Parameters<typeof createUser>[0]) {
    if (!editUser) return;
    setSaving(true);
    try {
      await updateUser(editUser.id, values);
      toast("User updated successfully", "success");
      setEditUser(null);
      await load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to update user", "error");
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      await deleteUser(deleteTarget.id);
      toast("User deleted", "success");
      setDeleteTarget(null);
      await load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to delete user", "error");
    } finally {
      setDeletingId(null);
    }
  }

  const activeCount = items.filter((u) => u.is_active).length;

  return (
    <>
      <DataPageLayout
        toolbar={
          <PageToolbar>
            <button type="button" onClick={() => setCreateOpen(true)} className="btn-primary">
              <Plus className="h-4 w-4" />
              Add User
            </button>
          </PageToolbar>
        }
        metrics={
          <PageMetricsRow columns={3}>
            <div className="stat-card">
              <p className="type-meta">Total (this page)</p>
              <p className="mt-1 text-2xl font-semibold">{pagination.total}</p>
            </div>
            <div className="stat-card">
              <p className="type-meta">Active on page</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--success)]">{activeCount}</p>
            </div>
            <div className="stat-card">
              <p className="type-meta">Audit trail</p>
              <Link href="/dashboard/activity?category=user" className="btn-secondary mt-2 inline-flex text-sm">
                <History className="h-4 w-4" />
                User activity logs
              </Link>
            </div>
          </PageMetricsRow>
        }
        filters={
          <PageFilterBar singleRow busy={listLoading}>
            <div className="relative min-w-0 flex-1">
              <input
                type="search"
                placeholder="Search users…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-compact w-full pr-10"
              />
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            </div>
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="input-compact min-w-[10rem]"
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
              onChange={(e) => setStatusFilter(e.target.value as UserStatusFilter)}
              className="input-compact min-w-[9rem]"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </PageFilterBar>
        }
        table={
          <DataTableModule
            pagination={
              !initialLoading ? (
                <TablePagination
                  page={page}
                  totalPages={pagination.totalPages}
                  total={pagination.total}
                  limit={pagination.limit}
                  onPageChange={setPage}
                  onLimitChange={(limit) => {
                    setPagination((p) => ({ ...p, limit }));
                    setPage(1);
                  }}
                  loading={listLoading}
                  itemLabel="users"
                />
              ) : undefined
            }
          >
            {initialLoading ? (
              <div className="flex flex-1 items-center justify-center py-20">
                <BrandedLoader size="md" message="Loading users…" showMessage />
              </div>
            ) : (
              <>
                <LoadingOverlay show={listLoading} bar />
                <div className="table-scroll-body">
                  <table className="min-w-full border-collapse text-left text-sm">
                    <thead className="table-head">
                      <tr>
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Contact</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Companies</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-16 text-center text-[var(--text-secondary)]">
                            No users found
                          </td>
                        </tr>
                      ) : (
                        items.map((u) => (
                          <tr key={u.id} className="table-row">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="policy-avatar">{u.first_name?.charAt(0) || "U"}</div>
                                <div>
                                  <p className="font-semibold">{userDisplayName(u)}</p>
                                  <p className="type-meta">@{u.user_name}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <p className="flex items-center gap-2">
                                <Mail className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                                {u.email}
                              </p>
                              {u.phone && <p className="type-meta">{u.phone}</p>}
                            </td>
                            <td className="px-4 py-3 capitalize">{u.role_name}</td>
                            <td className="px-4 py-3">
                              <p className="max-w-[14rem] truncate text-[var(--text-secondary)]">
                                {u.companies?.length
                                  ? u.companies.map((c) => c.title).join(", ")
                                  : "—"}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <span className={u.is_active ? "badge-success" : "badge-muted"}>
                                {u.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-1">
                                <Link
                                  href={`/dashboard/activity?user_id=${u.id}&category=user`}
                                  className="btn-icon"
                                  title="Activity log"
                                >
                                  <History className="h-4 w-4" />
                                </Link>
                                <button
                                  type="button"
                                  className="btn-icon"
                                  title="Edit"
                                  onClick={() => setEditUser(u)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  className="btn-icon-danger"
                                  title="Delete"
                                  disabled={!!deletingId}
                                  onClick={() => setDeleteTarget(u)}
                                >
                                  {deletingId === u.id ? (
                                    <BrandedLoader size="xs" ring={false} />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </DataTableModule>
        }
      />

      <Drawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create User"
        description="Map user to one or more companies"
        footer={
          <UserFormFooter
            onCancel={() => setCreateOpen(false)}
            submitLabel="Save User"
            loading={saving}
          />
        }
      >
        <UserForm roles={roles} onSubmit={handleCreate} loading={saving} />
      </Drawer>

      <Drawer
        open={!!editUser}
        onClose={() => setEditUser(null)}
        title="Edit User"
        footer={
          <UserFormFooter
            onCancel={() => setEditUser(null)}
            submitLabel="Update User"
            loading={saving}
          />
        }
      >
        {editUser && (
          <UserForm
            isEdit
            roles={roles}
            initial={userToFormValues(editUser)}
            onSubmit={handleUpdate}
            loading={saving}
          />
        )}
      </Drawer>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => !deletingId && setDeleteTarget(null)}
        title="Delete user?"
        highlight={deleteTarget ? userDisplayName(deleteTarget) : undefined}
        description="will be deactivated and removed from active listings."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        loading={!!deletingId}
      />
    </>
  );
}
