"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart2 } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { BrandedLoader } from "@/components/ui/BrandedLoader";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { fetchPolicy } from "@/lib/policies";
import type { PolicyDetail } from "@/types/policy";
import { ApiError } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";

type Props = {
  policyId: string | null;
  open: boolean;
  onClose: () => void;
  onManageStatus?: (policyId: string) => void;
};

export function PolicyViewDrawer({
  policyId,
  open,
  onClose,
  onManageStatus,
}: Props) {
  const { toast } = useToast();
  const [data, setData] = useState<PolicyDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!policyId) return;
    setLoading(true);
    try {
      setData(await fetchPolicy(policyId));
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to load policy", "error");
      onClose();
    } finally {
      setLoading(false);
    }
  }, [policyId, toast, onClose]);

  useEffect(() => {
    if (open && policyId) load();
    if (!open) setData(null);
  }, [open, policyId, load]);

  const { policy, company, statistics, assigned_users } = data || {};

  return (
    <Drawer
      open={open}
      onClose={onClose}
      size="panel"
      title={policy?.title || "Policy details"}
      description={company?.title}
    >
      <div className="relative min-h-[14rem]">
        <LoadingOverlay show={loading && !!data} bar />
        {loading && !data ? (
          <div className="flex justify-center py-16">
            <BrandedLoader size="md" message="Loading policy…" showMessage />
          </div>
        ) : data ? (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <MiniStat label="Assigned" value={statistics!.total_assigned} />
            <MiniStat label="Acknowledged" value={statistics!.acknowledged} tone="success" />
            <MiniStat label="Pending" value={statistics!.pending} tone="warning" />
          </div>

          {onManageStatus && policyId && (
            <button
              type="button"
              onClick={() => onManageStatus(policyId)}
              className="btn-primary w-full"
            >
              <BarChart2 className="h-4 w-4" />
              View acknowledgements
            </button>
          )}

          <section className="rounded-xl border border-[var(--border)] bg-[var(--primary-soft)]/30 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Company
            </h3>
            <p className="mt-2 font-semibold text-[var(--text-primary)]">{company!.title}</p>
            <p className="text-sm text-[var(--text-secondary)]">{company!.email}</p>
          </section>

          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Description
            </h3>
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-xl border border-[var(--border)] bg-[var(--bg-main)] p-4 text-sm leading-relaxed text-[var(--text-secondary)]">
              {policy!.description}
            </pre>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Assigned users ({assigned_users!.length})
            </h3>
            <div className="max-h-48 overflow-auto rounded-xl border border-[var(--border)]">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="table-head">
                    <th className="px-3 py-2">User</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {assigned_users!.map((u) => (
                    <tr key={u.id} className="table-row">
                      <td className="px-3 py-2">
                        <p className="font-medium">{u.user_name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{u.email}</p>
                      </td>
                      <td className="px-3 py-2">
                        <span className={u.is_acknowledged ? "badge-success" : "badge-warning"}>
                          {u.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
        ) : null}
      </div>
    </Drawer>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "success" | "warning";
}) {
  const bg =
    tone === "success"
      ? "bg-emerald-50 border-emerald-100"
      : tone === "warning"
      ? "bg-amber-50 border-amber-100"
      : "bg-[var(--primary-soft)] border-[var(--border)]";
  return (
    <div className={`rounded-xl border p-3 text-center ${bg}`}>
      <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}
