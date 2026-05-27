import {
  Building2,
  LogIn,
  Pencil,
  Trash2,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import type { ActivityLogCategory } from "@/lib/activityLogs";

export const ACTION_LABELS: Record<string, string> = {
  "company.created": "Company created",
  "company.updated": "Company updated",
  "company.deleted": "Company deleted",
  "user.created": "User created",
  "user.updated": "User updated",
  "user.deleted": "User deleted",
  login_success: "Login",
};

const COMPANY_ACTIONS = ["company.created", "company.updated", "company.deleted", "login_success"];
const USER_ACTIONS = ["user.created", "user.updated", "user.deleted"];

export function actionFilterOptions(category: ActivityLogCategory = "all"): string[] {
  if (category === "company") return COMPANY_ACTIONS;
  if (category === "user") return USER_ACTIONS;
  return [...COMPANY_ACTIONS, ...USER_ACTIONS];
}

export function actionLabel(action: string) {
  return (
    ACTION_LABELS[action] ||
    action.replace(/^(company|user)\./, "").replace(/^\w/, (c) => c.toUpperCase())
  );
}

export function actionBadgeClass(action: string) {
  if (action.endsWith(".created")) return "badge-success";
  if (action.endsWith(".deleted")) return "badge-danger";
  if (action.endsWith(".updated")) return "badge-warning";
  if (action === "login_success") return "badge-info";
  return "badge-muted";
}

export function actionIcon(action: string): LucideIcon {
  if (action === "company.created") return Building2;
  if (action === "company.deleted") return Trash2;
  if (action === "company.updated") return Pencil;
  if (action === "user.created") return UserPlus;
  if (action === "user.deleted") return Trash2;
  if (action === "user.updated") return Pencil;
  if (action === "login_success") return LogIn;
  return Building2;
}

export function actionIconClass(action: string): string {
  if (action.endsWith(".created")) return "bg-emerald-100 text-emerald-600";
  if (action.endsWith(".deleted")) return "bg-red-100 text-red-600";
  if (action.endsWith(".updated")) return "bg-amber-100 text-amber-600";
  if (action === "login_success") return "bg-sky-100 text-sky-600";
  return "bg-slate-100 text-slate-600";
}

export function categoryLabel(category: string) {
  if (category === "company") return "Company";
  if (category === "user") return "User";
  return category || "—";
}

export function shortTargetId(id: string | undefined, targetType?: string): string {
  if (!id) return "";
  const compact = id.replace(/-/g, "").slice(0, 8).toUpperCase();
  const prefix = targetType === "user" ? "USR" : "CMP";
  return `${prefix}-${compact.slice(0, 4)}`;
}

export function metricTitles(category: ActivityLogCategory = "all") {
  if (category === "user") {
    return {
      total: "Total Events",
      created: "Users Created",
      updated: "Users Updated",
      deleted: "Users Deleted",
      logins: null as string | null,
    };
  }
  if (category === "company") {
    return {
      total: "Total Events",
      created: "Companies Created",
      updated: "Companies Updated",
      deleted: "Companies Deleted",
      logins: "User Logins",
    };
  }
  return {
    total: "Total Events",
    created: "Created",
    updated: "Updated",
    deleted: "Deleted",
    logins: "User Logins",
  };
}
