"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { BrandedLoader } from "@/components/ui/BrandedLoader";
import { fetchActivityLogDocument } from "@/lib/activityLogs";
import type { ActivityLogDocument } from "@/types/activityLog";
import { actionLabel } from "@/lib/activityLogLabels";
import type { CompanyActivityLog } from "@/types/activityLog";
import { ApiError } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";

type Props = {
  logId: string | null;
  logPreview?: CompanyActivityLog | null;
  open: boolean;
  onClose: () => void;
  fetchDocument?: (logId: string) => Promise<ActivityLogDocument>;
};

export function ActivityLogJsonDrawer({
  logId,
  logPreview,
  open,
  onClose,
  fetchDocument = fetchActivityLogDocument,
}: Props) {
  const { toast } = useToast();
  const [document, setDocument] = useState<Record<string, unknown> | null>(null);
  const [meta, setMeta] = useState<{ source: string; index: string | null; id: string; note?: string } | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const jsonText = useMemo(
    () => (document ? JSON.stringify(document, null, 2) : ""),
    [document]
  );

  const load = useCallback(async () => {
    if (!logId || !open) return;
    setLoading(true);
    try {
      const data = await fetchDocument(logId);
      setMeta({
        source: data.source,
        index: data.index,
        id: data.id,
        note: data.note,
      });
      setDocument(data.document);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to load log document", "error");
      onClose();
    } finally {
      setLoading(false);
    }
  }, [logId, open, toast, onClose, fetchDocument]);

  useEffect(() => {
    if (open && logId) {
      setCopied(false);
      load();
    }
    if (!open) {
      setDocument(null);
      setMeta(null);
    }
  }, [open, logId, load]);

  async function handleCopy() {
    if (!jsonText) return;
    try {
      await navigator.clipboard.writeText(jsonText);
      setCopied(true);
      toast("JSON copied to clipboard", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Could not copy to clipboard", "error");
    }
  }

  const title = logPreview
    ? `${logPreview.target?.label ?? "Activity"} · ${actionLabel(logPreview.action)}`
    : "Activity log JSON";

  return (
    <Drawer
      open={open}
      onClose={onClose}
      size="wide"
      title="Elasticsearch document"
      description={title}
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Close
          </button>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!jsonText || loading}
            className="btn-primary"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy JSON"}
          </button>
        </div>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        {meta && !loading && (
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-[var(--primary-soft)] px-2.5 py-1 font-semibold capitalize text-[var(--primary)]">
              Source: {meta.source}
            </span>
            {meta.index && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-[var(--text-secondary)]">
                Index: {meta.index}
              </span>
            )}
            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-mono text-[var(--text-secondary)]">
              ID: {meta.id}
            </span>
          </div>
        )}
        {meta?.note && (
          <p className="rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {meta.note}
          </p>
        )}
        {loading ? (
          <div className="flex justify-center py-16">
            <BrandedLoader size="md" message="Loading document…" showMessage />
          </div>
        ) : (
          <div className="relative flex min-h-0 flex-1 flex-col">
            <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Raw JSON
              </p>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!jsonText}
                title="Copy raw JSON"
                className="btn-icon"
                aria-label="Copy raw JSON"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <pre className="code-block min-h-[calc(100dvh-15rem)] max-h-[calc(100dvh-15rem)] flex-1 overflow-auto">
              <code className="font-mono text-[13px]">{jsonText}</code>
            </pre>
          </div>
        )}
      </div>
    </Drawer>
  );
}
