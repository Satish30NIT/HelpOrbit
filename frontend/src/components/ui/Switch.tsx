"use client";

import { motion } from "framer-motion";
import { BrandedLoader } from "@/components/ui/BrandedLoader";

type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  loading?: boolean;
  indeterminate?: boolean;
  id?: string;
  "aria-label"?: string;
};

export function Switch({
  checked,
  onChange,
  disabled,
  loading,
  indeterminate,
  id,
  "aria-label": ariaLabel,
}: SwitchProps) {
  const isDisabled = disabled || loading;
  const isOn = indeterminate ? false : checked;
  const thumbX = indeterminate ? 10 : checked ? 20 : 0;

  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={ariaLabel}
      aria-busy={loading}
      disabled={isDisabled}
      onClick={() => !isDisabled && onChange(!isOn)}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6d4cff]/20 disabled:cursor-not-allowed disabled:opacity-50 ${
        indeterminate
          ? "bg-[#6d4cff]/45"
          : checked
            ? "bg-[var(--primary)]"
            : "bg-slate-300"
      }`}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={`absolute left-0.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow-md ${
          loading ? "opacity-70" : ""
        }`}
        animate={{ x: thumbX }}
      />
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <BrandedLoader size="xs" ring={false} className="scale-[0.65]" />
        </span>
      )}
    </button>
  );
}
