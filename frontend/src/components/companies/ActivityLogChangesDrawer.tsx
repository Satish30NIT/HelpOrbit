"use client";

import { useEffect, useMemo, useState } from "react";
import { Braces, Check, Copy } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import {
  getChangeRows,
  parseChangesRowsFromJson,
} from "@/lib/activityLogChangeSummary";
import type { CompanyActivityLog } from "@/types/activityLog";
import { useToast } from "@/contexts/ToastContext";

type Props = {
  open: boolean;
  json: string;
  logPreview?: CompanyActivityLog | null;
  onClose: () => void;
};

export function ActivityLogChangesDrawer({ open, json, logPreview, onClose }: Props) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const rows = useMemo(() => {
    const fromMeta = getChangeRows(logPreview?.metadata);
    if (fromMeta.length > 0) return fromMeta;
    return parseChangesRowsFromJson(json);
  }, [json, logPreview?.metadata]);

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  async function handleCopy() {
    if (!json) return;
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      toast("Changes JSON copied", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Could not copy to clipboard", "error");
    }
  }

  const title = logPreview?.message ?? "Activity changes";

  return (
    <Drawer
      open={open}
      onClose={onClose}
      size="wide"
      title="Field changes"
      description={title}
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Close
          </button>
          <button type="button" onClick={handleCopy} disabled={!json} className="btn-primary">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy JSON"}
          </button>
        </div>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--primary-soft)]/40 px-3 py-2 text-sm text-[var(--text-secondary)]">
          <Braces className="h-4 w-4 shrink-0 text-[var(--primary)]" aria-hidden />
          <span>{rows.length} field{rows.length === 1 ? "" : "s"} changed</span>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--border)]">
          <div className="max-h-[calc(100dvh-14rem)] overflow-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="table-head sticky top-0 z-10">
                <tr>
                  <th className="w-[28%] pl-5">Column name</th>
                  <th className="w-[36%]">Previous value</th>
                  <th className="w-[36%] pr-5">New value</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr className="table-row">
                    <td colSpan={3} className="px-5 py-8 text-center text-[var(--text-secondary)]">
                      No changes to display
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.field} className="table-row">
                      <td className="px-5 py-3 align-top font-mono text-xs font-semibold text-[var(--text-primary)]">
                        {row.field}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span className="panel-previous-value inline-block rounded-md px-2 py-1 text-xs line-through decoration-[var(--previous-border)]">
                          {row.from}
                        </span>
                      </td>
                      <td className="pr-5 py-3 align-top">
                        <span className="panel-current-value inline-block rounded-md px-2 py-1 text-xs font-medium">
                          {row.to}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
