import { api } from "./api";
import type {
  Company,
  PaginatedPolicies,
  PolicyDetail,
  PolicyFormValues,
  PolicyStatusData,
} from "@/types/policy";

type ApiWrap<T> = { success: boolean; data: T; message?: string };

/** @deprecated Use fetchCompanyDropdown from @/lib/companies */
export async function fetchCompanies(search?: string) {
  const { fetchCompanyDropdown } = await import("./companies");
  const list = await fetchCompanyDropdown(search);
  return list as Company[];
}

export type PolicyStatusFilter = "all" | "pending" | "complete" | "unassigned";

export async function fetchPolicies(params: {
  search?: string;
  company_id?: string;
  status?: PolicyStatusFilter;
  page?: number;
  limit?: number;
}) {
  const q = new URLSearchParams();
  if (params.search) q.set("search", params.search);
  if (params.company_id) q.set("company_id", params.company_id);
  if (params.status && params.status !== "all") q.set("status", params.status);
  q.set("page", String(Number(params.page) || 1));
  q.set("limit", String(Number(params.limit) || 10));
  const res = await api.get<ApiWrap<PaginatedPolicies>>(`/policies?${q.toString()}`);
  return res.data;
}

export async function fetchPolicy(id: string) {
  const res = await api.get<ApiWrap<PolicyDetail>>(`/policies/${id}`);
  return res.data;
}

export async function fetchPolicyStatus(id: string) {
  const res = await api.get<ApiWrap<PolicyStatusData>>(`/policies/${id}/status`);
  return res.data;
}

export async function createPolicy(body: PolicyFormValues) {
  const res = await api.post<ApiWrap<PolicyDetail>>("/policies", body);
  return res.data;
}

export async function updatePolicy(
  id: string,
  body: Partial<Pick<PolicyFormValues, "policy_name" | "title" | "description" | "is_active">>
) {
  const res = await api.put<ApiWrap<PolicyDetail>>(`/policies/${id}`, body);
  return res.data;
}

export async function deletePolicy(id: string) {
  return api.del<ApiWrap<{ id: string; deleted: boolean }>>(`/policies/${id}`);
}

export async function resetUserAck(policyId: string, userId: number) {
  return api.post(`/policies/${policyId}/reset-user`, { user_id: userId });
}

export async function restrictUser(policyId: string, userId: number) {
  return api.post(`/policies/${policyId}/restrict-user`, { user_id: userId });
}

export async function assignUser(policyId: string, userId: number) {
  return api.post(`/policies/${policyId}/assign-user`, { user_id: userId });
}
