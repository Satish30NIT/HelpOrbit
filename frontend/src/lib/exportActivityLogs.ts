import type { CompanyActivityLog } from "@/types/activityLog";
export function exportActivityLogsCsv(items: CompanyActivityLog[], filename = "company-activity-logs.csv") {
  const headers = [
    "occurred_at",
    "action",
    "message",
    "company",
    "actor",
    "actor_email",
    "role",
    "ip_address",
  ];
  const rows = items.map((log) => [
    log.occurred_at,
    log.action,
    log.message,
    log.target?.label ?? "",
    log.actor.display_name,
    log.actor.email ?? "",
    log.actor.role ?? "",
    log.ip_address ?? "",
  ]);
  const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [headers.join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function activityExportFilename() {
  const d = new Date().toISOString().slice(0, 10);
  return `company-activity-${d}.csv`;
}
