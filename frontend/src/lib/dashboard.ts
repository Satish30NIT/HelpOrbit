import { api } from "./api";

export type DashboardStats = {
  companies: number;
  users: number;
  policies: number;
  pending_acknowledgements: number;
};

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await api.get<{ success: boolean; data: DashboardStats }>(
    "/dashboard/stats"
  );
  return res.data;
}
