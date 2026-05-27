import { api } from "./api";
import type {
  ActivityLogDocument,
  ActivityLogStats,
  PaginatedActivityLogs,
} from "@/types/activityLog";

type ApiWrap<T> = { success: boolean; data: T };

export type UserActivityLogFilters = {
  user_id?: number;
  action?: string;
  actor_email?: string;
  search?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};

function toQuery(params: UserActivityLogFilters) {
  const q = new URLSearchParams();
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

export async function fetchUserActivityLogStats(from?: string, to?: string) {
  const q = new URLSearchParams();
  if (from) q.set("from", from);
  if (to) q.set("to", to);
  const res = await api.get<ApiWrap<ActivityLogStats>>(
    `/users/activity-logs/stats?${q.toString()}`
  );
  return res.data;
}

export async function fetchUserActivityLogActors() {
  const res = await api.get<ApiWrap<{ actors: { email: string; display_name: string }[] }>>(
    "/users/activity-logs/actors"
  );
  return res.data.actors ?? [];
}

export async function fetchUserActivityLogDocument(logId: string) {
  const res = await api.get<ApiWrap<ActivityLogDocument>>(
    `/users/activity-logs/${logId}`
  );
  return res.data;
}

export async function fetchAllUserActivityLogs(params: UserActivityLogFilters = {}) {
  const res = await api.get<ApiWrap<PaginatedActivityLogs>>(
    `/users/activity-logs?${toQuery(params)}`
  );
  return res.data;
}
