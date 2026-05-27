import { api } from "./api";
import type {
  ActivityLogDocument,
  ActivityLogStats,
  PaginatedActivityLogs,
} from "@/types/activityLog";

type ApiWrap<T> = { success: boolean; data: T };

export type ActivityLogFilters = {
  company_id?: string;
  action?: string;
  actor_email?: string;
  search?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};

function toQuery(params: ActivityLogFilters) {
  const q = new URLSearchParams();
  if (params.company_id) q.set("company_id", params.company_id);
  if (params.action) q.set("action", params.action);
  if (params.actor_email) q.set("actor_email", params.actor_email);
  if (params.search) q.set("search", params.search);
  if (params.from) q.set("from", params.from);
  if (params.to) q.set("to", params.to);
  q.set("page", String(Number(params.page) || 1));
  q.set("limit", String(Number(params.limit) || 20));
  return q.toString();
}

export async function fetchActivityLogStats(from?: string, to?: string) {
  const q = new URLSearchParams();
  if (from) q.set("from", from);
  if (to) q.set("to", to);
  const res = await api.get<ApiWrap<ActivityLogStats>>(
    `/companies/activity-logs/stats?${q.toString()}`
  );
  return res.data;
}

export type ActivityLogActorOption = {
  email: string;
  display_name: string;
};

export async function fetchActivityLogActors() {
  const res = await api.get<ApiWrap<{ actors: ActivityLogActorOption[] }>>(
    "/companies/activity-logs/actors"
  );
  return res.data.actors ?? [];
}

export async function fetchActivityLogDocument(logId: string) {
  const res = await api.get<ApiWrap<ActivityLogDocument>>(
    `/companies/activity-logs/${logId}`
  );
  return res.data;
}

export async function fetchAllCompanyActivityLogs(params: ActivityLogFilters = {}) {
  const res = await api.get<ApiWrap<PaginatedActivityLogs>>(
    `/companies/activity-logs?${toQuery(params)}`
  );
  return res.data;
}

export async function fetchCompanyActivityLogs(
  companyId: string,
  params: Omit<ActivityLogFilters, "company_id"> = {}
) {
  const res = await api.get<ApiWrap<PaginatedActivityLogs>>(
    `/companies/${companyId}/activity-logs?${toQuery(params)}`
  );
  return res.data;
}
