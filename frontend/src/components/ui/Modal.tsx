"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  wide?: boolean;
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  wide,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.button
            type="button"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            aria-label="Close modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={`relative max-h-[90vh] w-full overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 ${
              wide ? "max-w-3xl" : "max-w-lg"
            }`}
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
                {description && (
                  <p className="mt-1 text-sm text-slate-500">{description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="max-h-[calc(90vh-5rem)] overflow-y-auto px-6 py-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
