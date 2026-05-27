"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

type DrawerSize = "panel" | "wide" | "ack";

const sizeClasses: Record<DrawerSize, string> = {
  panel: "w-full sm:w-[40vw] sm:min-w-[360px] sm:max-w-[640px]",
  wide: "w-full sm:w-[min(56rem,92vw)]",
  ack: "w-full md:w-[75vw] lg:w-[58vw] lg:max-w-[1100px]",
};

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  header?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: DrawerSize;
};

export function Drawer({
  open,
  onClose,
  title,
  description,
  header,
  children,
  footer,
  size = "panel",
}: DrawerProps) {
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
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            aria-label="Close drawer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className={`relative flex h-full flex-col bg-[var(--bg-card)] shadow-[var(--shadow-lg)] ${sizeClasses[size]}`}
            style={{ borderTopLeftRadius: "var(--radius-modal)", borderBottomLeftRadius: "var(--radius-modal)" }}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
          >
            <header className="sticky top-0 z-10 shrink-0 border-b border-[var(--border)] bg-[var(--bg-card)]/95 px-6 py-5 backdrop-blur-sm">
              <div className="flex items-start justify-between gap-4">
                {header ?? (
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold text-[var(--text-primary)]">
                      {title}
                    </h2>
                    {description && (
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>
                    )}
                  </div>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-icon shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
            </div>
            {footer && (
              <footer className="sticky bottom-0 shrink-0 border-t border-[var(--border)] bg-[var(--bg-card)] px-6 py-4 shadow-[0_-4px_20px_-4px_rgba(17,24,39,0.06)]">
                {footer}
              </footer>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
