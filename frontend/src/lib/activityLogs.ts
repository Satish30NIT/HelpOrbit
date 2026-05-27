import { api } from "./api";
import type {
  ActivityLogDocument,
  ActivityLogStats,
  PaginatedActivityLogs,
} from "@/types/activityLog";

type ApiWrap<T> = { success: boolean; data: T };

export type ActivityLogCategory = "all" | "company" | "user";

export type ActivityLogFilters = {
  category?: ActivityLogCategory;
  company_id?: string;
  user_id?: number;
  action?: string;
  actor_email?: string;
  search?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};

export type ActivityLogActorOption = {
  email: string;
  display_name: string;
};

function toQuery(params: ActivityLogFilters) {
  const q = new URLSearchParams();
  if (params.category && params.category !== "all") q.set("category", params.category);
  if (params.company_id) q.set("company_id", params.company_id);
  if (params.user_id) q.set("user_id", String(params.user_id));
  if (params.action) q.set("action", params.action);
  if (params.actor_email) q.set("actor_email", params.actor_email);
  if (params.search) q.set("search", params.search);
  if (params.from) q.set("from", params.from);
  if (params.to) q.set("to", params.to);
  q.set("page", String(Number(params.page) || 1));
  q.set("limit", String(Number(params.limit) || 20));
  return q.toString();
}

export async function fetchActivityLogStats(
  from?: string,
  to?: string,
  category: ActivityLogCategory = "all"
) {
  const q = new URLSearchParams();
  if (from) q.set("from", from);
  if (to) q.set("to", to);
  if (category !== "all") q.set("category", category);
  const res = await api.get<ApiWrap<ActivityLogStats>>(
    `/activity-logs/stats?${q.toString()}`
  );
  return res.data;
}

export async function fetchActivityLogActors() {
  const res = await api.get<ApiWrap<{ actors: ActivityLogActorOption[] }>>(
    "/activity-logs/actors"
  );
  return res.data.actors ?? [];
}

export async function fetchActivityLogDocument(logId: string) {
  const res = await api.get<ApiWrap<ActivityLogDocument>>(
    `/activity-logs/${logId}`
  );
  return res.data;
}

export async function fetchActivityLogs(params: ActivityLogFilters = {}) {
  const res = await api.get<ApiWrap<PaginatedActivityLogs>>(
    `/activity-logs?${toQuery(params)}`
  );
  return res.data;
}
