import { Pencil, Trash2, UserPlus, Users, type LucideIcon } from "lucide-react";

export const USER_ACTION_LABELS: Record<string, string> = {
  "user.created": "Created",
  "user.updated": "Updated",
  "user.deleted": "Deleted",
};

export const USER_ACTION_FILTER_OPTIONS = Object.keys(USER_ACTION_LABELS);

export function userActionLabel(action: string) {
  return USER_ACTION_LABELS[action] || action.replace("user.", "").replace(/^\w/, (c) => c.toUpperCase());
}

export function userActionBadgeClass(action: string) {
  if (action === "user.created") return "badge-success";
  if (action === "user.deleted") return "badge-danger";
  if (action === "user.updated") return "badge-warning";
  return "badge-muted";
}

export function userActionIcon(action: string): LucideIcon {
  if (action === "user.created") return UserPlus;
  if (action === "user.deleted") return Trash2;
  if (action === "user.updated") return Pencil;
  return Users;
}
