"use client";

import { useCallback, useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { BrandedLoader } from "@/components/ui/BrandedLoader";
import {
  assignUser,
  fetchPolicyStatus,
  resetUserAck,
  restrictUser,
} from "@/lib/policies";
import type { PolicyStatusData } from "@/types/policy";
import { ApiError } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";

type Props = {
  policyId: string | null;
  open: boolean;
  onClose: () => void;
  onUpdated?: () => void;
};

export function PolicyStatusModal({ policyId, open, onClose, onUpdated }: Props) {
  const { toast } = useToast();
  const [data, setData] = useState<PolicyStatusData | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionUserId, setActionUserId] = useState<number | null>(null);
  const [assignUserId, setAssignUserId] = useState("");

  const load = useCallback(async () => {
    if (!policyId) return;
    setLoading(true);
    try {
      setData(await fetchPolicyStatus(policyId));
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to load status", "error");
    } finally {
      setLoading(false);
    }
  }, [policyId, toast]);

  useEffect(() => {
    if (open && policyId) load();
    if (!open) {
      setData(null);
      setAssignUserId("");
    }
  }, [open, policyId, load]);

  async function runAction(
    fn: () => Promise<unknown>,
    successMsg: string
  ) {
    try {
      await fn();
      toast(successMsg, "success");
      await load();
      onUpdated?.();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Action failed", "error");
    } finally {
      setActionUserId(null);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={data ? `Status: ${data.title}` : "Policy status"}
      wide
    >
      {loading && !data ? (
        <div className="flex justify-center py-12">
          <BrandedLoader size="md" message="Loading status…" showMessage />
        </div>
      ) : data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Assigned" value={data.total_assigned} />
            <Stat label="Acknowledged" value={data.acknowledged} tone="success" />
            <Stat label="Pending" value={data.pending} tone="warning" />
          </div>

          <div className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
            <div className="flex-1 min-w-[140px]">
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Re-assign user by ID
              </label>
              <input
                type="number"
                min={1}
                value={assignUserId}
                onChange={(e) => setAssignUserId(e.target.value)}
                placeholder="User ID"
                className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
            <button
              type="button"
              disabled={!assignUserId || !policyId}
              onClick={() =>
                runAction(
                  () => assignUser(policyId!, Number(assignUserId)),
                  "User assigned"
                )
              }
              className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Assign user
            </button>
          </div>

          <UserTable
            title="All assigned users"
            users={data.users}
            actionUserId={actionUserId}
            onReset={(uid) => {
              setActionUserId(uid);
              runAction(() => resetUserAck(policyId!, uid), "Acknowledgement reset");
            }}
            onRestrict={(uid) => {
              setActionUserId(uid);
              runAction(() => restrictUser(policyId!, uid), "User removed from policy");
            }}
          />
        </div>
      ) : null}
    </Modal>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "success" | "warning";
}) {
  const colors =
    tone === "success"
      ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40"
      : tone === "warning"
      ? "bg-amber-50 text-amber-800 dark:bg-amber-950/40"
      : "bg-slate-50 text-slate-800 dark:bg-slate-800/50";
  return (
    <div className={`rounded-xl p-3 text-center ${colors}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium uppercase tracking-wide opacity-80">{label}</p>
    </div>
  );
}

function UserTable({
  title,
  users,
  actionUserId,
  onReset,
  onRestrict,
}: {
  title: string;
  users: PolicyStatusData["users"];
  actionUserId: number | null;
  onReset: (userId: number) => void;
  onRestrict: (userId: number) => void;
}) {
  if (!users.length) {
    return (
      <p className="text-sm text-slate-500">No users assigned to this policy yet.</p>
    );
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900">
            <tr>
              <th className="px-3 py-2">User</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Ack date</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-3 py-2 font-medium">{u.user_name}</td>
                <td className="px-3 py-2 text-slate-600">{u.email}</td>
                <td className="px-3 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      u.is_acknowledged
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {u.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-slate-500">
                  {u.acknowledged_at
                    ? new Date(u.acknowledged_at).toLocaleString()
                    : "—"}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {u.is_acknowledged && (
                      <button
                        type="button"
                        disabled={actionUserId === u.user_id}
                        onClick={() => onReset(u.user_id)}
                        className="rounded border border-slate-300 px-2 py-0.5 text-xs hover:bg-slate-50"
                      >
                        Reset
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={actionUserId === u.user_id}
                      onClick={() => onRestrict(u.user_id)}
                      className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-700 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
