"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";
import { BrandedLoader } from "@/components/ui/BrandedLoader";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  highlight?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
  loading?: boolean;
};

export function ConfirmDialog({
  open,
  title,
  description,
  highlight,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onClose,
  loading = false,
}: Props) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          aria-describedby={description || highlight ? "confirm-dialog-desc" : undefined}
        >
          <motion.div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-hidden
          />

          <motion.div
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[0_20px_50px_-12px_rgba(17,24,39,0.2)]"
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 6 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
                  <Trash2 className="h-5 w-5" strokeWidth={2} aria-hidden />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <h2
                    id="confirm-dialog-title"
                    className="text-lg font-bold leading-snug text-[var(--text-primary)]"
                  >
                    {title}
                  </h2>
                  {(description || highlight) && (
                    <p
                      id="confirm-dialog-desc"
                      className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]"
                    >
                      {highlight ? (
                        <>
                          <span className="font-semibold text-[var(--text-primary)]">
                            &ldquo;{highlight}&rdquo;
                          </span>{" "}
                        </>
                      ) : null}
                      {description ?? "will be removed permanently."}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 border-t border-[var(--border)] bg-slate-50/60 px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="btn-secondary h-11 min-h-11 flex-1"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => void onConfirm()}
                disabled={loading}
                className="btn-primary h-11 min-h-11 flex-1"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <BrandedLoader size="xs" ring={false} />
                    Confirming…
                  </span>
                ) : (
                  confirmLabel
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
