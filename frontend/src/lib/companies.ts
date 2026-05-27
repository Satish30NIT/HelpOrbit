import { api } from "./api";
import type {
  CompanyDropdownItem,
  CompanyFormValues,
  CompanyListItem,
  PaginatedCompanies,
} from "@/types/company";

type ApiWrap<T> = { success: boolean; data: T; message?: string };

export type CompanyStatusFilter = "all" | "active" | "inactive";

/** Active companies for dropdowns (policies, etc.) */
export async function fetchCompanyDropdown(search?: string) {
  const q = new URLSearchParams({ dropdown: "1", limit: "50" });
  if (search) q.set("search", search);
  const res = await api.get<ApiWrap<{ companies: CompanyDropdownItem[] }>>(
    `/companies?${q.toString()}`
  );
  return res.data.companies;
}

export async function fetchCompanies(params: {
  search?: string;
  email?: string;
  status?: CompanyStatusFilter;
  page?: number;
  limit?: number;
}) {
  const q = new URLSearchParams();
  if (params.search) q.set("search", params.search);
  if (params.email) q.set("email", params.email);
  if (params.status && params.status !== "all") q.set("status", params.status);
  q.set("page", String(Number(params.page) || 1));
  q.set("limit", String(Number(params.limit) || 10));
  const res = await api.get<ApiWrap<PaginatedCompanies>>(`/companies?${q.toString()}`);
  return res.data;
}

export async function fetchCompany(id: string) {
  const res = await api.get<ApiWrap<{ company: CompanyListItem }>>(`/companies/${id}`);
  return res.data.company;
}

export async function createCompany(body: CompanyFormValues) {
  const res = await api.post<ApiWrap<{ company: CompanyListItem }>>("/companies", body);
  return res.data.company;
}

export async function updateCompany(id: string, body: Partial<CompanyFormValues>) {
  const res = await api.put<ApiWrap<{ company: CompanyListItem }>>(`/companies/${id}`, body);
  return res.data.company;
}

export async function deleteCompany(id: string) {
  return api.del<ApiWrap<{ id: string; deleted: boolean }>>(`/companies/${id}`);
}
