import { api } from "./api";
import type {
  PaginatedUsers,
  RoleOption,
  UserFormValues,
  UserListItem,
  UserStatusFilter,
} from "@/types/user";

type ApiWrap<T> = { success: boolean; data: T; message?: string };

export async function fetchRoles() {
  const res = await api.get<ApiWrap<{ roles: RoleOption[] }>>("/users/roles");
  return res.data.roles;
}

export async function fetchUsers(params: {
  search?: string;
  email?: string;
  company_id?: string;
  status?: UserStatusFilter;
  role_id?: number;
  page?: number;
  limit?: number;
}) {
  const q = new URLSearchParams();
  if (params.search) q.set("search", params.search);
  if (params.email) q.set("email", params.email);
  if (params.company_id) q.set("company_id", params.company_id);
  if (params.status && params.status !== "all") q.set("status", params.status);
  if (params.role_id) q.set("role_id", String(params.role_id));
  q.set("page", String(Number(params.page) || 1));
  q.set("limit", String(Number(params.limit) || 10));
  const res = await api.get<ApiWrap<PaginatedUsers>>(`/users?${q.toString()}`);
  return res.data;
}

export async function fetchUser(id: number) {
  const res = await api.get<ApiWrap<{ user: UserListItem }>>(`/users/${id}`);
  return res.data.user;
}

export function userToFormValues(user: UserListItem): UserFormValues {
  return {
    first_name: user.first_name,
    middle_name: user.middle_name || "",
    last_name: user.last_name,
    user_name: user.user_name,
    email: user.email,
    phone: user.phone || "",
    password: "",
    role_id: user.role_id,
    is_active: user.is_active,
    company_ids: user.companies?.map((c) => c.id) || [],
  };
}

export async function createUser(body: UserFormValues) {
  const payload = formToPayload(body, true);
  const res = await api.post<ApiWrap<{ user: UserListItem }>>("/users", payload);
  return res.data.user;
}

export async function updateUser(id: number, body: UserFormValues) {
  const payload = formToPayload(body, false);
  const res = await api.put<ApiWrap<{ user: UserListItem }>>(`/users/${id}`, payload);
  return res.data.user;
}

export async function deleteUser(id: number) {
  return api.del<ApiWrap<{ id: number; deleted: boolean }>>(`/users/${id}`);
}

function formToPayload(values: UserFormValues, isCreate: boolean) {
  const payload: Record<string, unknown> = {
    first_name: values.first_name.trim(),
    middle_name: values.middle_name.trim() || null,
    last_name: values.last_name.trim(),
    user_name: values.user_name.trim(),
    email: values.email.trim(),
    phone: values.phone.trim() || null,
    role_id: values.role_id,
    is_active: values.is_active,
    company_ids: values.company_ids,
  };
  if (isCreate || values.password.trim()) {
    payload.password = values.password;
  }
  return payload;
}

export function userDisplayName(user: Pick<UserListItem, "first_name" | "middle_name" | "last_name" | "user_name" | "email" | "id">) {
  const parts = [user.first_name, user.middle_name, user.last_name].filter(Boolean);
  if (parts.length) return parts.join(" ");
  return user.user_name || user.email || `User #${user.id}`;
}
