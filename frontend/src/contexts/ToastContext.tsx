"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: number;
  type: ToastType;
  message: string;
};

type ToastContextValue = {
  toast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION_MS = 4800;

const config: Record<
  ToastType,
  {
    label: string;
    Icon: typeof CheckCircle2;
    iconWrap: string;
    iconGlow: string;
    card: string;
    accent: string;
    labelColor: string;
  }
> = {
  success: {
    label: "Success",
    Icon: CheckCircle2,
    iconWrap:
      "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/35 ring-4 ring-emerald-100",
    iconGlow: "bg-emerald-400/25",
    card: "border-emerald-200/80 bg-gradient-to-br from-white via-white to-emerald-50/50",
    accent: "from-emerald-500 via-emerald-500 to-teal-500",
    labelColor: "text-emerald-700",
  },
  error: {
    label: "Error",
    Icon: AlertCircle,
    iconWrap:
      "bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-500/35 ring-4 ring-red-100",
    iconGlow: "bg-red-400/25",
    card: "border-red-200/80 bg-gradient-to-br from-white via-white to-red-50/50",
    accent: "from-red-500 via-red-500 to-rose-500",
    labelColor: "text-red-700",
  },
  info: {
    label: "Notice",
    Icon: Info,
    iconWrap:
      "bg-gradient-to-br from-[#6d4cff] to-[#8b5cff] shadow-lg shadow-[#6d4cff]/35 ring-4 ring-[#f3eeff]",
    iconGlow: "bg-[#6d4cff]/20",
    card: "border-[#e4dcff] bg-gradient-to-br from-white via-white to-[#f8f6ff]",
    accent: "from-[#6d4cff] via-[#7c5cff] to-[#8b5cff]",
    labelColor: "text-[#5b3fd4]",
  },
};

function ToastMessage({ message }: { message: string }) {
  const parts = message.split(/("[^"]+")/g).filter(Boolean);
  if (parts.length === 1) {
    return <span>{message}</span>;
  }
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('"') && part.endsWith('"') ? (
          <span key={i} className="font-semibold text-slate-900">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function ToastCard({ toast: t, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const c = config[t.type];
  const Icon = c.Icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -12, x: 16, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.92 }}
      transition={{ type: "spring", stiffness: 440, damping: 32 }}
      className={`pointer-events-auto relative w-full overflow-hidden rounded-2xl border shadow-[0_16px_40px_-12px_rgba(15,23,42,0.18)] ${c.card}`}
      role="alert"
    >
      <div className={`h-1 bg-gradient-to-r ${c.accent}`} />
      <motion.div
        className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r ${c.accent} opacity-60`}
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: TOAST_DURATION_MS / 1000, ease: "linear" }}
      />

      <div className="flex gap-3.5 p-4 pr-10">
        <div className="relative shrink-0">
          <span
            className={`absolute -inset-1 rounded-xl blur-md ${c.iconGlow}`}
            aria-hidden
          />
          <span
            className={`relative flex h-11 w-11 items-center justify-center rounded-xl text-white ${c.iconWrap}`}
          >
            <Icon className="h-5 w-5" strokeWidth={2.25} aria-hidden />
          </span>
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <p className={`text-[11px] font-bold uppercase tracking-wider ${c.labelColor}`}>
            {c.label}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            <ToastMessage message={t.message} />
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onDismiss}
        className="absolute right-2.5 top-2.5 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => dismiss(id), TOAST_DURATION_MS);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed right-4 top-4 z-[200] flex w-[min(100%,22rem)] flex-col gap-3 sm:right-6 sm:top-6"
        aria-live="polite"
        aria-atomic="true"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <ToastCard key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
