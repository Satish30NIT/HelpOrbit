export type ActivityLogActor = {
  user_id: number | null;
  email: string | null;
  user_name: string | null;
  role: string | null;
  display_name: string;
};

export type ActivityLogTarget = {
  type: string;
  id: string;
  label: string;
};

export type CompanyActivityLog = {
  id: string;
  occurred_at: string;
  category: string;
  action: string;
  severity: string;
  message: string;
  actor: ActivityLogActor;
  target: ActivityLogTarget;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  es_synced_at: string | null;
  source?: string;
};

export type PaginatedActivityLogs = {
  items: CompanyActivityLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  source: string;
};

export type ActivityStatMetric = {
  count: number;
  trend: number;
};

export type ActivityLogStats = {
  period: { from: string; to: string };
  total: ActivityStatMetric;
  created: ActivityStatMetric;
  updated: ActivityStatMetric;
  deleted: ActivityStatMetric;
  logins: ActivityStatMetric;
};

export type ActivityLogDocument = {
  source: string;
  index: string | null;
  id: string;
  document: Record<string, unknown>;
  note?: string;
};
